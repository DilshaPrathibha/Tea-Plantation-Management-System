import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  Plus, 
  Bug, 
  MapPin, 
  Calendar, 
  Clock, 
  User, 
  Edit, 
  Trash2,
  RefreshCw,
  Eye,
  Loader,
  AlertCircle,
  Search,
  Filter,
  X,
  Ruler,
  Leaf,
  Map
} from 'lucide-react';
import Swal from 'sweetalert2';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const statusColors = {
  'Pending': 'bg-amber-100 text-amber-800 border-amber-200',
  'Monitoring': 'bg-blue-100 text-blue-800 border-blue-200',
  'Treatment Ongoing': 'bg-orange-100 text-orange-800 border-orange-200',
  'Resolved': 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

const urgencyColors = {
  'Low (Routine monitoring)': 'bg-green-100 text-green-800 border-green-200',
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

const PestDiseasePage = () => {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  
  const [showSuccess, setShowSuccess] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  useEffect(() => {
    setShowSuccess(location.state?.success || false);
    setDeleteSuccess(location.state?.deleteSuccess || false);
    fetchCurrentUser();
    fetchReports();
  }, [location.state]);

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
    filterReports();
  }, [reports, searchTerm, dateFilter, typeFilter, statusFilter, urgencyFilter]);

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

  const fetchReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/pest-diseases`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(response.data.items || []);
    } catch (error) {
      console.error('Error fetching pest/disease reports:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load pest/disease reports. Please try again.',
        confirmButtonColor: '#3b82f6'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterReports = () => {
    let filtered = reports;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(report =>
        report.title?.toLowerCase().includes(term) ||
        report.reporterName?.toLowerCase().includes(term) ||
        report.location?.toLowerCase().includes(term) ||
        report.description?.toLowerCase().includes(term)
      );
    }

    if (dateFilter) {
      filtered = filtered.filter(report => 
        report.date && new Date(report.date).toISOString().split('T')[0] === dateFilter
      );
    }

    if (typeFilter) {
      filtered = filtered.filter(report => 
        report.type === typeFilter
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(report => 
        report.status === statusFilter
      );
    }

    if (urgencyFilter) {
      filtered = filtered.filter(report => 
        report.urgency === urgencyFilter
      );
    }

    setFilteredReports(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDateFilter('');
    setTypeFilter('');
    setStatusFilter('');
    setUrgencyFilter('');
  };

  const hasActiveFilters = searchTerm || dateFilter || typeFilter || statusFilter || urgencyFilter;

  const canEditReport = (report) => {
    return currentUser && 
           currentUser._id === report.reportedBy && 
           report.status !== 'Resolved';
  };

  const canDeleteReport = (report) => {
    return currentUser && 
           currentUser._id === report.reportedBy && 
           report.status === 'Resolved';
  };

  const handleAddNew = () => {
    navigate('/supervisor/pest-disease/add');
  };

  const handleViewDetails = (id, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    navigate(`/supervisor/pest-disease/${id}`);
  };

  const handleEdit = (id, status, report, e) => {
  if (e && e.stopPropagation) e.stopPropagation();
  
  if (status === 'Resolved') {
    Swal.fire({
      icon: 'warning',
      title: 'Cannot Edit',
      text: 'Resolved pest/disease reports cannot be edited.',
      confirmButtonColor: '#3b82f6'
    });
    return;
  }

  if (!canEditReport(report)) {
    Swal.fire({
      icon: 'warning',
      title: 'Access Denied',
      text: 'Only the reporter can edit this pest/disease report.',
      confirmButtonColor: '#3b82f6'
    });
    return;
  }
  
  // This should navigate to the update page
  navigate(`/supervisor/pest-disease/${id}/edit`);
};

  const handleDelete = async (id, status, report, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    
    if (status !== 'Resolved') {
      Swal.fire({
        icon: 'warning',
        title: 'Cannot Delete',
        text: 'Only resolved pest/disease reports can be deleted.',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    if (!canDeleteReport(report)) {
      Swal.fire({
        icon: 'warning',
        title: 'Access Denied',
        text: 'Only the reporter can delete this pest/disease report.',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }
    
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        setDeletingId(id);
        const token = localStorage.getItem('token');
        
        await axios.delete(`${API}/api/pest-diseases/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setReports(reports.filter(report => report._id !== id));
        
        await Swal.fire({
          title: 'Deleted!',
          text: 'Pest/Disease report has been deleted successfully.',
          icon: 'success',
          confirmButtonColor: '#3b82f6'
        });
      } catch (error) {
        console.error('Error deleting pest/disease report:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete pest/disease report. Please try again.',
          confirmButtonColor: '#3b82f6'
        });
      } finally {
        setDeletingId(null);
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'No date';
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-white rounded-lg w-64 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((item) => (
                <div key={item} className="bg-white rounded-2xl shadow-sm p-6">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Success Messages */}
        {showSuccess && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center">
            <div className="w-3 h-3 bg-emerald-500 rounded-full mr-3"></div>
            <span className="text-emerald-800 font-medium">Pest/Disease report submitted successfully!</span>
          </div>
        )}
        
        {deleteSuccess && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center">
            <div className="w-3 h-3 bg-emerald-500 rounded-full mr-3"></div>
            <span className="text-emerald-800 font-medium">Pest/Disease report deleted successfully!</span>
          </div>
        )}

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
          <div className="flex-1">
            <div className="flex items-center mb-3">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mr-4">
                <Bug className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Pest & Disease Reports</h1>
                <p className="text-gray-600 mt-1">Monitor and manage agricultural threats in your plantation</p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={fetchReports}
              className="px-4 py-2 bg-white border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-200 flex items-center shadow-sm hover:shadow-md"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
            <button
              onClick={handleAddNew}
              className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center shadow-lg hover:shadow-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Report
            </button>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-6 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Reports</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by title, reporter, location, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white"
                />
              </div>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-200 flex items-center"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 w-2 h-2 bg-green-500 rounded-full"></span>
              )}
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 flex items-center"
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </button>
            )}
          </div>

          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                >
                  <option value="">All Types</option>
                  <option value="Pest Infestation">Pest Infestation</option>
                  <option value="Disease">Disease</option>
                  <option value="Both">Both</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Monitoring">Monitoring</option>
                  <option value="Treatment Ongoing">Treatment Ongoing</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Urgency</label>
                <select
                  value={urgencyFilter}
                  onChange={(e) => setUrgencyFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                >
                  <option value="">All Urgency</option>
                  <option value="Low (Routine monitoring)">Low</option>
                  <option value="Medium (Schedule treatment)">Medium</option>
                  <option value="High (Immediate action needed)">High</option>
                  <option value="Emergency (Critical threat)">Emergency</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        {hasActiveFilters && (
          <div className="mb-4 text-sm text-gray-600">
            Showing {filteredReports.length} of {reports.length} reports
            {searchTerm && ` matching "${searchTerm}"`}
          </div>
        )}

        {/* Reports Grid */}
        {filteredReports.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <Bug className="mx-auto w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {hasActiveFilters ? 'No matching reports found' : 'No pest/disease reports yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {hasActiveFilters ? 'Try adjusting your search or filters' : 'Get started by creating your first pest/disease report.'}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={handleAddNew}
                className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200"
              >
                Create First Report
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredReports.map((report) => {
              const canEdit = canEditReport(report);
              const canDelete = canDeleteReport(report);
              const isResolved = report.status === 'Resolved';
              const hasMapLocation = report.mapCoordinates && report.mapCoordinates.lat;
              const urgencyDisplay = report.urgency ? report.urgency.split(' (')[0] : 'Unknown';
              
              return (
                <div 
                  key={report._id} 
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 overflow-hidden"
                >
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center min-w-0">
                        <span className="text-2xl mr-3 flex-shrink-0">{typeIcons[report.type] || '❓'}</span>
                        <h3 className="font-semibold text-gray-900 truncate">
                          {report.title || 'Untitled Report'}
                        </h3>
                      </div>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full border ${statusColors[report.status] || 'bg-gray-100 text-gray-800 border-gray-200'} flex-shrink-0`}>
                        {report.status || 'Unknown'}
                      </span>
                    </div>
                    
                    <span className={`px-3 py-1 text-xs font-medium rounded-full border ${urgencyColors[report.urgency] || 'bg-gray-100 text-gray-800 border-gray-200'} mb-2 inline-block`}>
                      {urgencyDisplay}
                    </span>
                  </div>

                  <div className="p-6">
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{report.location || 'No location'}</span>
                        {hasMapLocation && (
                          <Map className="w-3 h-3 ml-2 text-green-600 flex-shrink-0" />
                        )}
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span>{formatDate(report.date)}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <Ruler className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span>{report.affectedArea || 0} perch affected</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <User className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span>By: {report.reporterName || 'Unknown'}</span>
                        {currentUser && currentUser._id === report.reportedBy && (
                          <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">You</span>
                        )}
                      </div>

                      <div className="pt-2">
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {report.description || 'No description provided'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      {formatDateTime(report.createdAt)}
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => handleViewDetails(report._id, e)}
                        className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={(e) => handleEdit(report._id, report.status, report, e)}
                        className={`p-2 rounded-lg transition-colors duration-200 ${
                          canEdit 
                            ? 'text-green-600 hover:bg-green-100' 
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                        title={canEdit ? "Edit report" : isResolved ? "Resolved reports cannot be edited" : "Only the reporter can edit"}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={(e) => handleDelete(report._id, report.status, report, e)}
                        disabled={deletingId === report._id || !canDelete}
                        className={`p-2 rounded-lg transition-colors duration-200 ${
                          canDelete 
                            ? 'text-red-600 hover:bg-red-100' 
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                        title={canDelete ? "Delete report" : "Only resolved reports by the reporter can be deleted"}
                      >
                        {deletingId === report._id ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PestDiseasePage;