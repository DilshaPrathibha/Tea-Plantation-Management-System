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
    return currentUser && 
           currentUser._id === incidence.reportedBy && 
           incidence.status !== 'Resolved';
  };

  const canDeleteIncidence = () => {
    return currentUser && 
           currentUser._id === incidence.reportedBy && 
           incidence.status === 'Resolved';
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

  const downloadReport = () => {
    // Simple download functionality - could be enhanced with PDF generation
    const reportData = {
      title: incidence.title,
      reporter: incidence.reporterName,
      location: incidence.location,
      date: incidence.date,
      time: incidence.time,
      type: incidence.type,
      severity: incidence.severity,
      description: incidence.description,
      status: incidence.status,
      reportedOn: incidence.createdAt
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incidence-report-${incidence._id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-6 bg-white rounded-lg w-32 mb-6"></div>
            <div className="bg-white rounded-2xl shadow-sm p-8">
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/incidences" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reports
          </Link>
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <AlertCircle className="mx-auto w-16 h-16 text-red-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Report</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={fetchIncidence}
              className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/incidences" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reports
          </Link>
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <AlertTriangle className="mx-auto w-16 h-16 text-amber-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Report Not Found</h2>
            <p className="text-gray-600 mb-6">The requested incidence report could not be found.</p>
            <Link
              to="/incidences"
              className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors inline-block"
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Link 
            to="/incidences" 
            className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors bg-white px-4 py-2 rounded-xl shadow-sm hover:shadow-md"
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
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1">
                <div className="flex items-start mb-4">
                  <span className="text-4xl mr-4 flex-shrink-0">{typeIcons[incidence.type] || '⚠️'}</span>
                  <div className="min-w-0">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 break-words">
                      {incidence.title}
                    </h1>
                    <div className="flex items-center flex-wrap gap-2">
                      <div className="flex items-center text-gray-600">
                        <User className="w-4 h-4 mr-1" />
                        <span className="font-medium">{incidence.reporterName}</span>
                        {isOwnReport && (
                          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                            Your Report
                          </span>
                        )}
                      </div>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-500 text-sm">
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
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Share Report"
                >
                  <Share className="w-5 h-5" />
                </button>
                <button
                  onClick={downloadReport}
                  className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Download Report"
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
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center mb-3">
                    <MapPin className="w-5 h-5 text-blue-600 mr-3" />
                    <h3 className="font-semibold text-gray-900">Location</h3>
                  </div>
                  <p className="text-gray-700">{incidence.location === 'full_estate' ? 'Full Estate' : incidence.location}</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center mb-3">
                    <Calendar className="w-5 h-5 text-blue-600 mr-3" />
                    <h3 className="font-semibold text-gray-900">Date & Time</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Date</p>
                      <p className="font-medium text-gray-900">{formatDate(incidence.date)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Time</p>
                      <p className="font-medium text-gray-900">{incidence.time}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center mb-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 mr-3" />
                    <h3 className="font-semibold text-gray-900">Incident Details</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Type</p>
                      <p className="font-medium text-gray-900">{incidence.type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Severity</p>
                      <p className="font-medium text-gray-900">{incidence.severity}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <Shield className="w-5 h-5 text-blue-600 mr-3" />
                      <h3 className="font-semibold text-gray-900">Report ID</h3>
                    </div>
                    <button
                      onClick={copyReportId}
                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center"
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
                  <p className="text-sm font-mono text-gray-600 break-all">{incidence._id}</p>
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <FileText className="w-6 h-6 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Incident Description</h3>
              </div>
              <div className="bg-gray-50 rounded-xl p-6">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
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
                <div className="bg-base-200 rounded-lg p-4">
                  <img 
                    src={incidence.imageUrl} 
                    alt="Incidence evidence" 
                    className="max-w-full h-auto rounded-lg max-h-64 object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      // Show error message
                      const errorDiv = e.target.nextElementSibling;
                      if (errorDiv) errorDiv.style.display = 'block';
                    }}
                  />
                  <div className="text-center text-gray-500 p-4 hidden">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Evidence image unavailable or deleted</p>
                  </div>
                </div>
              </div>
            )}

            {/* Timeline Metadata */}
            <div className="pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
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
          <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                onClick={handleEdit}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center ${
                  canEdit 
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md' 
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
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
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
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