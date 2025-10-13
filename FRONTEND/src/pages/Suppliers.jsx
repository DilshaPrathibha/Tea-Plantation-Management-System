import React, { useState, useEffect, useCallback } from 'react';
import { Download, Printer, Plus, Edit, Trash2, Users, CheckCircle, Clock, AlertTriangle, Package } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Sweet, Toast } from '../utils/sweet';
import axios from 'axios';
import { API_URL } from '../config/api.js';
import { useTheme } from '../context/ThemeContext';

const api = axios.create({
  baseURL: API_URL,
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// === helpers: inline SVG -> PNG dataURL (so jsPDF can embed it) ===
const CEYLONLEAF_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
     fill="none" stroke="#22C55E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
  <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
</svg>
`;

// Convert the inline SVG to a PNG data URL using an offscreen canvas
const svgToPngDataUrl = (svgMarkup, targetPx = 28) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      const scale = targetPx / (img.width || 28);
      const w = Math.max(1, Math.round((img.width || 28) * scale));
      const h = Math.max(1, Math.round((img.height || 28) * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      try {
        resolve(canvas.toDataURL('image/png'));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = reject;
    const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgMarkup);
    img.src = svgDataUrl;
  });

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  
  // Summary metrics
  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter(s => s.status === 'active').length;
  const pendingSuppliers = suppliers.filter(s => s.status === 'pending').length;
  const suspendedSuppliers = suppliers.filter(s => s.status === 'suspended').length;
  const uniqueTypes = Array.from(new Set(suppliers.map(s => s.type))).length;
  
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [addModal, setAddModal] = useState({ open: false });
  const [editModal, setEditModal] = useState({ open: false, supplier: null });
  const { theme } = useTheme();
  const isLightTheme = theme === 'tea-light';
  
  // Form data for add/edit modals
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    contactNumber: '',
    email: '',
    address: '',
    status: 'active',
    notes: '',
    contactPerson: '',
    emergencyContact: ''
  });

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.q = search;
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.status = statusFilter;
      const response = await api.get('/suppliers', { params });
      setSuppliers(response.data);
    } catch (error) {
      console.error('Failed to fetch suppliers', error);
      Toast.error('Could not load suppliers.');
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, statusFilter]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  // Export CSV
  const exportCSV = () => {
    const rows = [
      ['Supplier ID', 'Name', 'Type', 'Contact', 'Email', 'Status', 'Notes'],
      ...suppliers.map(s => [
        s.supplierId,
        s.name,
        s.type,
        s.contactNumber,
        s.email || '',
        s.status,
        s.notes || ''
      ])
    ];
    const csv = rows.map(r => r.map(x => `"${String(x ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'suppliers.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export PDF
  const exportPDF = async () => {
    const win = window.open('', '_blank');
    try {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const left = 40;
      const right = pageWidth - 40;

      // --- Header: Logo + "CeylonLeaf" on left, date/time on right ---
      const logoPng = await svgToPngDataUrl(CEYLONLEAF_SVG, 18);
      const logoW = 20;
      const logoH = 20;
      const headerTop = 48;
      const brandBaselineY = headerTop;

      doc.addImage(
        logoPng,
        'PNG',
        left,
        brandBaselineY - logoH * 0.75,
        logoW,
        logoH
      );

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(34, 197, 94);
      const brandText = 'CeylonLeaf';
      doc.text(brandText, left + logoW + 8, brandBaselineY);

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      const dateStr = `Generated on ${new Date().toLocaleString()}`;
      const dateWidth = doc.getTextWidth(dateStr);
      doc.text(dateStr, right - dateWidth, brandBaselineY - 8);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      const reportTitle = 'Suppliers Report';
      const titleWidth = doc.getTextWidth(reportTitle);
      const titleY = headerTop + 20;
      doc.text(reportTitle, (pageWidth - titleWidth) / 2, titleY);

      // Summary table
      autoTable(doc, {
        body: [[
          { content: `Total Suppliers: ${totalSuppliers}`, styles: { textColor: [30, 41, 59] } },
          { content: `Active: ${activeSuppliers}`, styles: { textColor: [34, 197, 94] } },
          { content: `Pending: ${pendingSuppliers}`, styles: { textColor: [202, 138, 4] } },
          { content: `Suspended: ${suspendedSuppliers}`, styles: { textColor: [220, 38, 38] } },
          { content: `Types: ${uniqueTypes}`, styles: { textColor: [30, 41, 59] } }
        ]],
        startY: titleY + 12,
        theme: 'plain',
        styles: { fontSize: 11, fontStyle: 'bold' },
        margin: { left: 40, right: 40 },
      });

      // Main data table
      const body = (Array.isArray(suppliers) ? suppliers : []).map(s => [
        s.supplierId || '-',
        s.name || '',
        s.type || '',
        s.contactNumber || '',
        s.email || '',
        s.status || '',
        s.notes || ''
      ]);
      if (body.length === 0) body.push(['-', '-', '-', '-', '-', '-', '-']);

      autoTable(doc, {
        head: [['Supplier ID', 'Name', 'Type', 'Contact', 'Email', 'Status', 'Notes']],
        body,
        startY: doc.lastAutoTable.finalY + 10,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [34, 197, 94], textColor: [0, 0, 0] },
        alternateRowStyles: { fillColor: [240, 253, 244] },
        margin: { left: 40, right: 40 },
        didParseCell: function (data) {
          // Status column styling
          if (data.section === 'body' && data.column.index === 5) {
            if (data.cell.raw === 'suspended') {
              data.cell.styles.textColor = [220, 38, 38];
              data.cell.styles.fontStyle = 'bold';
            } else if (data.cell.raw === 'pending') {
              data.cell.styles.textColor = [202, 138, 4];
              data.cell.styles.fontStyle = 'bold';
            } else if (data.cell.raw === 'active') {
              data.cell.styles.textColor = [34, 197, 94];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        }
      });

      const url = doc.output('bloburl');
      if (win) win.location.href = url;
      else window.open(url, '_blank');
    } catch (e) {
      console.error(e);
      if (win) win.document.body.innerHTML = '<p style="font-family:sans-serif">Failed to generate PDF.</p>';
    }
  };

  const deleteSupplier = async id => {
    const ok = await Sweet.confirm('Are you sure you want to delete this supplier? This action cannot be undone.');
    if (!ok) return;
    setActionLoading(true);
    try {
      await api.delete(`/suppliers/${id}`);
      Toast.success('Supplier deleted successfully');
      fetchSuppliers();
    } catch {
      Toast.error('Delete failed');
    } finally {
      setActionLoading(false);
    }
  };

  const suspendSupplier = async id => {
    setActionLoading(true);
    try {
      await api.post(`/suppliers/${id}/suspend`);
      Toast.success('Supplier suspended');
      fetchSuppliers();
    } catch {
      Toast.error('Suspend failed');
    } finally {
      setActionLoading(false);
    }
  };

  const activateSupplier = async id => {
    setActionLoading(true);
    try {
      await api.post(`/suppliers/${id}/activate`);
      Toast.success('Supplier activated');
      fetchSuppliers();
    } catch {
      Toast.error('Activate failed');
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      contactNumber: '',
      email: '',
      address: '',
      status: 'active',
      notes: '',
      contactPerson: '',
      emergencyContact: ''
    });
  };

  const openAddModal = () => {
    resetForm();
    setAddModal({ open: true });
  };

  const openEditModal = (supplier) => {
    setFormData({
      name: supplier.name || '',
      type: supplier.type || '',
      contactNumber: supplier.contactNumber || '',
      email: supplier.email || '',
      address: supplier.address || '',
      status: supplier.status || 'active',
      notes: supplier.notes || '',
      contactPerson: supplier.contactPerson || '',
      emergencyContact: supplier.emergencyContact || ''
    });
    setEditModal({ open: true, supplier });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSupplier = async () => {
    if (!formData.name || !formData.type || !formData.contactNumber) {
      return Toast.error('Please fill in all required fields');
    }
    setActionLoading(true);
    try {
      await api.post('/suppliers', formData);
      Toast.success('Supplier added successfully');
      setAddModal({ open: false });
      resetForm();
      fetchSuppliers();
    } catch (error) {
      Toast.error(error.response?.data?.message || 'Failed to add supplier');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSupplier = async () => {
    if (!formData.name || !formData.type || !formData.contactNumber) {
      return Toast.error('Please fill in all required fields');
    }
    setActionLoading(true);
    try {
      await api.put(`/suppliers/${editModal.supplier._id}`, formData);
      Toast.success('Supplier updated successfully');
      setEditModal({ open: false, supplier: null });
      resetForm();
      fetchSuppliers();
    } catch (error) {
      Toast.error(error.response?.data?.message || 'Failed to update supplier');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
          {/* Search, filters, and action buttons row */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 sm:items-center">
            <input
              className="input input-bordered w-full sm:w-64"
              placeholder="Search suppliers..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select className="select select-bordered w-full sm:w-40" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="">Supplier Type</option>
              <option value="fertilizer">Fertilizer</option>
              <option value="insecticide">Insecticide</option>
              <option value="tools">Tools</option>
              <option value="equipment">Equipment</option>
              <option value="other">Other</option>
            </select>
            <select className="select select-bordered w-full sm:w-40" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
            
            {/* Export buttons */}
            <button className="btn btn-outline btn-sm sm:btn-md gap-2 flex-1 sm:flex-none" onClick={exportCSV}>
              <Download size={16}/>
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">CSV</span>
            </button>
            <button className="btn btn-outline btn-sm sm:btn-md gap-2 flex-1 sm:flex-none" onClick={exportPDF}>
              <Printer size={16}/>
              <span className="hidden sm:inline">Export PDF</span>
              <span className="sm:hidden">PDF</span>
            </button>
            
            {/* New Supplier button */}
            <button className="btn btn-primary btn-sm sm:btn-md w-full sm:w-auto sm:ml-auto" onClick={openAddModal}>
              <Plus size={16}/>
              <span className="sm:hidden">+ Supplier</span>
              <span className="hidden sm:inline"> New Supplier</span>
            </button>
          </div>
        </div>

        {/* Suppliers Overview Section */}
        <div className={`rounded-lg shadow p-3 sm:p-4 mb-4 ${isLightTheme ? 'bg-white border border-slate-200' : 'bg-base-100 border border-gray-700/30'}`}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-base-content">Suppliers Overview</h2>
              <p className="text-xs text-base-content/70 hidden sm:block">Current suppliers statistics</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1 sm:gap-2">
            <div className={`rounded-md p-2 flex items-center gap-2 border hover:shadow-md transition-all duration-200 ${isLightTheme ? 'bg-white border-slate-200 text-slate-700' : 'bg-gradient-to-r from-slate-800 to-slate-900 border-gray-700/50 text-slate-100'}`}>
              <div className={`p-1.5 rounded-full flex-shrink-0 ${isLightTheme ? 'bg-blue-100 text-blue-600' : 'bg-blue-500/20 text-blue-300'}`}>
                <Package className="w-3 h-3" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-base-content/70 font-medium truncate">Total Suppliers</div>
                <div className={`font-bold text-base sm:text-lg ${isLightTheme ? 'text-slate-900' : 'text-blue-300'}`}>{totalSuppliers}</div>
              </div>
            </div>
            
            <div className={`rounded-md p-2 flex items-center gap-2 border hover:shadow-md transition-all duration-200 ${isLightTheme ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gradient-to-r from-green-800/20 to-green-900/30 border-green-700/30 text-emerald-300'}`}>
              <div className={`p-1.5 rounded-full flex-shrink-0 ${isLightTheme ? 'bg-emerald-100 text-emerald-600' : 'bg-green-500/20 text-green-200'}`}>
                <CheckCircle className="w-3 h-3" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-base-content/70 font-medium truncate">Active</div>
                <div className={`font-bold text-base sm:text-lg ${isLightTheme ? 'text-emerald-700' : 'text-green-200'}`}>{activeSuppliers}</div>
              </div>
            </div>
            
            <div className={`rounded-md p-2 flex items-center gap-2 border hover:shadow-md transition-all duration-200 ${isLightTheme ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-gradient-to-r from-amber-800/20 to-amber-900/30 border-amber-700/30 text-amber-300'}`}>
              <div className={`p-1.5 rounded-full flex-shrink-0 ${isLightTheme ? 'bg-amber-100 text-amber-600' : 'bg-amber-500/20 text-amber-200'}`}>
                <Clock className="w-3 h-3" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-base-content/70 font-medium truncate">Pending</div>
                <div className={`font-bold text-base sm:text-lg ${isLightTheme ? 'text-amber-700' : 'text-amber-200'}`}>{pendingSuppliers}</div>
              </div>
            </div>
            
            <div className={`rounded-md p-2 flex items-center gap-2 border hover:shadow-md transition-all duration-200 ${isLightTheme ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-gradient-to-r from-red-800/20 to-red-900/30 border-red-700/30 text-rose-200'}`}>
              <div className={`p-1.5 rounded-full flex-shrink-0 ${isLightTheme ? 'bg-rose-100 text-rose-600' : 'bg-red-500/20 text-red-200'}`}>
                <AlertTriangle className="w-3 h-3" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-base-content/70 font-medium truncate">Suspended</div>
                <div className={`font-bold text-base sm:text-lg ${isLightTheme ? 'text-rose-700' : 'text-red-200'}`}>{suspendedSuppliers}</div>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : suppliers.length === 0 ? (
          <div className="bg-base-100 border border-base-content/10 rounded-lg p-8 text-center text-base-content/70">
            No suppliers found for these filters. Try searching with different terms.
          </div>
        ) : (
          <>
            {/* Mobile view - Cards */}
            <div className="md:hidden space-y-3">
              {suppliers.map(supplier => (
                <div key={supplier._id} className="bg-base-100 rounded-lg shadow p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-sm">{supplier.supplierId}</h3>
                      <p className="text-xs text-base-content/60">{supplier.name}</p>
                    </div>
                    <div className="text-right">
                      {supplier.status === 'active' && <span className="badge badge-success badge-sm">Active</span>}
                      {supplier.status === 'pending' && <span className="badge badge-warning badge-sm">Pending</span>}
                      {supplier.status === 'suspended' && <span className="badge badge-error badge-sm">Suspended</span>}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div>
                      <span className="text-base-content/60">Type:</span>
                      <br />
                      <span className="capitalize">{supplier.type}</span>
                    </div>
                    <div>
                      <span className="text-base-content/60">Contact:</span>
                      <br />
                      <span>{supplier.contactNumber}</span>
                    </div>
                  </div>
                  
                  {supplier.email && (
                    <div className="text-xs mb-3">
                      <span className="text-base-content/60">Email:</span>
                      <br />
                      <span className="text-base-content/80">{supplier.email}</span>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2">
                    {supplier.status === 'suspended' ? (
                      <button
                        className="btn btn-xs btn-success flex-1 min-w-0"
                        onClick={() => activateSupplier(supplier._id)}
                        disabled={actionLoading}
                      >
                        <CheckCircle size={10}/> Activate
                      </button>
                    ) : (
                      <button
                        className="btn btn-xs btn-warning flex-1 min-w-0"
                        onClick={() => suspendSupplier(supplier._id)}
                        disabled={actionLoading}
                      >
                        <AlertTriangle size={10}/> Suspend
                      </button>
                    )}
                    <button 
                      className="btn btn-xs btn-info flex-1 min-w-0" 
                      onClick={() => openEditModal(supplier)}
                    >
                      <Edit size={10}/> Edit
                    </button>
                    <button 
                      className="btn btn-xs btn-error flex-1 min-w-0" 
                      disabled={actionLoading} 
                      onClick={() => deleteSupplier(supplier._id)}
                    >
                      <Trash2 size={10}/> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop view - Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Supplier ID</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Contact</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map(supplier => (
                    <tr key={supplier._id}>
                      <td>{supplier.supplierId}</td>
                      <td className="font-medium">{supplier.name}</td>
                      <td className="capitalize">{supplier.type}</td>
                      <td>
                        <div>
                          <div>{supplier.contactNumber}</div>
                          {supplier.email && <div className="text-xs text-base-content/60">{supplier.email}</div>}
                        </div>
                      </td>
                      <td>
                        {supplier.status === 'active' && <span className="badge badge-success gap-1">Active</span>}
                        {supplier.status === 'pending' && <span className="badge badge-warning gap-1">Pending</span>}
                        {supplier.status === 'suspended' && <span className="badge badge-error gap-1">Suspended</span>}
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          {supplier.status === 'suspended' ? (
                            <button
                              className="btn btn-sm btn-success text-xs"
                              onClick={() => activateSupplier(supplier._id)}
                              disabled={actionLoading}
                            >
                              <CheckCircle size={12}/> Activate
                            </button>
                          ) : (
                            <button
                              className="btn btn-sm btn-warning text-xs"
                              onClick={() => suspendSupplier(supplier._id)}
                              disabled={actionLoading}
                            >
                              <AlertTriangle size={12}/> Suspend
                            </button>
                          )}
                          <button 
                            className="btn btn-sm btn-info flex-shrink-0 text-xs" 
                            onClick={() => openEditModal(supplier)}
                          >
                            <Edit size={12}/> Edit
                          </button>
                          <button 
                            className="btn btn-sm btn-error flex-shrink-0 text-xs" 
                            disabled={actionLoading} 
                            onClick={() => deleteSupplier(supplier._id)}
                          >
                            <Trash2 size={12}/> Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Add Supplier Modal */}
        {addModal.open && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
            <div className="bg-base-100 rounded-xl shadow-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Add New Supplier</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="label">
                    <span className="label-text">Name *</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="input input-bordered w-full"
                    placeholder="Supplier name"
                  />
                </div>
                
                <div>
                  <label className="label">
                    <span className="label-text">Type *</span>
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="select select-bordered w-full"
                  >
                    <option value="">Select type</option>
                    <option value="fertilizer">Fertilizer</option>
                    <option value="insecticide">Insecticide</option>
                    <option value="tools">Tools</option>
                    <option value="equipment">Equipment</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="label">
                    <span className="label-text">Contact Number *</span>
                  </label>
                  <input
                    type="text"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                    className="input input-bordered w-full"
                    placeholder="Contact number"
                  />
                </div>
                
                <div>
                  <label className="label">
                    <span className="label-text">Email</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="input input-bordered w-full"
                    placeholder="Email address"
                  />
                </div>
                
                <div>
                  <label className="label">
                    <span className="label-text">Status</span>
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="select select-bordered w-full"
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                
                <div>
                  <label className="label">
                    <span className="label-text">Notes</span>
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="textarea textarea-bordered w-full"
                    placeholder="Additional notes"
                    rows={3}
                  ></textarea>
                </div>
              </div>
              
              <div className="flex gap-2 justify-end mt-6">
                <button 
                  className="btn" 
                  onClick={() => setAddModal({ open: false })}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary" 
                  disabled={actionLoading} 
                  onClick={handleAddSupplier}
                >
                  {actionLoading ? 'Adding...' : 'Add Supplier'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Supplier Modal */}
        {editModal.open && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
            <div className="bg-base-100 rounded-xl shadow-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Edit Supplier</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="label">
                    <span className="label-text">Name *</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="input input-bordered w-full"
                    placeholder="Supplier name"
                  />
                </div>
                
                <div>
                  <label className="label">
                    <span className="label-text">Type *</span>
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="select select-bordered w-full"
                  >
                    <option value="">Select type</option>
                    <option value="fertilizer">Fertilizer</option>
                    <option value="insecticide">Insecticide</option>
                    <option value="tools">Tools</option>
                    <option value="equipment">Equipment</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="label">
                    <span className="label-text">Contact Number *</span>
                  </label>
                  <input
                    type="text"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                    className="input input-bordered w-full"
                    placeholder="Contact number"
                  />
                </div>
                
                <div>
                  <label className="label">
                    <span className="label-text">Email</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="input input-bordered w-full"
                    placeholder="Email address"
                  />
                </div>
                
                <div>
                  <label className="label">
                    <span className="label-text">Status</span>
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="select select-bordered w-full"
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                
                <div>
                  <label className="label">
                    <span className="label-text">Notes</span>
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="textarea textarea-bordered w-full"
                    placeholder="Additional notes"
                    rows={3}
                  ></textarea>
                </div>
              </div>
              
              <div className="flex gap-2 justify-end mt-6">
                <button 
                  className="btn" 
                  onClick={() => setEditModal({ open: false, supplier: null })}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary" 
                  disabled={actionLoading} 
                  onClick={handleEditSupplier}
                >
                  {actionLoading ? 'Updating...' : 'Update Supplier'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Suppliers;



