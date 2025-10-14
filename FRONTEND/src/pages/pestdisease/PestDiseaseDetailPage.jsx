import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  Bug, 
  MapPin, 
  Calendar, 
  Clock, 
  User, 
  Edit, 
  Trash2,
  FileText,
  AlertCircle,
  Image as ImageIcon,
  Loader,
  Ruler,
  Map,
  Download,
  Share,
  Copy,
  CheckCircle,
  Maximize2,
  Navigation,
  X
} from 'lucide-react';
import Swal from 'sweetalert2';

// Leaflet imports
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix default icon paths for Leaflet (Vite/webpack friendly)
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const statusColors = {
  'Pending': 'bg-amber-100 text-amber-800 border-amber-200',
  'Monitoring': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Treatment Ongoing': 'bg-orange-100 text-orange-800 border-orange-200',
  'Resolved': 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

const urgencyColors = {
  'Low (Routine monitoring)': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Medium (Schedule treatment)': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'High (Immediate action needed)': 'bg-orange-100 text-orange-800 border-orange-200',
  'Emergency (Critical threat)': 'bg-red-100 text-red-800 border-red-200',
};

const typeIcons = {
  'Pest Infestation': '🐛',
  'Disease': '🦠',
  'Both': '⚠️',
  'Other': '❓'
};

const PestDiseaseDetailPage = ({ viewOnly = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine the base path based on current route (inventory or supervisor)
  const basePath = location.pathname.includes('/inventory/') ? '/inventory/pest-disease' : '/supervisor/pest-disease';
  
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [copiedId, setCopiedId] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchCurrentUser = () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setCurrentUser(user);
      }
    } catch (err) {
      console.error('Error fetching current user:', err);
    }
  };

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/pest-diseases/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReport(response.data.pestDisease);
    } catch (err) {
      console.error('Error fetching pest/disease report:', err);
      setError('Failed to load report details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!canDeleteReport()) {
      Swal.fire({
        icon: 'warning',
        title: 'Access Denied',
        text: 'Only the reporter can delete resolved pest/disease reports.',
        confirmButtonColor: '#10b981'
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "This action cannot be undone!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      background: '#ffffff',
      customClass: {
        popup: 'rounded-2xl shadow-2xl'
      }
    });

    if (result.isConfirmed) {
      try {
        setDeleting(true);
        const token = localStorage.getItem('token');
        await axios.delete(`${API}/api/pest-diseases/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        await Swal.fire({
          title: 'Deleted!',
          text: 'Pest/Disease report has been deleted successfully.',
          icon: 'success',
          confirmButtonColor: '#10b981',
          background: '#ffffff',
          customClass: { popup: 'rounded-2xl shadow-2xl' }
        });
        navigate(basePath, { state: { deleteSuccess: true } });
      } catch (err) {
        console.error('Error deleting report:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete pest/disease report. Please try again.',
          confirmButtonColor: '#10b981'
        });
      } finally {
        setDeleting(false);
      }
    }
  };

  const handleEdit = () => {
    if (!canEditReport()) {
      Swal.fire({
        icon: 'warning',
        title: 'Access Denied',
        text: 'Only the reporter can edit pending pest/disease reports.',
        confirmButtonColor: '#10b981',
        background: '#ffffff',
        customClass: { popup: 'rounded-2xl shadow-2xl' }
      });
      return;
    }

    navigate(`${basePath}/${report._id}/edit`);
  };

  const canEditReport = () => {
    if (viewOnly) return false;
    return currentUser && report && currentUser._id === report.reportedBy && report.status !== 'Resolved';
  };

  const canDeleteReport = () => {
    if (viewOnly) return false;
    return currentUser && report && currentUser._id === report.reportedBy && report.status === 'Resolved';
  };

  const copyReportId = () => {
    if (!report) return;
    navigator.clipboard.writeText(report._id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const shareReport = async () => {
    if (!report) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Pest/Disease Report: ${report.title}`,
          text: `Pest/Disease Report: ${report.title} - ${report.description?.substring(0, 100)}...`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Sharing cancelled or failed', err);
      }
    } else {
      copyReportId();
    }
  };

  // PDF download logic with CeylonLeaf header design
  const exportPDFReport = () => {
    if (!report) return;
    
    const w = window.open('', '_blank');
    if (!w) {
      Swal.fire({ icon: 'error', title: 'Please allow popups to export.' });
      return;
    }

    const escapeHTML = (s) =>
      String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const style = `
      <style>
        * { font-family: Arial, Helvetica, sans-serif; }
        body { margin: 0; padding: 20px; }
        .header { 
          display: flex; 
          justify-content: space-between; 
          align-items: flex-start; 
          margin-bottom: 20px; 
        }
        .logo-section { 
          display: flex; 
          align-items: center; 
        }
        .leaf-icon { 
          width: 20px; 
          height: 20px; 
          margin-right: 8px; 
          display: inline-block;
        }
        .company-name { 
          font-size: 18px; 
          font-weight: bold; 
          color: #22C55E; 
          margin: 0; 
        }
        .generation-info { 
          text-align: right; 
          font-size: 10px; 
          color: #666; 
          line-height: 1.4;
        }
        .report-title { 
          font-size: 16px; 
          font-weight: bold; 
          color: #000; 
          text-align: center; 
          margin: 20px 0 30px 0; 
        }
        .details-section { 
          margin-bottom: 20px; 
        }
        .details-title { 
          font-size: 14px; 
          font-weight: bold; 
          color: #22C55E; 
          margin-bottom: 8px; 
          border-bottom: 1px solid #22C55E; 
          padding-bottom: 4px; 
        }
        .details-content { 
          margin-bottom: 16px; 
          padding: 12px; 
          background: #f8f9fa; 
          border-radius: 6px; 
        }
        .meta-grid { 
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 16px; 
          margin-bottom: 20px; 
        }
        .meta-item { 
          padding: 8px; 
          background: #f1f5f9; 
          border-radius: 4px; 
        }
        .meta-label { 
          font-size: 12px; 
          color: #666; 
          font-weight: bold; 
        }
        .meta-value { 
          font-size: 14px; 
          color: #000; 
          margin-top: 4px; 
        }
        .description { 
          background: #f8f9fa; 
          padding: 16px; 
          border-radius: 8px; 
          margin: 20px 0; 
          line-height: 1.6; 
        }
        .evidence { 
          text-align: center; 
          margin: 20px 0; 
        }
        .evidence img { 
          max-width: 100%; 
          max-height: 300px; 
          border-radius: 8px; 
          margin: 0 auto; 
          display: block; 
        }
        .footer { 
          position: fixed; 
          bottom: 20px; 
          left: 20px; 
          right: 20px; 
          text-align: center; 
          font-size: 11px; 
          color: #666;
        }
        .footer-company { 
          color: #22C55E; 
          font-weight: bold; 
          margin-bottom: 4px; 
        }
        .footer-address { 
          margin-bottom: 4px; 
        }
        .footer-slogan { 
          font-style: italic; 
          margin-bottom: 10px; 
        }
        .page-number { 
          position: absolute; 
          right: 0; 
          bottom: 0; 
        }
      </style>
    `;

    const now = new Date();
    const html = `
      <!doctype html><html><head><meta charset="utf-8">${style}</head><body>
        <!-- Header Section -->
        <div class="header">
          <div class="logo-section">
            <svg class="leaf-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
            </svg>
            <div class="company-name">CeylonLeaf</div>
          </div>
          <div class="generation-info">
            Generated on ${now.toLocaleString()}<br/>
            Report ID: ${report._id}
          </div>
        </div>
        
        <!-- Report Title -->
        <div class="report-title">Pest & Disease Report Details</div>
        
        <!-- Report Details -->
        <div class="details-section">
          <div class="details-title">Report Information</div>
          <div class="meta-grid">
            <div class="meta-item">
              <div class="meta-label">Title</div>
              <div class="meta-value">${escapeHTML(report.title)}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Status</div>
              <div class="meta-value" style="color: #22C55E; font-weight: bold;">${escapeHTML(report.status)}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Type</div>
              <div class="meta-value">${escapeHTML(report.type)}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Urgency</div>
              <div class="meta-value">${escapeHTML(report.urgency)}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Reporter</div>
              <div class="meta-value">${escapeHTML(report.reporterName)}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Location</div>
              <div class="meta-value">${escapeHTML(report.location)}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Date of Observation</div>
              <div class="meta-value">${formatDate(report.date)}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Economic Impact</div>
              <div class="meta-value">${escapeHTML(report.economicImpact)}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Affected Area</div>
              <div class="meta-value">${escapeHTML(report.affectedArea)} perch</div>
            </div>
          </div>
        </div>
        
        <!-- Description -->
        <div class="details-section">
          <div class="details-title">Description & Symptoms</div>
          <div class="description">
            ${escapeHTML(report.description)}
          </div>
        </div>
        
        <!-- Evidence -->
        ${report.imageUrl ? `
        <div class="evidence">
          <div class="details-title">Evidence</div>
          <img src="${report.imageUrl}" alt="Pest/Disease evidence" />
        </div>
        ` : ''}
        
        <!-- Footer Section -->
        <div class="footer">
          <div class="footer-company">CeylonLeaf Plantations</div>
          <div class="footer-address">No. 123, Tea Estate Road, Nuwara Eliya, Sri Lanka</div>
          <div class="footer-slogan">Cultivating excellence in every leaf.</div>
          <div class="page-number">Page 1</div>
        </div>
      </body></html>
    `;
    
    w.document.open(); 
    w.document.write(html); 
    w.document.close();
    w.onload = () => { w.focus(); w.print(); };
  };

  // Escape HTML utility
  function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, function(tag) {
      const charsToReplace = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      };
      return charsToReplace[tag] || tag;
    });
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return formatDate(dateString);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base-100 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-6 bg-white rounded-lg w-32 mb-6"></div>
            <div className="bg-emerald-50 rounded-2xl shadow-sm p-8">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
              <div className="h-24 bg-gray-200 rounded mb-8"></div>
              <div className="flex justify-end space-x-4">
                <div className="h-10 bg-gray-200 rounded w-24"></div>
                <div className="h-10 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-base-100 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={basePath} className="inline-flex items-center text-emerald-600 hover:text-emerald-700 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reports
          </Link>
          <div className="bg-emerald-50 rounded-2xl shadow-sm p-8 text-center">
            <AlertCircle className="mx-auto w-16 h-16 text-red-400 mb-4" />
            <h2 className="text-2xl font-bold text-emerald-900 mb-2">Error Loading Report</h2>
            <p className="text-emerald-800/80 mb-6">{error}</p>
            <button
              onClick={fetchReport}
              className="px-6 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-base-100 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={basePath} className="inline-flex items-center text-emerald-600 hover:text-emerald-700 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reports
          </Link>
          <div className="bg-emerald-50 rounded-2xl shadow-sm p-8 text-center">
            <Bug className="mx-auto w-16 h-16 text-amber-400 mb-4" />
            <h2 className="text-2xl font-bold text-emerald-900 mb-2">Report Not Found</h2>
            <p className="text-emerald-800/80 mb-6">The requested pest/disease report could not be found.</p>
            <Link
              to={basePath}
              className="px-6 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors inline-block"
            >
              View All Reports
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const canEdit = canEditReport();
  const canDelete = canDeleteReport();
  const isOwnReport = currentUser && currentUser._id === report.reportedBy;
  const hasMapLocation = report.mapCoordinates && report.mapCoordinates.lat;

  return (
    <div className="min-h-screen bg-base-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link 
            to={basePath} 
            className="inline-flex items-center text-emerald-600 hover:text-emerald-700 transition-colors bg-emerald-100/80 px-4 py-2 rounded-xl shadow-sm hover:shadow-md"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reports
          </Link>
          
          <div className="flex items-center space-x-3">
            <span className={`px-4 py-2 rounded-full text-sm font-medium border ${statusColors[report.status]}`}>
              {report.status}
            </span>
            <span className={`px-4 py-2 rounded-full text-sm font-medium border ${urgencyColors[report.urgency]}`}>
              {report.urgency.split(' (')[0]}
            </span>
          </div>
        </div>

        <div className="bg-emerald-50 rounded-2xl shadow-sm overflow-hidden border border-emerald-100">
          <div className="bg-emerald-50 p-8 border-b border-emerald-100">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1">
                <div className="flex items-start mb-4">
                  <span className="text-4xl mr-4 flex-shrink-0">{typeIcons[report.type] || '❓'}</span>
                  <div className="min-w-0">
                    <h1 className="text-3xl font-bold text-emerald-900 mb-2 break-words">
                      {report.title}
                    </h1>
                    <div className="flex items-center flex-wrap gap-2">
                      <div className="flex items-center text-emerald-800/80">
                        <User className="w-4 h-4 mr-1" />
                        <span className="font-medium">{report.reporterName}</span>
                        {isOwnReport && (
                          <span className="ml-2 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">
                            Your Report
                          </span>
                        )}
                      </div>
                      <span className="text-emerald-700/50">•</span>
                      <span className="text-emerald-800/70 text-sm">
                        {getTimeAgo(report.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2 mt-4 lg:mt-0 lg:ml-4">
                <button
                  onClick={shareReport}
                  className="p-2 text-emerald-800/70 hover:text-emerald-700 hover:bg-emerald-100/70 rounded-lg transition-colors"
                  title="Share Report"
                >
                  <Share className="w-5 h-5" />
                </button>
                <button
                  onClick={exportPDFReport}
                  className="p-2 text-emerald-800/70 hover:text-emerald-700 hover:bg-emerald-100/70 rounded-lg transition-colors"
                  title="Download PDF Report"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="space-y-6">
                <div className="bg-emerald-50/70 rounded-xl p-4">
                  <div className="flex items-center mb-3">
                    <MapPin className="w-5 h-5 text-emerald-600 mr-3" />
                    <h3 className="font-semibold text-emerald-900">Location</h3>
                  </div>
                  <p className="text-emerald-900/80">{report.location}</p>
                </div>

                <div className="bg-emerald-50/70 rounded-xl p-4">
                  <div className="flex items-center mb-3">
                    <Calendar className="w-5 h-5 text-emerald-600 mr-3" />
                    <h3 className="font-semibold text-emerald-900">Date of Observation</h3>
                  </div>
                  <p className="font-medium text-emerald-900">{formatDate(report.date)}</p>
                </div>

                {report.requestedActions && report.requestedActions.length > 0 && (
                  <div className="bg-emerald-50/70 rounded-xl p-4">
                    <div className="flex items-center mb-3">
                      <FileText className="w-5 h-5 text-emerald-600 mr-3" />
                      <h3 className="font-semibold text-emerald-900">Requested Actions</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {report.requestedActions.map((action, index) => (
                        <span key={index} className="px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-sm text-emerald-900/80">
                          {action}
                        </span>
                      ))}
                      {report.otherAction && (
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
                          {report.otherAction}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="bg-emerald-50/70 rounded-xl p-4">
                  <div className="flex items-center mb-3">
                    <Bug className="w-5 h-5 text-emerald-600 mr-3" />
                    <h3 className="font-semibold text-emerald-900">Issue Details</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-emerald-800/80">Type</span>
                      <span className="font-medium text-emerald-900">{report.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-emerald-800/80">Urgency</span>
                      <span className="font-medium text-emerald-900">{report.urgency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-emerald-800/80">Economic Impact</span>
                      <span className="font-medium text-emerald-900">{report.economicImpact}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-emerald-800/80">Affected Area</span>
                      <span className="font-medium text-emerald-900">{report.affectedArea} perch</span>
                    </div>
                  </div>
                </div>

                {hasMapLocation && (
                  <div className="bg-emerald-50/70 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <Map className="w-5 h-5 text-emerald-600 mr-3" />
                        <h3 className="font-semibold text-emerald-900">Location Coordinates</h3>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowMapModal(true)}
                          className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center"
                        >
                          <Maximize2 className="w-3 h-3 mr-1" />
                          View Map
                        </button>
                        <button
                          onClick={copyReportId}
                          className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center"
                        >
                          {copiedId ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 mr-1" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Inline mini-map */}
                    <div className="rounded-lg overflow-hidden border border-emerald-100">
                      <MapContainer
                        center={[report.mapCoordinates.lat, report.mapCoordinates.lng]}
                        zoom={13}
                        style={{ height: '200px', width: '100%' }}
                        scrollWheelZoom={false}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; OpenStreetMap contributors'
                        />
                        <Marker position={[report.mapCoordinates.lat, report.mapCoordinates.lng]} />
                      </MapContainer>
                    </div>

                    <p className="text-sm font-mono text-emerald-800/80 mt-3">
                      Lat: {report.mapCoordinates.lat?.toFixed(6)}, Lng: {report.mapCoordinates.lng?.toFixed(6)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-center mb-4">
                <FileText className="w-6 h-6 text-emerald-600 mr-3" />
                <h3 className="text-xl font-semibold text-emerald-900">Description & Symptoms</h3>
              </div>
              <div className="bg-emerald-50/70 rounded-xl p-6">
                <p className="text-emerald-900/80 leading-relaxed whitespace-pre-line">
                  {report.description}
                </p>
              </div>
            </div>

            {report.imageUrl && (
              <div className="mb-6">
                <div className="flex items-center mb-3">
                  <ImageIcon className="w-5 h-5 text-emerald-600 mr-2" />
                  <h3 className="text-lg font-semibold text-emerald-900">Evidence</h3>
                </div>
                <div className="bg-emerald-50/70 rounded-xl p-4">
                  <img 
                    src={report.imageUrl} 
                    alt="Pest/Disease evidence" 
                    className="max-w-full h-auto rounded-lg max-h-64 object-contain mx-auto"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const errorDiv = e.target.nextElementSibling;
                      if (errorDiv) errorDiv.style.display = 'block';
                    }}
                  />
                  <div className="text-center text-emerald-800/70 p-4 hidden">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2 text-emerald-700/40" />
                    <p>Evidence image unavailable or deleted</p>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-emerald-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-emerald-800/80">
                <div>
                  <p className="font-medium">Report Timeline</p>
                  <p>Reported: {formatDateTime(report.createdAt)}</p>
                  {report.updatedAt !== report.createdAt && (
                    <p>Last updated: {formatDateTime(report.updatedAt)}</p>
                  )}
                </div>
                <div className="md:text-right">
                  <p className="font-medium">System Information</p>
                  <p>Status: {report.status}</p>
                  <p>Type: {report.type}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50/70 px-8 py-6 border-t border-emerald-100">
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                onClick={handleEdit}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center ${
                  canEdit 
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm hover:shadow-md' 
                    : 'bg-emerald-100/80 text-emerald-400 cursor-not-allowed'
                }`}
                disabled={!canEdit}
                title={canEdit ? "Edit Report" : report.status === 'Resolved' ? "Resolved reports cannot be edited" : "Only the reporter can edit"}
              >
                {canEdit ? (
                  <Edit className="w-4 h-4 mr-2" />
                ) : (
                  <FileText className="w-4 h-4 mr-2" />
                )}
                {canEdit ? "Edit Report" : "View Only"}
              </button>
              
              <button
                onClick={handleDelete}
                disabled={deleting || !canDelete}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center ${
                  canDelete 
                    ? 'bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow-md' 
                    : 'bg-emerald-100/80 text-emerald-400 cursor-not-allowed'
                }`}
                title={canDelete ? "Delete Report" : "Only resolved reports by the reporter can be deleted"}
              >
                {deleting ? (
                  <Loader className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                {deleting ? "Deleting..." : "Delete Report"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Map Modal */}
      {showMapModal && hasMapLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-emerald-50 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-emerald-100">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Report Location</h3>
                <button
                  onClick={() => setShowMapModal(false)}
                  className="p-2 hover:bg-emerald-100/70 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="w-full h-96 rounded-lg relative border-2 border-emerald-200 overflow-hidden">
                <MapContainer
                  center={[report.mapCoordinates.lat, report.mapCoordinates.lng]}
                  zoom={14}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                  />
                  <Marker position={[report.mapCoordinates.lat, report.mapCoordinates.lng]} />
                </MapContainer>
              </div>

              <div className="mt-4 p-3 bg-emerald-50 rounded-lg">
                <p className="text-sm font-medium text-emerald-900">Location Details</p>
                <p className="text-xs text-emerald-700 font-mono">
                  Latitude: {report.mapCoordinates.lat?.toFixed(6)}, Longitude: {report.mapCoordinates.lng?.toFixed(6)}
                </p>
                <p className="text-xs text-emerald-700 mt-1">
                  Field Location: {report.location}
                </p>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setShowMapModal(false)}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                >
                  Close Map
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PestDiseaseDetailPage;
