import React, { useState, useEffect, useMemo } from 'react';
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
  Info,
  Search,
  Download
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
  const [currentUser, setCurrentUser] = useState(null);

  // NEW: search & filters
  const [q, setQ] = useState('');
  const [filterField, setFilterField] = useState('all'); // location
  const [filterType, setFilterType] = useState('all');   // incidence type

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
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    fetchCurrentUser();
    fetchIncidences();
  }, []);

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

  const fetchIncidences = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/incidences`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIncidences(response.data.items || []);
      setError('');
    } catch (error) {
      console.error('Error fetching incidences:', error);
      setError('Failed to load incidence reports. Please try again.');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load incidence reports. Please try again.',
        confirmButtonColor: '#1d4ed8'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    navigate('/incidences/add');
  };

  const handleViewDetails = (id, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    navigate(`/incidences/${id}`);
  };

  const handleEdit = (id, status, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    
    if (status === 'Resolved') {
      Swal.fire({
        icon: 'warning',
        title: 'Cannot Edit',
        text: 'Resolved incidence reports cannot be edited.',
        confirmButtonColor: '#1d4ed8'
      });
      return;
    }
    
    navigate(`/incidences/${id}/edit`);
  };

  const handleDelete = async (id, status, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    
    if (status !== 'Resolved') {
      Swal.fire({
        icon: 'warning',
        title: 'Cannot Delete',
        text: 'Only resolved incidence reports can be deleted. Please resolve the report first.',
        confirmButtonColor: '#1d4ed8'
      });
      return;
    }
    
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
        setDeletingId(id);
        const token = localStorage.getItem('token');
        
        await axios.delete(`${API}/api/incidences/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setIncidences(prev => prev.filter(inc => inc._id !== id));
        
        await Swal.fire({
          title: 'Deleted!',
          text: 'Incidence report has been deleted successfully.',
          icon: 'success',
          confirmButtonColor: '#1d4ed8'
        });
      } catch (error) {
        console.error('Error deleting incidence:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete incidence report. Please try again.',
          confirmButtonColor: '#1d4ed8'
        });
      } finally {
        setDeletingId(null);
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const canEditIncidence = (incidence) => {
    return currentUser && 
           currentUser._id === incidence.reportedBy && 
           incidence.status !== 'Resolved';
  };

  const canDeleteIncidence = (incidence) => {
    return currentUser && 
           currentUser._id === incidence.reportedBy && 
           incidence.status === 'Resolved';
  };

  // ---------- FILTERS & SEARCH ----------

  const uniqueFields = useMemo(() => {
    const set = new Set();
    incidences.forEach(i => set.add(i.location || 'Unknown'));
    return ['all', ...Array.from(set)];
  }, [incidences]);

  const uniqueTypes = useMemo(() => {
    const set = new Set();
    incidences.forEach(i => set.add(i.type || 'Other'));
    return ['all', ...Array.from(set)];
  }, [incidences]);

  const normalized = (s) => (s || '').toString().toLowerCase();

  const filteredIncidences = useMemo(() => {
    const query = normalized(q);
    return incidences.filter(i => {
      const matchesQuery =
        !query ||
        normalized(i.title).includes(query) ||
        normalized(i.description).includes(query) ||
        normalized(i.reporterName).includes(query);

      const matchesField =
        filterField === 'all' ||
        (i.location || 'Unknown') === filterField;

      const matchesType =
        filterType === 'all' ||
        (i.type || 'Other') === filterType;

      return matchesQuery && matchesField && matchesType;
    });
  }, [incidences, q, filterField, filterType]);

  // ---------- PDF EXPORT (no deps; uses native print -> Save as PDF) ----------

  const printableHTML = (rows) => {
    const escape = (v) => String(v ?? '').replace(/[&<>]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
    const now = new Date().toLocaleString();

    const tableRows = rows.map((r, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${escape(r.title)}</td>
        <td>${escape(r.type || '')}</td>
        <td>${escape(r.severity || '')}</td>
        <td>${escape(r.status || '')}</td>
        <td>${escape(r.location === 'full_estate' ? 'Full Estate' : (r.location || ''))}</td>
        <td>${escape(formatDate(r.date))}</td>
        <td>${escape(r.time || '')}</td>
        <td>${escape(r.reporterName || '')}</td>
      </tr>
    `).join('');

    return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Incidence Reports</title>
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
    @media print {
      @page { size: A4 landscape; margin: 12mm; }
      .noprint { display: none; }
    }
    .count { margin: 8px 0 16px; font-weight: bold; }
  </style>
</head>
<body>
  <h1>Incidence Reports</h1>
  <div class="meta">Generated at: ${escape(now)}</div>
  <div class="filters">
    <div><strong>Search:</strong> ${escape(q || '—')}</div>
    <div><strong>Field:</strong> ${escape(filterField === 'all' ? 'All' : filterField)}</div>
    <div><strong>Incident Type:</strong> ${escape(filterType === 'all' ? 'All' : filterType)}</div>
  </div>
  <div class="count">Total: ${rows.length}</div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Title</th>
        <th>Type</th>
        <th>Severity</th>
        <th>Status</th>
        <th>Field</th>
        <th>Date</th>
        <th>Time</th>
        <th>Reporter</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows || `<tr><td colspan="9" style="text-align:center;color:#666;">No data for current filters</td></tr>`}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="9">Tip: In the print dialog, choose <em>Save as PDF</em>.</td>
      </tr>
    </tfoot>
  </table>
  <div class="noprint" style="margin-top:16px;">
    <button onclick="window.print()">Print / Save as PDF</button>
  </div>
</body>
</html>
    `;
  };

  const exportPDF = () => {
    const html = printableHTML(filteredIncidences);
    const w = window.open('', '_blank', 'noopener,noreferrer');
    if (!w) {
      Swal.fire({
        icon: 'warning',
        title: 'Popup Blocked',
        text: 'Please allow popups for this site to export PDF.',
        confirmButtonColor: '#1d4ed8'
      });
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    // Auto-open print dialog once content is ready
    w.onload = () => {
      try {
        w.focus();
        w.print();
      } catch (_) {}
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-base-content">Incidence Reports</h1>
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
            Incidence submitted successfully!
          </div>
        )}
        
        {deleteSuccess && (
          <div className="mb-6 p-4 bg-success/20 text-success-content rounded-lg flex items-center justify-center text-lg font-semibold">
            Incidence report deleted successfully!
          </div>
        )}

        {infoMessage && (
          <div className="mb-6 p-4 bg-info/20 text-info-content rounded-lg flex items-center justify-center">
            <Info className="w-5 h-5 mr-2" />
            {infoMessage}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-base-content flex items-center">
              <AlertTriangle className="mr-2 h-7 w-7" />
              Incidence Reports
            </h1>
            <p className="text-base-content/70 mt-1">
              Manage and track all field incidents and reports
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchIncidences}
              className="flex items-center px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </button>
            <button
              onClick={handleAddNew}
              className="flex items-center px-4 py-2 bg-primary text-primary-content rounded-lg hover:bg-primary-focus transition-colors"
            >
              <Plus className="w-4 h-4 mr-1" />
              New Report
            </button>
            <button
              onClick={exportPDF}
              disabled={filteredIncidences.length === 0}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${filteredIncidences.length === 0 ? 'bg-base-300 text-base-content/40 cursor-not-allowed' : 'bg-base-100 border border-base-300 hover:bg-base-200'}`}
              title={filteredIncidences.length === 0 ? 'No data to export' : 'Export current view to PDF'}
            >
              <Download className="w-4 h-4 mr-1" />
              Export PDF
            </button>
          </div>
        </div>

        {/* NEW: Search + Filters */}
        <div className="bg-base-100 border border-base-300 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/60" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search title, description, reporter..."
                className="input input-bordered w-full pl-9"
              />
            </div>

            <div>
              <select
                value={filterField}
                onChange={(e) => setFilterField(e.target.value)}
                className="select select-bordered w-full"
              >
                {uniqueFields.map((f) => (
                  <option key={f} value={f}>
                    {f === 'all' ? 'All Fields' : (f === 'full_estate' ? 'Full Estate' : f)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="select select-bordered w-full"
              >
                {uniqueTypes.map((t) => (
                  <option key={t} value={t}>
                    {t === 'all' ? 'All Incident Types' : t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3 text-sm text-base-content/60">
            Showing <span className="font-semibold text-base-content">{filteredIncidences.length}</span> of {incidences.length} reports
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-error/20 text-error-content rounded-lg border border-error/30">
            {error}
          </div>
        )}

        {/* Incidences Grid */}
        {incidences.length === 0 ? (
          <div className="bg-base-100 rounded-xl shadow p-8 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-base-content/40 mb-4" />
            <h3 className="text-lg font-medium text-base-content mb-2">No incidence reports yet</h3>
            <p className="text-base-content/60 mb-4">
              Get started by creating your first incidence report.
            </p>
            <button
              onClick={handleAddNew}
              className="px-4 py-2 bg-primary text-primary-content rounded-lg hover:bg-primary-focus"
            >
              Create Report
            </button>
          </div>
        ) : filteredIncidences.length === 0 ? (
          <div className="bg-base-100 rounded-xl shadow p-8 text-center">
            <Search className="mx-auto h-12 w-12 text-base-content/40 mb-4" />
            <h3 className="text-lg font-medium text-base-content mb-2">No results</h3>
            <p className="text-base-content/60">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIncidences.map((incidence) => {
              const canEdit = canEditIncidence(incidence);
              const canDelete = canDeleteIncidence(incidence);
              
              return (
                <div 
                  key={incidence._id} 
                  className="bg-base-100 rounded-xl shadow-md border border-base-300 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={(e) => handleViewDetails(incidence._id, e)}
                >
                  {/* Card Header */}
                  <div className="p-5 border-b border-base-300">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center">
                        <span className="text-2xl mr-2">{typeIcons[incidence.type] || '⚠️'}</span>
                        <h3 className="font-semibold text-base-content line-clamp-1">
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
                      <div className="flex items-center text-sm text-base-content/70">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>{incidence.location === 'full_estate' ? 'Full Estate' : incidence.location}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-base-content/70">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>{formatDate(incidence.date)}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-base-content/70">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>{incidence.time}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-base-content/70">
                        <User className="w-4 h-4 mr-2" />
                        <span>By: {incidence.reporterName}</span>
                      </div>

                      <div className="pt-2">
                        <p className="text-sm text-base-content/70 line-clamp-2">
                          {incidence.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="p-5 border-t border-base-300 flex justify-between items-center">
                    <span className="text-xs text-base-content/50">
                      {new Date(incidence.createdAt).toLocaleDateString()}
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => handleViewDetails(incidence._id, e)}
                        className="p-2 text-info hover:bg-info/10 rounded-lg transition-colors"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleEdit(incidence._id, incidence.status, e)}
                        disabled={!canEdit}
                        className={`p-2 ${canEdit ? 'text-warning hover:bg-warning/10' : 'text-base-content/30'} rounded-lg transition-colors`}
                        title={canEdit ? "Edit report" : incidence.status === 'Resolved' ? "Resolved reports cannot be edited" : "Only the reporter can edit"}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(incidence._id, incidence.status, e)}
                        disabled={deletingId === incidence._id || !canDelete}
                        className={`p-2 ${canDelete ? 'text-error hover:bg-error/10' : 'text-base-content/30'} rounded-lg transition-colors relative`}
                        title={canDelete ? "Delete report" : "Only resolved reports by the reporter can be deleted"}
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default IncidencePage;
