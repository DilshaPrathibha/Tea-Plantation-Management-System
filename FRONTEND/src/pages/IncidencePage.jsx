import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  Plus, 
  AlertTriangle, 
  MapPin, 
  Calendar, 
  Clock, 
  User, 
  Edit, 
  Trash2,
  RefreshCw,
  Eye,
  Loader,
  Info
} from 'lucide-react';
import Swal from 'sweetalert2';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const statusColors = {
  'Pending': 'bg-yellow-100 text-yellow-800',
  'Under Review': 'bg-blue-100 text-blue-800',
  'Action Taken': 'bg-green-100 text-green-800',
  'Resolved': 'bg-gray-100 text-gray-800',
};

const severityColors = {
  'Low': 'bg-green-100 text-green-800',
  'Medium': 'bg-yellow-100 text-yellow-800',
  'High': 'bg-orange-100 text-orange-800',
  'Critical': 'bg-red-100 text-red-800',
};

const typeIcons = {
  'Injury': '🤕',
  'Equipment Damage': '🔧',
  'Environmental Hazard': '🌿',
  'Other': '⚠️'
};

const IncidencePage = () => {
  const [incidences, setIncidences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const [showSuccess, setShowSuccess] = useState(location.state?.success || false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');

  useEffect(() => {
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
      // Clear the state to prevent showing the message again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    fetchIncidences();
  }, []);

  const fetchIncidences = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/incidences`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIncidences(response.data.items || []);
    } catch (error) {
      console.error('Error fetching incidences:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load incidence reports. Please try again.',
        confirmButtonColor: '#059669'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    navigate('/incidence/new');
  };

  const handleViewDetails = (id, e) => {
    // Prevent the click from bubbling to the card if the click was on a button
    if (e && e.stopPropagation) e.stopPropagation();
    navigate(`/incidence/${id}`);
  };

  const handleEdit = (id, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    navigate(`/incidence/edit/${id}`);
  };

  const handleDelete = async (id, status, e) => {
    // Prevent the click from bubbling to the card
    if (e && e.stopPropagation) e.stopPropagation();
    
    // Check if status is not "Resolved"
    if (status !== 'Resolved') {
      Swal.fire({
        icon: 'warning',
        title: 'Cannot Delete',
        text: 'Only resolved incidence reports can be deleted. Please resolve the report first.',
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
        setDeletingId(id);
        const token = localStorage.getItem('token');
        
        await axios.delete(`${API}/api/incidences/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Remove the deleted incidence from the list
        setIncidences(incidences.filter(inc => inc._id !== id));
        
        await Swal.fire({
          title: 'Deleted!',
          text: 'Incidence report has been deleted successfully.',
          icon: 'success',
          confirmButtonColor: '#059669'
        });
      } catch (error) {
        console.error('Error deleting incidence:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete incidence report. Please try again.',
          confirmButtonColor: '#059669'
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
      <div className="min-h-screen bg-green-50 py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-green-800">Incidence Reports</h1>
            <div className="animate-pulse bg-gray-200 h-10 w-32 rounded"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-white rounded-xl shadow p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                <div className="flex justify-between mt-4">
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        {showSuccess && (
          <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-lg flex items-center justify-center text-lg font-semibold">
            Incidence submitted successfully!
          </div>
        )}
        
        {deleteSuccess && (
          <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-lg flex items-center justify-center text-lg font-semibold">
            Incidence report deleted successfully!
          </div>
        )}

        {infoMessage && (
          <div className="mb-6 p-4 bg-blue-100 text-blue-800 rounded-lg flex items-center justify-center">
            <Info className="w-5 h-5 mr-2" />
            {infoMessage}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-green-800 flex items-center">
              <AlertTriangle className="mr-2 h-7 w-7" />
              Incidence Reports
            </h1>
            <p className="text-gray-600 mt-1">
              Manage and track all field incidents and reports
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchIncidences}
              className="flex items-center px-4 py-2 border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </button>
            <button
              onClick={handleAddNew}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-1" />
              New Report
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {/* Incidences Grid */}
        {incidences.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No incidence reports yet</h3>
            <p className="text-gray-500 mb-4">
              Get started by creating your first incidence report.
            </p>
            <button
              onClick={handleAddNew}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Create Report
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {incidences.map((incidence) => (
              <div 
                key={incidence._id} 
                className="bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={(e) => handleViewDetails(incidence._id, e)}
              >
                {/* Card Header */}
                <div className="p-5 border-b border-gray-100">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center">
                      <span className="text-2xl mr-2">{typeIcons[incidence.type] || '⚠️'}</span>
                      <h3 className="font-semibold text-gray-900 line-clamp-1">
                        {incidence.title}
                      </h3>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[incidence.status]}`}>
                      {incidence.status}
                    </span>
                  </div>
                  
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${severityColors[incidence.severity]}`}>
                    {incidence.severity} Severity
                  </span>
                </div>

                {/* Card Body */}
                <div className="p-5">
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{incidence.location === 'full_estate' ? 'Full Estate' : incidence.location}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>{formatDate(incidence.date)}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>{incidence.time}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="w-4 h-4 mr-2" />
                      <span>By: {incidence.reporterName}</span>
                    </div>

                    <div className="pt-2">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {incidence.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-5 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    {new Date(incidence.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => handleViewDetails(incidence._id, e)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="View details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleEdit(incidence._id, e)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit report"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(incidence._id, incidence.status, e)}
                      disabled={deletingId === incidence._id || incidence.status !== 'Resolved'}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors relative disabled:opacity-50 disabled:cursor-not-allowed"
                      title={incidence.status !== 'Resolved' ? 'Only resolved reports can be deleted' : 'Delete report'}
                    >
                      {deletingId === incidence._id ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
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

export default IncidencePage;