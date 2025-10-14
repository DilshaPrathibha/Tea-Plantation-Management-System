import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  AlertTriangle, 
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
  Eye,
  Shield,
  Download,
  Share,
  Copy,
  CheckCircle
} from 'lucide-react';
import Swal from 'sweetalert2';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// Modern light theme colors
const statusColors = {
  'Pending': 'bg-amber-100 text-amber-800 border-amber-200',
  'Under Review': 'bg-blue-100 text-blue-800 border-blue-200',
  'Action Taken': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Resolved': 'bg-gray-100 text-gray-800 border-gray-200',
};

const severityColors = {
  'Low': 'bg-green-100 text-green-800 border-green-200',
  'Medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'High': 'bg-orange-100 text-orange-800 border-orange-200',
  'Critical': 'bg-red-100 text-red-800 border-red-200',
};

const typeIcons = {
  'Injury': '🤕',
  'Equipment Damage': '🔧',
  'Environmental Hazard': '🌿',
  'Other': '⚠️'
};

const IncidenceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [incidence, setIncidence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
    fetchIncidence();
  }, [id]);

  const fetchCurrentUser = () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setCurrentUser(user);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchIncidence = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/incidences/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIncidence(response.data.incidence);
    } catch (error) {
      console.error('Error fetching incidence:', error);
      setError('Failed to load incidence details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!canDeleteIncidence()) {
      Swal.fire({
        icon: 'warning',
        title: 'Access Denied',
        text: 'Only the reporter can delete resolved incidence reports.',
        confirmButtonColor: '#3b82f6'
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
        
        await axios.delete(`${API}/api/incidences/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        await Swal.fire({
          title: 'Deleted!',
          text: 'Incidence report has been deleted successfully.',
          icon: 'success',
          confirmButtonColor: '#3b82f6',
          background: '#ffffff',
          customClass: {
            popup: 'rounded-2xl shadow-2xl'
          }
        });
        
        navigate('/incidences', { state: { deleteSuccess: true } });
      } catch (error) {
        console.error('Error deleting incidence:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete incidence report. Please try again.',
          confirmButtonColor: '#3b82f6',
          background: '#ffffff',
          customClass: {
            popup: 'rounded-2xl shadow-2xl'
          }
        });
      } finally {
        setDeleting(false);
      }
    }
  };

  const handleEdit = () => {
    if (!canEditIncidence()) {
      Swal.fire({
        icon: 'warning',
        title: 'Access Denied',
        text: 'Only the reporter can edit pending incidence reports.',
        confirmButtonColor: '#3b82f6',
        background: '#ffffff',
        customClass: {
          popup: 'rounded-2xl shadow-2xl'
        }
      });
      return;
    }

    navigate(`/incidences/${incidence._id}/edit`);
  };

  const canEditIncidence = () => {
    if (!currentUser || !incidence) return false;
    
    // Admin, supervisor, and worker can edit their own reports
    const isOwnReport = currentUser._id === incidence.reportedBy;
    const isAdmin = currentUser.role === 'admin';
    const isSupervisor = currentUser.role === 'field_supervisor';
    const isWorker = currentUser.role === 'worker';
    
    return (isOwnReport && (isAdmin || isSupervisor || isWorker)) && incidence.status !== 'Resolved';
  };

  const canDeleteIncidence = () => {
    if (!currentUser || !incidence) return false;
    
    // Admin, supervisor, and worker can delete their own reports
    const isOwnReport = currentUser._id === incidence.reportedBy;
    const isAdmin = currentUser.role === 'admin';
    const isSupervisor = currentUser.role === 'field_supervisor';
    const isWorker = currentUser.role === 'worker';
    
    return (isOwnReport && (isAdmin || isSupervisor || isWorker)) && incidence.status === 'Resolved';
  };

  const copyReportId = () => {
    navigator.clipboard.writeText(incidence._id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const shareReport = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Incidence Report: ${incidence.title}`,
          text: `Incidence Report: ${incidence.title} - ${incidence.description.substring(0, 100)}...`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Sharing cancelled');
      }
    } else {
      copyReportId();
    }
  };

  // PDF download logic with CeylonLeaf header design
  const exportPDFIncidence = () => {
    if (!incidence) return;
    
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
            Report ID: ${incidence._id}
          </div>
        </div>
        
        <!-- Report Title -->
        <div class="report-title">Incidence Report Details</div>
        
        <!-- Report Details -->
        <div class="details-section">
          <div class="details-title">Incident Information</div>
          <div class="meta-grid">
            <div class="meta-item">
              <div class="meta-label">Title</div>
              <div class="meta-value">${escapeHTML(incidence.title)}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Status</div>
              <div class="meta-value" style="color: #22C55E; font-weight: bold;">${escapeHTML(incidence.status)}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Type</div>
              <div class="meta-value">${escapeHTML(incidence.type)}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Severity</div>
              <div class="meta-value">${escapeHTML(incidence.severity)}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Reporter</div>
              <div class="meta-value">${escapeHTML(incidence.reporterName)}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Location</div>
              <div class="meta-value">${escapeHTML(incidence.location === 'full_estate' ? 'Full Estate' : incidence.location)}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Date</div>
              <div class="meta-value">${formatDate(incidence.date)}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Time</div>
              <div class="meta-value">${escapeHTML(incidence.time)}</div>
            </div>
          </div>
        </div>
        
        <!-- Description -->
        <div class="details-section">
          <div class="details-title">Incident Description</div>
          <div class="description">
            ${escapeHTML(incidence.description)}
          </div>
        </div>
        
        <!-- Evidence -->
        ${incidence.imageUrl ? `
        <div class="evidence">
          <div class="details-title">Evidence</div>
          <img src="${incidence.imageUrl}" alt="Incidence evidence" />
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
    return str.replace(/[&<>"']/g, function(tag) {
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (dateString) => {
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
          <Link to="/incidences" className="inline-flex items-center text-emerald-600 hover:text-emerald-700 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reports
          </Link>
          <div className="bg-emerald-50 rounded-2xl shadow-sm p-8 text-center">
            <AlertCircle className="mx-auto w-16 h-16 text-red-400 mb-4" />
            <h2 className="text-2xl font-bold text-emerald-900 mb-2">Error Loading Report</h2>
            <p className="text-emerald-800/80 mb-6">{error}</p>
            <button
              onClick={fetchIncidence}
              className="px-6 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!incidence) {
    return (
      <div className="min-h-screen bg-base-100 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/incidences" className="inline-flex items-center text-emerald-600 hover:text-emerald-700 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reports
          </Link>
          <div className="bg-emerald-50 rounded-2xl shadow-sm p-8 text-center">
            <AlertTriangle className="mx-auto w-16 h-16 text-amber-400 mb-4" />
            <h2 className="text-2xl font-bold text-emerald-900 mb-2">Report Not Found</h2>
            <p className="text-emerald-800/80 mb-6">The requested incidence report could not be found.</p>
            <Link
              to="/incidences"
              className="px-6 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors inline-block"
            >
              View All Reports
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const canEdit = canEditIncidence();
  const canDelete = canDeleteIncidence();
  const isOwnReport = currentUser && currentUser._id === incidence.reportedBy;

  return (
    <div className="min-h-screen bg-base-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Link 
            to="/incidences" 
            className="inline-flex items-center bg-emerald-100/80 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100 transition-colors px-4 py-2 rounded-xl shadow-sm hover:shadow-md"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reports
          </Link>
          
          <div className="flex items-center space-x-3">
            <span className={`px-4 py-2 rounded-full text-sm font-medium border ${statusColors[incidence.status]}`}>
              {incidence.status}
            </span>
            <span className={`px-4 py-2 rounded-full text-sm font-medium border ${severityColors[incidence.severity]}`}>
              {incidence.severity} Severity
            </span>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-emerald-50 rounded-2xl shadow-sm overflow-hidden border border-emerald-100">
          {/* Header Section */}
          <div className="bg-emerald-50 p-8 border-b border-emerald-100">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1">
                <div className="flex items-start mb-4">
                  <span className="text-4xl mr-4 flex-shrink-0">{typeIcons[incidence.type] || '⚠️'}</span>
                  <div className="min-w-0">
                    <h1 className="text-3xl font-bold text-emerald-900 mb-2 break-words">
                      {incidence.title}
                    </h1>
                    <div className="flex items-center flex-wrap gap-2">
                      <div className="flex items-center text-emerald-800/80">
                        <User className="w-4 h-4 mr-1" />
                        <span className="font-medium">{incidence.reporterName}</span>
                        {isOwnReport && (
                          <span className="ml-2 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">
                            Your Report
                          </span>
                        )}
                      </div>
                      <span className="text-emerald-700/50">•</span>
                      <span className="text-emerald-800/70 text-sm">
                        {getTimeAgo(incidence.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="flex space-x-2 mt-4 lg:mt-0 lg:ml-4">
                <button
                  onClick={shareReport}
                  className="p-2 text-emerald-800/70 hover:text-emerald-600 hover:bg-emerald-100/70 rounded-lg transition-colors"
                  title="Share Report"
                >
                  <Share className="w-5 h-5" />
                </button>
                <button
                  onClick={exportPDFIncidence}
                  className="p-2 text-emerald-800/70 hover:text-emerald-700 hover:bg-emerald-100/70 rounded-lg transition-colors"
                  title="Download PDF Report"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Left Column */}
              <div className="space-y-6">
                <div className="bg-emerald-50/70 rounded-xl p-4">
                  <div className="flex items-center mb-3">
                    <MapPin className="w-5 h-5 text-emerald-600 mr-3" />
                    <h3 className="font-semibold text-emerald-900">Location</h3>
                  </div>
                  <p className="text-emerald-900/80">{incidence.location === 'full_estate' ? 'Full Estate' : incidence.location}</p>
                </div>

                <div className="bg-emerald-50/70 rounded-xl p-4">
                  <div className="flex items-center mb-3">
                    <Calendar className="w-5 h-5 text-emerald-600 mr-3" />
                    <h3 className="font-semibold text-emerald-900">Date & Time</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-emerald-800/80">Date</p>
                      <p className="font-medium text-emerald-900">{formatDate(incidence.date)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-emerald-800/80">Time</p>
                      <p className="font-medium text-emerald-900">{incidence.time}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div className="bg-emerald-50/70 rounded-xl p-4">
                  <div className="flex items-center mb-3">
                    <AlertCircle className="w-5 h-5 text-emerald-600 mr-3" />
                    <h3 className="font-semibold text-emerald-900">Incident Details</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-emerald-800/80">Type</p>
                      <p className="font-medium text-emerald-900">{incidence.type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-emerald-800/80">Severity</p>
                      <p className="font-medium text-emerald-900">{incidence.severity}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-50/70 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <Shield className="w-5 h-5 text-emerald-600 mr-3" />
                      <h3 className="font-semibold text-emerald-900">Report ID</h3>
                    </div>
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
                  <p className="text-sm font-mono text-emerald-800/80 break-all">{incidence._id}</p>
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <FileText className="w-6 h-6 text-emerald-600 mr-3" />
                <h3 className="text-xl font-semibold text-emerald-900">Incident Description</h3>
              </div>
              <div className="bg-emerald-50/70 rounded-xl p-6">
                <p className="text-emerald-900/80 leading-relaxed whitespace-pre-line">
                  {incidence.description}
                </p>
              </div>
            </div>

            {/* Evidence Section */}
            {incidence.imageUrl && (
              <div className="mb-6">
                <div className="flex items-center mb-3">
                  <ImageIcon className="w-5 h-5 text-primary mr-2" />
                  <h3 className="text-lg font-semibold">Evidence</h3>
                </div>
                <div className="bg-emerald-50 rounded-lg p-4 flex flex-col items-center justify-center">
                  <img 
                    src={incidence.imageUrl} 
                    alt="Incidence evidence" 
                    className="max-w-full h-auto rounded-lg max-h-64 object-contain mx-auto"
                    style={{ display: 'block' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const errorDiv = e.target.nextElementSibling;
                      if (errorDiv) errorDiv.style.display = 'block';
                    }}
                  />
                  <div className="text-center text-emerald-800/70 p-4 hidden">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Evidence image unavailable or deleted</p>
                  </div>
                </div>
              </div>
            )}

            {/* Timeline Metadata */}
            <div className="pt-6 border-t border-emerald-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-emerald-800/80">
                <div>
                  <p className="font-medium">Report Timeline</p>
                  <p>Reported: {formatDateTime(incidence.createdAt)}</p>
                  {incidence.updatedAt !== incidence.createdAt && (
                    <p>Last updated: {formatDateTime(incidence.updatedAt)}</p>
                  )}
                </div>
                <div className="md:text-right">
                  <p className="font-medium">System Information</p>
                  <p>Status: {incidence.status}</p>
                  <p>Severity: {incidence.severity}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-emerald-50 px-8 py-6 border-t border-emerald-100">
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                onClick={handleEdit}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center ${
                  canEdit 
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm hover:shadow-md' 
                    : 'bg-emerald-100/80 text-emerald-400 cursor-not-allowed'
                }`}
                disabled={!canEdit}
                title={canEdit ? "Edit Report" : incidence.status === 'Resolved' ? "Resolved reports cannot be edited" : "Only the reporter can edit"}
              >
                {canEdit ? (
                  <Edit className="w-4 h-4 mr-2" />
                ) : (
                  <Eye className="w-4 h-4 mr-2" />
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
    </div>
  );
};

export default IncidenceDetailPage;