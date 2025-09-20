// FRONTEND/src/pages/PluckingRecordPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Plus, Eye, Edit, Trash2, Calendar, MapPin, Scale, DollarSign, Users, Loader, Search, Filter, X } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const PluckingRecordPage = () => {
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [fieldFilter, setFieldFilter] = useState('');
  const [availableFields, setAvailableFields] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchRecords();
    fetchFields();
  }, []);

  useEffect(() => {
    filterRecords();
  }, [records, searchTerm, dateFilter, fieldFilter]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/plucking-records`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecords(response.data.items || []);
    } catch (error) {
      console.error('Error fetching plucking records:', error);
      setError('Failed to load plucking records');
    } finally {
      setLoading(false);
    }
  };

  const fetchFields = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/fields`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailableFields(response.data.items || []);
    } catch (error) {
      console.error('Error fetching fields:', error);
    }
  };

  const filterRecords = () => {
    let filtered = records;

    // Search term filter (case-insensitive)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(record =>
        record.field.toLowerCase().includes(term) ||
        record.teaGrade.toLowerCase().includes(term) ||
        record.reporterName.toLowerCase().includes(term) ||
        record.workers.some(worker => 
          worker.workerName.toLowerCase().includes(term) ||
          worker.workerId.toLowerCase().includes(term)
        )
      );
    }

    // Date filter
    if (dateFilter) {
      filtered = filtered.filter(record => 
        new Date(record.date).toISOString().split('T')[0] === dateFilter
      );
    }

    // Field filter
    if (fieldFilter) {
      filtered = filtered.filter(record => 
        record.field === fieldFilter
      );
    }

    setFilteredRecords(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDateFilter('');
    setFieldFilter('');
  };

  const handleDelete = async (id) => {
    try {
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
        const token = localStorage.getItem('token');
        await axios.delete(`${API}/api/plucking-records/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setRecords(records.filter(record => record._id !== id));
        
        Swal.fire({
          title: 'Deleted!',
          text: 'Plucking record has been deleted.',
          icon: 'success',
          confirmButtonColor: '#059669'
        });
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to delete plucking record.',
        icon: 'error',
        confirmButtonColor: '#DC2626'
      });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const hasActiveFilters = searchTerm || dateFilter || fieldFilter;

  if (loading) {
    return (
      <div className="min-h-screen bg-green-50 py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-green-800">Daily Plucking Records</h1>
            <div className="animate-pulse bg-gray-200 h-10 w-32 rounded"></div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(item => (
              <div key={item} className="bg-white rounded-xl shadow p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-green-800 flex items-center">
              <Scale className="mr-2 h-7 w-7" />
              Daily Plucking Records
            </h1>
            <p className="text-gray-600 mt-1">
              Manage and track daily tea plucking activities
            </p>
          </div>
          <Link
            to="/plucking-records/new"
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add New Report
          </Link>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-6 bg-white rounded-xl shadow-md p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by field, grade, worker name, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 bg-green-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  !
                </span>
              )}
            </button>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </button>
            )}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Date
                </label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              {/* Field Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Field
                </label>
                <select
                  value={fieldFilter}
                  onChange={(e) => setFieldFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">All Fields</option>
                  {availableFields.map(field => (
                    <option key={field._id} value={field.name}>
                      {field.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        {hasActiveFilters && (
          <div className="mb-4 text-sm text-gray-600">
            Showing {filteredRecords.length} of {records.length} records
            {searchTerm && ` matching "${searchTerm}"`}
            {dateFilter && ` on ${new Date(dateFilter).toLocaleDateString()}`}
            {fieldFilter && ` in ${fieldFilter}`}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {/* Records Grid */}
        {filteredRecords.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <Scale className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {hasActiveFilters ? 'No matching records found' : 'No plucking records yet'}
            </h3>
            <p className="text-gray-500 mb-4">
              {hasActiveFilters ? 'Try adjusting your search or filters' : 'Get started by creating your first plucking record.'}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Clear Filters
              </button>
            ) : (
              <Link
                to="/plucking-records/new"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Create Record
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredRecords.map((record) => (
              <div key={record._id} className="bg-white rounded-xl shadow-md p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-green-800 mb-2">
                      {record.field} - {formatDate(record.date)}
                    </h3>
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>Date: {formatDate(record.date)}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>Field: {record.field}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <Scale className="w-4 h-4 mr-2" />
                      <span>Total Weight: {record.totalWeight} kg</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <DollarSign className="w-4 h-4 mr-2" />
                      <span>Total Payment: LKR {record.totalPayment.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      <span>Workers: {record.workers.length}</span>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0 flex space-x-2">
                    <Link
                      to={`/plucking-records/${record._id}`}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View details"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link
                      to={`/plucking-records/edit/${record._id}`}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Edit record"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(record._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <span className="text-sm text-gray-500">
                    Reported by: {record.reporterName} • 
                    Grade: {record.teaGrade} • 
                    Price: LKR {record.dailyPricePerKg}/kg
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PluckingRecordPage;