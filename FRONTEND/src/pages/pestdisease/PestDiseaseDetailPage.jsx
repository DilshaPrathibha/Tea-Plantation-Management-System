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
  Loader
} from 'lucide-react';
import Swal from 'sweetalert2';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const statusColors = {
  'Pending': 'bg-yellow-100 text-yellow-800',
  'Monitoring': 'bg-blue-100 text-blue-800',
  'Treatment Ongoing': 'bg-orange-100 text-orange-800',
  'Resolved': 'bg-green-100 text-green-800',
};

const severityColors = {
  'Low': 'bg-green-100 text-green-800',
  'Medium': 'bg-yellow-100 text-yellow-800',
  'High': 'bg-orange-100 text-orange-800',
  'Critical': 'bg-red-100 text-red-800',
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

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/pest-diseases/${id}`, {
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

  const handleDelete = async () => {
    if (report.status !== 'Resolved') {
      Swal.fire({
        icon: 'warning',
        title: 'Cannot Delete',
        text: 'Only resolved reports can be deleted. Please resolve the report first.',
        confirmButtonColor: '#059669'
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
      cancelButtonText: 'Cancel'
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
          text: 'Report has been deleted successfully.',
          icon: 'success',
          confirmButtonColor: '#059669'
        });
        
        navigate('/pest-diseases');
      } catch (error) {
        console.error('Error deleting report:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete report. Please try again.',
          confirmButtonColor: '#059669'
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
      <div className="min-h-screen bg-green-50 py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <div className="animate-pulse bg-gray-200 h-6 w-6 rounded mr-3"></div>
            <div className="animate-pulse bg-gray-200 h-6 w-32 rounded"></div>
          </div>
          <div className="bg-white rounded-xl shadow p-6 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
            <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end space-x-4">
              <div className="h-10 bg-gray-200 rounded w-24"></div>
              <div className="h-10 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-green-50 py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/pest-diseases" className="inline-flex items-center text-green-600 hover:text-green-700 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reports
          </Link>
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Report</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchReport}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
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
      <div className="min-h-screen bg-green-50 py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/pest-diseases" className="inline-flex items-center text-green-600 hover:text-green-700 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reports
          </Link>
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <Bug className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Report Not Found</h2>
            <p className="text-gray-600 mb-4">The requested pest/disease report could not be found.</p>
            <Link
              to="/pest-diseases"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              View All Reports
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Link 
            to="/pest-diseases" 
            className="inline-flex items-center text-green-600 hover:text-green-700 mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reports
          </Link>
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[report.status]}`}>
            {report.status}
          </span>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-green-100">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex items-center mb-2">
                  <span className="text-3xl mr-3">{typeIcons[report.issueType] || '❓'}</span>
                  <h1 className="text-2xl font-bold text-gray-900">{report.pestDiseaseName}</h1>
                </div>
                <p className="text-gray-600">Reported by {report.reporterName}</p>
              </div>
              <span className={`mt-4 md:mt-0 px-3 py-1 text-sm font-medium rounded-full ${severityColors[report.severity]}`}>
                {report.severity} Severity
              </span>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium">{report.location}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Date of Report</p>
                    <p className="font-medium">{formatDate(report.date)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center">
                  <Ruler className="w-5 h-5 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Affected Area</p>
                    <p className="font-medium">{report.affectedArea} acres</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Type</p>
                    <p className="font-medium">{report.issueType}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Requested Actions */}
            {report.requestedActions.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center mb-3">
                  <FileText className="w-5 h-5 text-green-600 mr-2" />
                  <h3 className="text-lg font-semibold">Requested Actions</h3>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex flex-wrap gap-2">
                    {report.requestedActions.map((action, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
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
                <FileText className="w-5 h-5 text-green-600 mr-2" />
                <h3 className="text-lg font-semibold">Description</h3>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-line">{report.description}</p>
              </div>
            </div>

            {/* Evidence Section */}
            {report.imageUrl && (
              <div className="mb-6">
                <div className="flex items-center mb-3">
                  <ImageIcon className="w-5 h-5 text-green-600 mr-2" />
                  <h3 className="text-lg font-semibold">Evidence</h3>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <img 
                    src={report.imageUrl} 
                    alt="Pest/Disease evidence" 
                    className="max-w-full h-auto rounded-lg max-h-64 object-contain mx-auto"
                  />
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
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
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => navigate(`/pest-diseases/edit/${report._id}`)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Report
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting || report.status !== 'Resolved'}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? (
                  <Loader className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Delete Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PestDiseaseDetailPage;