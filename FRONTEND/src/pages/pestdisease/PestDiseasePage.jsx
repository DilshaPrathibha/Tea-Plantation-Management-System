import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  Plus, 
  Bug, 
  MapPin, 
  Calendar, 
  User, 
  Edit, 
  Trash2,
  RefreshCw,
  Eye,
  Loader,
  AlertCircle,
  Ruler
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

const PestDiseasePage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const [showSuccess, setShowSuccess] = useState(location.state?.success || false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
    
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  useEffect(() => {
    if (deleteSuccess) {
      const timer = setTimeout(() => setDeleteSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [deleteSuccess]);

  useEffect(() => {
    if (location.state?.deleteSuccess) {
      setDeleteSuccess(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/pestdisease`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(response.data.items || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load pest/disease reports. Please try again.',
        confirmButtonColor: '#059669',
        background: '#1f2937',
        color: '#fff'
      });
    } finally {
      setLoading(false);
    }
  };

  // Can edit if status is not Resolved
  const canEdit = (report) => {
    if (!report) return false;
    return report.status !== 'Resolved';
  };

  // Can delete only if status is Resolved AND user is the reporter
  const canDelete = (report) => {
    if (!currentUser || !report) return false;
    return report.status === 'Resolved' && report.reporterId === currentUser.id;
  };

  const handleAddNew = () => navigate('/pestdisease/add');
  const handleViewDetails = (id, e) => {
    if (e) e.stopPropagation();
    navigate(`/pestdisease/${id}`);
  };
  const handleEdit = (id, e) => {
    if (e) e.stopPropagation();
    navigate(`/pestdisease/${id}/edit`);
  };

  const handleDelete = async (report, e) => {
    if (e) e.stopPropagation();
    
    if (!canDelete(report)) {
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
        setDeletingId(report._id);
        const token = localStorage.getItem('token');
        
        await axios.delete(`${API}/api/pestdisease/${report._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setReports(reports.filter(r => r._id !== report._id));
        
        await Swal.fire({
          title: 'Deleted!',
          text: 'Report has been deleted successfully.',
          icon: 'success',
          confirmButtonColor: '#059669',
          background: '#1f2937',
          color: '#fff'
        });
      } catch (error) {
        console.error('Error deleting report:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete report. Please try again.',
          confirmButtonColor: '#059669',
          background: '#1f2937',
          color: '#fff'
        });
      } finally {
        setDeletingId(null);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-base-content">Pest & Disease Reports</h1>
            <div className="animate-pulse bg-base-300 h-10 w-32 rounded"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-base-100 rounded-xl shadow p-6 animate-pulse">
                <div className="h-6 bg-base-300 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-base-300 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-base-300 rounded w-2/3 mb-4"></div>
                <div className="flex justify-between mt-4">
                  <div className="h-8 bg-base-300 rounded w-16"></div>
                  <div className="h-8 bg-base-300 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        {showSuccess && (
          <div className="mb-6 p-4 bg-success/20 text-success-content rounded-lg flex items-center justify-center text-lg font-semibold">
            Report submitted successfully!
          </div>
        )}
        
        {deleteSuccess && (
          <div className="mb-6 p-4 bg-success/20 text-success-content rounded-lg flex items-center justify-center text-lg font-semibold">
            Report deleted successfully!
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-base-content flex items-center">
              <Bug className="mr-2 h-7 w-7" />
              Pest & Disease Reports
            </h1>
            <p className="text-base-content/70 mt-1">
              Monitor and manage agricultural threats in your plantation
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchReports}
              className="btn btn-outline"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </button>
            <button
              onClick={handleAddNew}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-1" />
              New Report
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-error mb-6">
            <span>{error}</span>
            <button className="btn btn-sm btn-ghost" onClick={fetchReports}>
              Try Again
            </button>
          </div>
        )}

        {reports.length === 0 ? (
          <div className="bg-base-100 rounded-xl shadow p-8 text-center">
            <Bug className="mx-auto h-12 w-12 text-base-content/40 mb-4" />
            <h3 className="text-lg font-medium text-base-content mb-2">No pest/disease reports yet</h3>
            <p className="text-base-content/70 mb-4">
              Get started by creating your first pest or disease report.
            </p>
            <button
              onClick={handleAddNew}
              className="btn btn-primary"
            >
              Create Report
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <div 
                key={report._id} 
                className="bg-base-100 rounded-xl shadow-md border border-base-300 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={(e) => handleViewDetails(report._id, e)}
              >
                <div className="p-5 border-b border-base-300">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center">
                      <span className="text-2xl mr-2">{typeIcons[report.issueType] || '❓'}</span>
                      <h3 className="font-semibold text-base-content line-clamp-1">
                        {report.pestDiseaseName}
                      </h3>
                    </div>
                    <span className={`badge ${statusColors[report.status]}`}>
                      {report.status}
                    </span>
                  </div>
                  
                  <span className={`badge ${severityColors[report.severity]}`}>
                    {report.severity} Severity
                  </span>
                </div>

                <div className="p-5">
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-base-content/70">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{report.location}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-base-content/70">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>{formatDate(report.date)}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-base-content/70">
                      <Ruler className="w-4 h-4 mr-2" />
                      <span>{report.affectedArea} acres affected</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-base-content/70">
                      <User className="w-4 h-4 mr-2" />
                      <span>By: {report.reporterName}</span>
                    </div>

                    <div className="pt-2">
                      <p className="text-sm text-base-content/70 line-clamp-2">
                        {report.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 border-t border-base-300 flex justify-between items-center">
                  <span className="text-xs text-base-content/50">
                    {report.reportId}
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => handleViewDetails(report._id, e)}
                      className="btn btn-ghost btn-sm"
                      title="View details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {canEdit(report) && (
                      <button
                        onClick={(e) => handleEdit(report._id, e)}
                        className="btn btn-ghost btn-sm"
                        title="Edit report"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    {canDelete(report) && (
                      <button
                        onClick={(e) => handleDelete(report, e)}
                        disabled={deletingId === report._id}
                        className="btn btn-ghost btn-sm text-error hover:bg-error/20"
                        title="Delete report"
                      >
                        {deletingId === report._id ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PestDiseasePage;