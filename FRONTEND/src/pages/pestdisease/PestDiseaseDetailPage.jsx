import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  Bug, 
  MapPin, 
  Calendar, 
  User, 
  Edit, 
  Trash2,
  FileText,
  AlertCircle,
  Image as ImageIcon,
  Ruler,
  Loader,
  Shield
} from 'lucide-react';
import Swal from 'sweetalert2';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const statusColors = {
  'Pending': 'badge-warning',
  'Monitoring': 'badge-info',
  'Treatment Ongoing': 'badge-warning',
  'Resolved': 'badge-success',
};

const severityColors = {
  'Low': 'badge-success',
  'Medium': 'badge-warning',
  'High': 'badge-error',
  'Critical': 'badge-error',
};

const typeIcons = {
  'Pest Infestation': '🐛',
  'Disease': '🦠',
  'Both': '⚠️',
  'Other': '❓'
};

const PestDiseaseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/pestdisease/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReport(response.data.pestDisease);
    } catch (error) {
      console.error('Error fetching report:', error);
      setError('Failed to load report details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Can edit if status is not Resolved
  const canEdit = () => {
    if (!report) return false;
    return report.status !== 'Resolved';
  };

  // Can delete only if status is Resolved AND user is the reporter
  const canDelete = () => {
    if (!report || !currentUser) return false;
    return report.status === 'Resolved' && report.reporterId === currentUser.id;
  };

  const handleDelete = async () => {
    if (!canDelete()) {
      Swal.fire({
        icon: 'warning',
        title: 'Permission Denied',
        text: 'You can only delete your own resolved reports.',
        confirmButtonColor: '#059669',
        background: '#1f2937',
        color: '#fff'
      });
      return;
    }
    
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#059669',
      cancelButtonColor: '#DC2626',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      background: '#1f2937',
      color: '#fff'
    });

    if (result.isConfirmed) {
      try {
        setDeleting(true);
        const token = localStorage.getItem('token');
        
        await axios.delete(`${API}/api/pestdisease/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        await Swal.fire({
          title: 'Deleted!',
          text: 'Report has been deleted successfully.',
          icon: 'success',
          confirmButtonColor: '#059669',
          background: '#1f2937',
          color: '#fff'
        });
        
        navigate('/pestdisease', { state: { deleteSuccess: true } });
      } catch (error) {
        console.error('Error deleting report:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.response?.data?.message || 'Failed to delete report. Please try again.',
          confirmButtonColor: '#059669',
          background: '#1f2937',
          color: '#fff'
        });
      } finally {
        setDeleting(false);
      }
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <div className="animate-pulse bg-base-300 h-6 w-6 rounded mr-3"></div>
            <div className="animate-pulse bg-base-300 h-6 w-32 rounded"></div>
          </div>
          <div className="bg-base-100 rounded-xl shadow p-6 animate-pulse">
            <div className="h-8 bg-base-300 rounded w-3/4 mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-base-300 rounded w-1/2"></div>
              <div className="h-4 bg-base-300 rounded w-2/3"></div>
              <div className="h-4 bg-base-300 rounded w-3/4"></div>
              <div className="h-4 bg-base-300 rounded w-1/3"></div>
            </div>
            <div className="mt-8 pt-6 border-t border-base-300 flex justify-end space-x-4">
              <div className="h-10 bg-base-300 rounded w-24"></div>
              <div className="h-10 bg-base-300 rounded w-24"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-base-200 py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/pestdisease" className="inline-flex items-center text-primary hover:text-primary-focus mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reports
          </Link>
          <div className="bg-base-100 rounded-xl shadow p-6 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-error mb-4" />
            <h2 className="text-xl font-semibold text-base-content mb-2">Error Loading Report</h2>
            <p className="text-base-content/70 mb-4">{error}</p>
            <button
              onClick={fetchReport}
              className="btn btn-primary"
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
      <div className="min-h-screen bg-base-200 py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/pestdisease" className="inline-flex items-center text-primary hover:text-primary-focus mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reports
          </Link>
          <div className="bg-base-100 rounded-xl shadow p-6 text-center">
            <Bug className="mx-auto h-12 w-12 text-warning mb-4" />
            <h2 className="text-xl font-semibold text-base-content mb-2">Report Not Found</h2>
            <p className="text-base-content/70 mb-4">The requested pest/disease report could not be found.</p>
            <Link
              to="/pestdisease"
              className="btn btn-primary"
            >
              View All Reports
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Link 
            to="/pestdisease" 
            className="inline-flex items-center text-primary hover:text-primary-focus mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reports
          </Link>
          <span className={`badge ${statusColors[report.status]}`}>
            {report.status}
          </span>
        </div>

        <div className="bg-base-100 rounded-xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 border-b border-base-300">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex items-center mb-2">
                  <span className="text-3xl mr-3">{typeIcons[report.issueType] || '❓'}</span>
                  <h1 className="text-2xl font-bold text-base-content">{report.pestDiseaseName}</h1>
                </div>
                <p className="text-base-content/70">Reported by {report.reporterName}</p>
              </div>
              <span className={`mt-4 md:mt-0 badge ${severityColors[report.severity]}`}>
                {report.severity} Severity
              </span>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 text-primary mr-3" />
                  <div>
                    <p className="text-sm text-base-content/70">Location</p>
                    <p className="font-medium text-base-content">{report.location}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-primary mr-3" />
                  <div>
                    <p className="text-sm text-base-content/70">Date of Report</p>
                    <p className="font-medium text-base-content">{formatDate(report.date)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center">
                  <Ruler className="w-5 h-5 text-primary mr-3" />
                  <div>
                    <p className="text-sm text-base-content/70">Affected Area</p>
                    <p className="font-medium text-base-content">{report.affectedArea} acres</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-primary mr-3" />
                  <div>
                    <p className="text-sm text-base-content/70">Type</p>
                    <p className="font-medium text-base-content">{report.issueType}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Requested Actions */}
            {report.requestedActions.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center mb-3">
                  <FileText className="w-5 h-5 text-primary mr-2" />
                  <h3 className="text-lg font-semibold text-base-content">Requested Actions</h3>
                </div>
                <div className="bg-base-200 rounded-lg p-4">
                  <div className="flex flex-wrap gap-2">
                    {report.requestedActions.map((action, index) => (
                      <span key={index} className="badge badge-info">
                        {action}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="mb-6">
              <div className="flex items-center mb-3">
                <FileText className="w-5 h-5 text-primary mr-2" />
                <h3 className="text-lg font-semibold text-base-content">Description</h3>
              </div>
              <div className="bg-base-200 rounded-lg p-4">
                <p className="text-base-content whitespace-pre-line">{report.description}</p>
              </div>
            </div>

            {/* Evidence Section */}
            {report.imageUrl && (
              <div className="mb-6">
                <div className="flex items-center mb-3">
                  <ImageIcon className="w-5 h-5 text-primary mr-2" />
                  <h3 className="text-lg font-semibold text-base-content">Evidence</h3>
                </div>
                <div className="bg-base-200 rounded-lg p-4">
                  <img 
                    src={report.imageUrl} 
                    alt="Pest/Disease evidence" 
                    className="max-w-full h-auto rounded-lg max-h-64 object-contain mx-auto"
                  />
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="pt-6 border-t border-base-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-base-content/70">
                <div>
                  <p>Reported on: {formatDateTime(report.createdAt)}</p>
                  <p>Report ID: {report.reportId}</p>
                  {report.updatedAt !== report.createdAt && (
                    <p>Last updated: {formatDateTime(report.updatedAt)}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-base-200 px-6 py-4 border-t border-base-300">
            <div className="flex justify-end space-x-4">
              {canEdit() && (
                <button
                  onClick={() => navigate(`/pestdisease/${report._id}/edit`)}
                  className="btn btn-primary"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Report
                </button>
              )}
              {canDelete() && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="btn btn-error"
                >
                  {deleting ? (
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Delete Report
                </button>
              )}
              {report.status === 'Resolved' && !canDelete() && (
                <div className="flex items-center text-info">
                  <Shield className="w-4 h-4 mr-2" />
                  <span>This report is resolved and cannot be edited</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PestDiseaseDetailPage;