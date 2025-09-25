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
  Eye
} from 'lucide-react';
import Swal from 'sweetalert2';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const statusColors = {
  'Pending': 'badge badge-warning',
  'Under Review': 'badge badge-info',
  'Action Taken': 'badge badge-success',
  'Resolved': 'badge badge-neutral',
};

const severityColors = {
  'Low': 'badge badge-success',
  'Medium': 'badge badge-warning',
  'High': 'badge badge-error',
  'Critical': 'badge badge-error',
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
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1d4ed8',
      cancelButtonColor: '#dc2626',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
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
          confirmButtonColor: '#1d4ed8'
        });
        
        navigate('/incidences');
      } catch (error) {
        console.error('Error deleting incidence:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete incidence report. Please try again.',
          confirmButtonColor: '#1d4ed8'
        });
      } finally {
        setDeleting(false);
      }
    }
  };

  const handleEdit = () => {
    // Check if current user is the reporter
    if (!currentUser || currentUser._id !== incidence.reportedBy) {
      Swal.fire({
        icon: 'warning',
        title: 'Access Denied',
        text: 'Only the reporter can edit this incidence report.',
        confirmButtonColor: '#1d4ed8'
      });
      return;
    }

    // Check if incidence is resolved
    if (incidence.status === 'Resolved') {
      Swal.fire({
        icon: 'warning',
        title: 'Cannot Edit',
        text: 'Resolved incidence reports cannot be edited.',
        confirmButtonColor: '#1d4ed8'
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
      <div className="min-h-screen bg-base-200 py-8 px-4">
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
      <div className="min-h-screen bg-base-200 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/incidences" className="inline-flex items-center text-primary hover:text-primary-focus mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reports
          </Link>
          <div className="bg-base-100 rounded-xl shadow p-6 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-error mb-4" />
            <h2 className="text-xl font-semibold text-base-content mb-2">Error Loading Report</h2>
            <p className="text-base-content/60 mb-4">{error}</p>
            <button
              onClick={fetchIncidence}
              className="btn btn-primary"
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
      <div className="min-h-screen bg-base-200 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/incidences" className="inline-flex items-center text-primary hover:text-primary-focus mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reports
          </Link>
          <div className="bg-base-100 rounded-xl shadow p-6 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-warning mb-4" />
            <h2 className="text-xl font-semibold text-base-content mb-2">Report Not Found</h2>
            <p className="text-base-content/60 mb-4">The requested incidence report could not be found.</p>
            <Link
              to="/incidences"
              className="btn btn-primary"
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

  return (
    <div className="min-h-screen bg-base-200 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Link 
            to="/incidences" 
            className="inline-flex items-center text-primary hover:text-primary-focus mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reports
          </Link>
          <span className={statusColors[incidence.status]}>
            {incidence.status}
          </span>
        </div>

        {/* Main Content */}
        <div className="bg-base-100 rounded-xl shadow-md overflow-hidden">
          {/* Header Section */}
          <div className="bg-primary/10 p-6 border-b border-primary/20">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex items-center mb-2">
                  <span className="text-3xl mr-3">{typeIcons[incidence.type] || '⚠️'}</span>
                  <h1 className="text-2xl font-bold text-base-content">{incidence.title}</h1>
                </div>
                <p className="text-base-content/70">Reported by {incidence.reporterName}</p>
                {currentUser && currentUser._id === incidence.reportedBy && (
                  <span className="badge badge-info badge-sm mt-1">Your Report</span>
                )}
              </div>
              <span className={severityColors[incidence.severity] + " mt-4 md:mt-0"}>
                {incidence.severity} Severity
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 text-primary mr-3" />
                  <div>
                    <p className="text-sm text-base-content/60">Location</p>
                    <p className="font-medium">{incidence.location === 'full_estate' ? 'Full Estate' : incidence.location}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-primary mr-3" />
                  <div>
                    <p className="text-sm text-base-content/60">Date of Incident</p>
                    <p className="font-medium">{formatDate(incidence.date)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-primary mr-3" />
                  <div>
                    <p className="text-sm text-base-content/60">Time of Incident</p>
                    <p className="font-medium">{incidence.time}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-primary mr-3" />
                  <div>
                    <p className="text-sm text-base-content/60">Type</p>
                    <p className="font-medium">{incidence.type}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <div className="flex items-center mb-3">
                <FileText className="w-5 h-5 text-primary mr-2" />
                <h3 className="text-lg font-semibold">Description</h3>
              </div>
              <div className="bg-base-200 rounded-lg p-4">
                <p className="text-base-content whitespace-pre-line">{incidence.description}</p>
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
                  />
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="pt-6 border-t border-base-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-base-content/60">
                <div>
                  <p>Reported on: {formatDateTime(incidence.createdAt)}</p>
                  {incidence.updatedAt !== incidence.createdAt && (
                    <p>Last updated: {formatDateTime(incidence.updatedAt)}</p>
                  )}
                </div>
                <div className="md:text-right">
                  <p>Report ID: {incidence._id}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-base-200 px-6 py-4 border-t border-base-300">
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleEdit}
                className={`btn ${canEdit ? 'btn-primary' : 'btn-disabled'}`}
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
                className={`btn ${canDelete ? 'btn-error' : 'btn-disabled'}`}
                title={canDelete ? "Delete Report" : "Only resolved reports by the reporter can be deleted"}
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

export default IncidenceDetailPage;