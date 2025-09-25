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
  Download, // <-- added
} from 'lucide-react';

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

  // Derived flag for UI badges/messages
  const hasActiveFilters = useMemo(
    () => Boolean(searchTerm || dateFilter || fieldFilter),
    [searchTerm, dateFilter, fieldFilter]
  );

  useEffect(() => {
    fetchRecords();
    fetchFields();
  }, []);

  useEffect(() => {
    filterRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records, searchTerm, dateFilter, fieldFilter]);

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

  const handleDelete = async (id) => {
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#16a34a', // green-600
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!',
      });

      if (result.isConfirmed) {
        const token = localStorage.getItem('token');
        await axios.delete(`${API}/api/plucking-records/${id}`, {
          headers: { Authorization: { toString: () => `Bearer ${token}` }.toString() }, // keep header format consistent
          // Alternatively: headers: { Authorization: `Bearer ${token}` }
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

  const printableHTML = (rows) => {
    const escape = (v) => String(v ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    const now = new Date().toLocaleString();

    const tableRows = rows.map((r, idx) => {
      const workersCount = Array.isArray(r.workers) ? r.workers.length : 0;
      const totalPayment = Number(r.totalPayment || 0).toFixed(2);
      const price = r.dailyPricePerKg ?? '';
      return `
        <tr>
          <td>${idx + 1}</td>
          <td>${escape(r.field || '')}</td>
          <td>${escape(formatDate(r.date) || '')}</td>
          <td>${escape(r.teaGrade || '')}</td>
          <td>${escape(String(r.totalWeight ?? ''))}</td>
          <td>${escape(String(price))}</td>
          <td>${escape(totalPayment)}</td>
          <td>${escape(String(workersCount))}</td>
          <td>${escape(r.reporterName || '')}</td>
        </tr>
      `;
    }).join('');

    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Daily Plucking Records</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; padding: 24px; color: #111; }
    h1 { margin: 0 0 6px; }
    .meta { font-size: 12px; color: #555; margin-bottom: 16px; }
    .filters { font-size: 12px; color: #333; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #ddd; padding: 8px; vertical-align: top; }
    th { background: #f3f4f6; text-align: left; }
    tfoot td { border: none; padding-top: 12px; font-size: 12px; color: #555; }
    .count { margin: 8px 0 16px; font-weight: bold; }
    @media print { @page { size: A4 landscape; margin: 12mm; } .noprint { display: none; } }
  </style>
</head>
<body>
  <h1>Daily Plucking Records</h1>
  <div class="meta">Generated at: ${escape(now)}</div>
  <div class="filters">
    <div><strong>Search:</strong> ${escape(searchTerm || '—')}</div>
    <div><strong>Date:</strong> ${escape(dateFilter ? new Date(dateFilter).toLocaleDateString() : 'All')}</div>
    <div><strong>Field:</strong> ${escape(fieldFilter || 'All')}</div>
  </div>
  <div class="count">Total: ${rows.length}</div>
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
      ${tableRows || `<tr><td colspan="9" style="text-align:center;color:#666;">No data for current filters</td></tr>`}
    </tbody>
    <tfoot>
      <tr><td colspan="9">Tip: In the print dialog, choose <em>Save as PDF</em>.</td></tr>
    </tfoot>
  </table>
  <div class="noprint" style="margin-top:16px;">
    <button onclick="window.print()">Print / Save as PDF</button>
  </div>
</body>
</html>`;
  };

  const exportPDF = () => {
    const html = printableHTML(filteredRecords);
    const w = window.open('', '_blank', 'noopener,noreferrer');
    if (!w) {
      Swal.fire({
        icon: 'warning',
        title: 'Popup Blocked',
        text: 'Please allow popups for this site to export PDF.',
        confirmButtonColor: '#16a34a',
      });
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.onload = () => {
      try { w.focus(); w.print(); } catch (_) {}
    };
  };

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
            <p className="text-gray-600 mt-1">Manage and track daily tea plucking activities</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={exportPDF}
              disabled={filteredRecords.length === 0}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                filteredRecords.length === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-800'
              }`}
              title={filteredRecords.length === 0 ? 'No data to export' : 'Export current view to PDF'}
            >
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </button>

            <Link
              to="/plucking-records/add"
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add New Report
            </Link>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-6 bg-white rounded-xl shadow-md p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
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
              onClick={() => setShowFilters((v) => !v)}
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
                  {(availableFields || []).map((field) => (
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

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-2 text-gray-600">
            <Loader className="w-4 h-4 animate-spin" />
            Loading...
          </div>
        )}

        {/* Records Grid or No Records Message */}
        {!loading && (
          <>
            {filteredRecords.length === 0 ? (
              <div className="bg-white rounded-xl shadow p-8 text-center">
                <Scale className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {hasActiveFilters ? 'No matching records found' : 'No plucking records yet'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {hasActiveFilters
                    ? 'Try adjusting your search or filters'
                    : 'Get started by creating your first plucking record.'}
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
                    to="/plucking-records/add"
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
                          <span>
                            Total Payment: LKR {Number(record.totalPayment || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="w-4 h-4 mr-2" />
                          <span>Workers: {Array.isArray(record.workers) ? record.workers.length : 0}</span>
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
                          to={`/plucking-records/${record._id}/edit`}
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
                        Reported by: {record.reporterName} • Grade: {record.teaGrade} • Price: LKR{' '}
                        {record.dailyPricePerKg}/kg
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PluckingRecordPage;
