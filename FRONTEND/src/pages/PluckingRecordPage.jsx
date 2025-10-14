// FRONTEND/src/pages/PluckingRecordPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  Calendar,
  MapPin,
  Scale,
  DollarSign,
  Users,
  Loader,
  Search,
  Filter,
  X,
  Download,
  Leaf,
  TrendingUp,
  UserCheck,
  Clock,
  BarChart3,
  RefreshCw
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const PluckingRecordPage = () => {
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [fieldFilter, setFieldFilter] = useState('');
  const [availableFields, setAvailableFields] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Derived flag for UI badges/messages
  const hasActiveFilters = useMemo(
    () => Boolean(searchTerm || dateFilter || fieldFilter),
    [searchTerm, dateFilter, fieldFilter]
  );

  useEffect(() => {
    fetchRecords();
    fetchFields();
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    filterRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records, searchTerm, dateFilter, fieldFilter]);

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

  const formatDate = (d) => {
    try {
      const dt = new Date(d);
      return dt.toLocaleDateString();
    } catch {
      return d;
    }
  };

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/plucking-records`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecords(response.data.items || []);
    } catch (err) {
      console.error('Error fetching plucking records:', err);
      setError('Failed to load plucking records');
    } finally {
      setLoading(false);
    }
  };

  const fetchFields = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/fields`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAvailableFields(response.data.items || []);
    } catch (err) {
      console.error('Error fetching fields:', err);
      // non-blocking
    }
  };

  const filterRecords = () => {
    let filtered = Array.isArray(records) ? [...records] : [];

    // Search term filter (case-insensitive)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((record) => {
        const field = String(record.field || '').toLowerCase();
        const teaGrade = String(record.teaGrade || '').toLowerCase();
        const reporterName = String(record.reporterName || '').toLowerCase();
        const workers = Array.isArray(record.workers) ? record.workers : [];
        const workersMatch = workers.some(
          (w) =>
            String(w.workerName || '').toLowerCase().includes(term) ||
            String(w.workerId || '').toLowerCase().includes(term)
        );
        return (
          field.includes(term) ||
          teaGrade.includes(term) ||
          reporterName.includes(term) ||
          workersMatch
        );
      });
    }

    // Date filter (expects yyyy-mm-dd in dateFilter)
    if (dateFilter) {
      filtered = filtered.filter((record) => {
        const recDate = new Date(record.date);
        const ymd = recDate.toISOString().split('T')[0];
        return ymd === dateFilter;
      });
    }

    // Field filter
    if (fieldFilter) {
      filtered = filtered.filter((record) => record.field === fieldFilter);
    }

    setFilteredRecords(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDateFilter('');
    setFieldFilter('');
  };

  const canEditRecord = (record) => {
    return currentUser && currentUser._id === record.reportedBy;
  };

  const canDeleteRecord = (record) => {
    return currentUser && currentUser._id === record.reportedBy;
  };

  const handleDelete = async (id, record) => {
    try {
      if (!canDeleteRecord(record)) {
        Swal.fire({
          icon: 'warning',
          title: 'Access Denied',
          text: 'Only the reporter can delete this plucking record.',
          confirmButtonColor: '#16a34a'
        });
        return;
      }

      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#16a34a',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!',
      });

      if (result.isConfirmed) {
        const token = localStorage.getItem('token');
        await axios.delete(`${API}/api/plucking-records/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        await fetchRecords();
        Swal.fire('Deleted!', 'The plucking record has been deleted.', 'success');
      }
    } catch (err) {
      console.error('Error deleting record:', err);
      Swal.fire('Error', 'Failed to delete the record.', 'error');
    }
  };

  // ============= PDF Export (no dependencies) =============
  // ---- ZERO-DEPENDENCY PDF (print) ----
  const exportPDF = () => {
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
        table { 
          width: 100%; 
          border-collapse: collapse; 
          font-size: 12px; 
          margin-bottom: 40px;
        }
        th { 
          background: #22C55E; 
          color: #000; 
          font-weight: bold; 
          padding: 12px 8px; 
          text-align: left;
        }
        td { 
          padding: 10px 8px; 
          border-bottom: 1px solid #eee; 
        }
        .status-active { 
          color: #22C55E; 
          font-weight: bold; 
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

    const rowsHtml = filteredRecords.map((r, idx) => {
      const workersCount = Array.isArray(r.workers) ? r.workers.length : 0;
      const totalPayment = Number(r.totalPayment || 0).toFixed(2);
      const totalWeight = Number(r.totalWeight || 0).toFixed(2);
      const price = r.dailyPricePerKg ? Number(r.dailyPricePerKg).toFixed(2) : '';
      return `
        <tr>
          <td>${idx + 1}</td>
          <td>${escapeHTML(r.field || '')}</td>
          <td>${escapeHTML(formatDate(r.date) || '')}</td>
          <td>${escapeHTML(r.teaGrade || '')}</td>
          <td>${escapeHTML(totalWeight)}</td>
          <td>${escapeHTML(String(price))}</td>
          <td>${escapeHTML(totalPayment)}</td>
          <td>${escapeHTML(String(workersCount))}</td>
          <td>${escapeHTML(r.reporterName || '')}</td>
        </tr>
      `;
    }).join('');

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
            Records Shown: ${filteredRecords.length}
          </div>
        </div>
        
        <!-- Report Title -->
        <div class="report-title">Daily Plucking Records</div>
        
        <!-- Data Table -->
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Field</th>
              <th>Date</th>
              <th>Tea Grade</th>
              <th>Total Weight (kg)</th>
              <th>Price (LKR/kg)</th>
              <th>Total Payment (LKR)</th>
              <th># Workers</th>
              <th>Reporter</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || `<tr><td colspan="9" style="text-align:center;color:#666;">No data available</td></tr>`}
          </tbody>
        </table>
        
        <!-- Footer Section -->
        <div class="footer">
          <div class="footer-company">CeylonLeaf Plantations</div>
          <div class="footer-address">No. 123, Tea Estate Road, Nuwara Eliya, Sri Lanka</div>
          <div class="footer-slogan">Cultivating excellence in every leaf.</div>
          <div class="page-number">Page 1</div>
        </div>
      </body></html>
    `;
    w.document.open(); w.document.write(html); w.document.close();
    w.onload = () => { w.focus(); w.print(); };
  };

  // Calculate TODAY'S statistics
  const getTodayRecords = () => {
    const today = new Date();
    return records.filter(record => {
      const recordDate = new Date(record.date);
      return (
        today.getFullYear() === recordDate.getFullYear() &&
        today.getMonth() === recordDate.getMonth() &&
        today.getDate() === recordDate.getDate()
      );
    });
  };

  const todayRecords = useMemo(() => getTodayRecords(), [records]);

  // Today's statistics
  const todayTotalWeight = useMemo(() => 
    todayRecords.reduce((sum, record) => sum + (Number(record.totalWeight) || 0), 0), 
    [todayRecords]
  );
  
  const todayTotalPayment = useMemo(() => 
    todayRecords.reduce((sum, record) => sum + (Number(record.totalPayment) || 0), 0), 
    [todayRecords]
  );
  
  const todayTotalWorkers = useMemo(() => 
    todayRecords.reduce((sum, record) => sum + (Array.isArray(record.workers) ? record.workers.length : 0), 0), 
    [todayRecords]
  );
  
  const todayUniqueFields = useMemo(() => 
    [...new Set(todayRecords.map(record => record.field))].length, 
    [todayRecords]
  );

  // Format today's date for display
  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  return (
    <div className="min-h-screen bg-base-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
          <div className="flex-1">
            <div className="flex items-center mb-3">
              <div className="w-14 h-14 bg-base-200 rounded-2xl shadow-lg flex items-center justify-center mr-4 border border-base-content/10">
                <Leaf className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-base-content">Daily Plucking Records</h1>
                <p className="text-base-content mt-2 font-medium">Manage and track daily tea plucking activities</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                fetchRecords();
                fetchFields();
              }}
              className="px-4 py-3 bg-base-200 border-2 border-base-content/10 rounded-xl text-base-content hover:bg-base-300 transition-all duration-200 flex items-center shadow-sm hover:shadow-md font-semibold"
              title="Refresh records and fields"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Refresh
            </button>
            <button
              onClick={exportPDF}
              disabled={filteredRecords.length === 0}
              className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 font-semibold ${
                filteredRecords.length === 0
                  ? 'bg-base-300 text-base-content/50 cursor-not-allowed'
                  : 'bg-base-200 border-2 border-base-content/10 hover:bg-base-300 text-base-content shadow-lg hover:shadow-xl'
              }`}
              title={filteredRecords.length === 0 ? 'No data to export' : 'Export current view to PDF'}
            >
              <Download className="w-5 h-5 mr-2" />
              Export PDF
            </button>
            <Link
              to="/plucking-records/add"
              className="flex items-center px-6 py-3 bg-primary hover:bg-primary-focus text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add New Report
            </Link>
          </div>
        </div>

        {/* Today's Statistics Cards */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-base-content flex items-center">
              <Clock className="w-6 h-6 mr-2 text-primary" />
              Today's Overview - {todayFormatted}
            </h2>
            <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full border-2 border-green-200">
              {todayRecords.length} {todayRecords.length === 1 ? 'Record' : 'Records'}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Today's Records */}
            <div className="rounded-2xl shadow-xl p-6 bg-base-200 border-2 border-green-200 hover:scale-[1.03] hover:shadow-2xl transition-transform duration-200">
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg">
                  <TrendingUp className="w-7 h-7 text-white" />
                </span>
                <span className="text-green-700 font-bold text-lg">Records</span>
              </div>
              <div className="mt-4 text-3xl font-extrabold text-green-900 text-center">{todayRecords.length}</div>
              <div className="mt-2 text-sm text-primary text-center">Today's Records</div>
            </div>

            {/* Card 2: Today's Weight */}
            <div className="rounded-2xl shadow-xl p-6 bg-base-200 border-2 border-blue-200 hover:scale-[1.03] hover:shadow-2xl transition-transform duration-200">
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg">
                  <Scale className="w-7 h-7 text-white" />
                </span>
                <span className="text-blue-700 font-bold text-lg">Weight</span>
              </div>
              <div className="mt-4 text-3xl font-extrabold text-blue-900 text-center">{todayTotalWeight.toFixed(2)} kg</div>
              <div className="mt-2 text-sm text-primary text-center">Today's Weight</div>
            </div>

            {/* Card 3: Today's Payment */}
            <div className="rounded-2xl shadow-xl p-6 bg-base-200 border-2 border-purple-200 hover:scale-[1.03] hover:shadow-2xl transition-transform duration-200">
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 shadow-lg">
                  <DollarSign className="w-7 h-7 text-white" />
                </span>
                <span className="text-purple-700 font-bold text-lg">Payment</span>
              </div>
              <div className="mt-4 text-3xl font-extrabold text-purple-900 text-center">LKR {todayTotalPayment.toFixed(2)}</div>
              <div className="mt-2 text-sm text-purple-600 text-center">Today's Payment</div>
            </div>

            {/* Card 4: Today's Workers */}
            <div className="rounded-2xl shadow-xl p-6 bg-base-200 border-2 border-orange-200 hover:scale-[1.03] hover:shadow-2xl transition-transform duration-200">
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg">
                  <UserCheck className="w-7 h-7 text-white" />
                </span>
                <span className="text-orange-700 font-bold text-lg">Workers</span>
              </div>
              <div className="mt-4 text-3xl font-extrabold text-orange-900 text-center">{todayTotalWorkers}</div>
              <div className="mt-2 text-sm text-orange-600 text-center">Today's Workers</div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-6 bg-base-200 rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-base-content mb-2">Search Records</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by field, grade, worker name, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-base-content/10 rounded-xl focus:ring-2 focus:ring-primary focus:border-green-500 transition-all duration-200 bg-base-200 text-base-content"
                />
              </div>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-3 bg-base-200 border-2 border-base-content/10 rounded-xl text-base-content hover:bg-base-300 transition-all duration-200 flex items-center font-semibold"
            >
              <Filter className="w-5 h-5 mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 w-2 h-2 bg-green-500 rounded-full"></span>
              )}
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 flex items-center font-semibold border-2 border-red-200"
              >
                <X className="w-5 h-5 mr-1" />
                Clear
              </button>
            )}
          </div>

          {showFilters && (
            <div className="mt-6 pt-6 border-t-2 border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-base-content mb-2">Filter by Date</label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-base-content/10 rounded-xl focus:ring-2 focus:ring-primary focus:border-green-500 bg-base-200 text-base-content"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-base-content mb-2">Filter by Field</label>
                <select
                  value={fieldFilter}
                  onChange={(e) => setFieldFilter(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-base-content/10 rounded-xl focus:ring-2 focus:ring-primary focus:border-green-500 bg-base-200 text-base-content"
                >
                  <option value="" className="text-base-content/60">All Fields</option>
                  {(availableFields || []).map((field) => (
                    <option key={field._id} value={field.name} className="text-base-content">
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
          <div className="mb-4 text-sm text-base-content font-medium bg-blue-50 rounded-xl p-4 border-2 border-blue-100">
            Showing {filteredRecords.length} of {records.length} records
            {searchTerm && ` matching "${searchTerm}"`}
            {dateFilter && ` on ${new Date(dateFilter).toLocaleDateString()}`}
            {fieldFilter && ` in ${fieldFilter}`}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-800 rounded-2xl border-2 border-red-200 shadow-sm">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-red-600 text-sm font-bold">!</span>
              </div>
              {error}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-3 text-base-content bg-base-200 rounded-2xl p-6 shadow-lg">
            <Loader className="w-5 h-5 animate-spin text-primary" />
            <span className="font-semibold">Loading plucking records...</span>
          </div>
        )}

        {/* Records Grid or No Records Message */}
        {!loading && (
          <>
            {filteredRecords.length === 0 ? (
              <div className="bg-base-200 rounded-2xl shadow-lg border border-base-content/10 p-12 text-center">
                <Leaf className="mx-auto w-16 h-16 text-base-content/30 mb-4" />
                <h3 className="text-xl font-bold text-base-content mb-2">
                  {hasActiveFilters ? 'No matching records found' : 'No plucking records yet'}
                </h3>
                <p className="text-base-content/70 mb-6 font-medium">
                  {hasActiveFilters
                    ? 'Try adjusting your search or filters'
                    : 'Get started by creating your first plucking record.'}
                </p>
                {hasActiveFilters ? (
                  <button
                    onClick={clearFilters}
                    className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-focus transition-colors font-semibold shadow-lg hover:shadow-xl"
                  >
                    Clear Filters
                  </button>
                ) : (
                  <Link
                    to="/plucking-records/add"
                    className="px-6 py-3 bg-gradient-to-r from-primary to-primary-focus text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                  >
                    Create Record
                  </Link>
                )}
              </div>
            ) : (
              // CHANGED: 2 records per row on large screens
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {filteredRecords.map((record) => {
                  const canEdit = canEditRecord(record);
                  const canDelete = canDeleteRecord(record);
                  
                  // Check if record is from today (local date)
                  const isTodayRecord = () => {
                    const today = new Date();
                    const recordDate = new Date(record.date);
                    return (
                      today.getFullYear() === recordDate.getFullYear() &&
                      today.getMonth() === recordDate.getMonth() &&
                      today.getDate() === recordDate.getDate()
                    );
                  };

                  return (
                    <div key={record._id} className={`bg-base-200 rounded-2xl shadow-lg border-2 transition-all duration-300 overflow-hidden hover:shadow-xl ${
                      isTodayRecord() 
                        ? 'border-green-300 bg-green-50' 
                        : 'border-gray-100'
                    }`}>
                      {isTodayRecord() && (
                        <div className="bg-green-500 text-white px-4 py-2 text-sm font-semibold text-center">
                          📍 Today's Record
                        </div>
                      )}
                      
                      {/* Card Header */}
                      <div className="p-6 border-b border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-base-content truncate">
                              {record.field}
                            </h3>
                            <p className="text-sm text-base-content/70 mt-1">{formatDate(record.date)}</p>
                          </div>
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full border border-blue-200 flex-shrink-0 ml-3">
                            {record.teaGrade}
                          </span>
                        </div>
                        
                        {/* Key Metrics */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="text-center p-3 bg-base-300 rounded-lg border border-base-content/10">
                            <div className="flex items-center justify-center mb-1">
                              <Scale className="w-4 h-4 text-primary mr-1" />
                              <span className="text-xs text-base-content/70 font-medium">Weight</span>
                            </div>
                            <p className="text-lg font-semibold text-base-content">
                              {Number(record.totalWeight || 0).toFixed(2)} kg
                            </p>
                          </div>
                          <div className="text-center p-3 bg-base-300 rounded-lg border border-base-content/10">
                            <div className="flex items-center justify-center mb-1">
                              <DollarSign className="w-4 h-4 text-primary mr-1" />
                              <span className="text-xs text-base-content/70 font-medium">Payment</span>
                            </div>
                            <p className="text-lg font-semibold text-base-content">
                              LKR {Number(record.totalPayment || 0).toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {/* Detailed Information */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-sm text-base-content/70">Field Location</span>
                            <span className="text-sm font-medium text-base-content">{record.field}</span>
                          </div>
                          
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-sm text-base-content/70">Price per KG</span>
                            <span className="text-sm font-medium text-base-content">
                              LKR {Number(record.dailyPricePerKg || 0).toFixed(2)}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-sm text-base-content/70">Workers Count</span>
                            <div className="flex items-center">
                              <Users className="w-4 h-4 text-base-content/60 mr-1" />
                              <span className="text-sm font-medium text-base-content">
                                {Array.isArray(record.workers) ? record.workers.length : 0}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center py-2">
                            <span className="text-sm text-base-content/70">Reported by</span>
                            <div className="flex items-center">
                              <span className="text-sm font-medium text-base-content mr-2">
                                {record.reporterName}
                              </span>
                              {currentUser && currentUser._id === record.reportedBy && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-medium border border-green-200">
                                  You
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="px-6 py-4 bg-base-300 border-t border-gray-100">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-base-content/70">
                            Created: {new Date(record.createdAt).toLocaleDateString()}
                          </span>
                          <div className="flex space-x-2">
                            <Link
                              to={`/plucking-records/${record._id}`}
                              className="p-2 text-base-content/70 hover:bg-base-200 rounded-lg transition-colors duration-200 border border-base-content/10 hover:border-gray-400"
                              title="View details"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            
                            {canEdit && (
                              <Link
                                to={`/plucking-records/${record._id}/edit`}
                                className="p-2 text-primary hover:bg-blue-50 rounded-lg transition-colors duration-200 border border-blue-300 hover:border-blue-400"
                                title="Edit record"
                              >
                                <Edit className="w-4 h-4" />
                              </Link>
                            )}
                            
                            {canDelete && (
                              <button
                                onClick={() => handleDelete(record._id, record)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 border border-red-300 hover:border-red-400"
                                title="Delete record"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PluckingRecordPage;
