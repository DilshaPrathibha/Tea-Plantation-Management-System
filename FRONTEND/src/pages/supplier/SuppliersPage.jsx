import React, { useState, useEffect, useCallback } from 'react';
import { Download, Printer, Plus, Edit, Trash2, Package, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Sweet, Toast } from '../../utils/sweet';
import { useNavigate } from 'react-router-dom';
import { listSuppliers, deleteSupplier as deleteSupplierApi, suspendSupplier as suspendSupplierApi, activateSupplier as activateSupplierApi } from '../../api/suppliers';
import { useTheme } from '../../context/ThemeContext';

const CEYLONLEAF_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
     fill="none" stroke="#22C55E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
  <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
</svg>
`;

const svgToPngDataUrl = (svgMarkup, targetPx = 28) =>
  new Promise((resolve, reject) => {
    const img = new window.Image();
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

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const { theme } = useTheme();
  const isLightTheme = theme === 'tea-light';
  
  // Summary metrics
  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter(s => s.status === 'active').length;
  const pendingSuppliers = suppliers.filter(s => s.status === 'pending').length;
  const suspendedSuppliers = suppliers.filter(s => s.status === 'suspended').length;
  const uniqueTypes = Array.from(new Set(suppliers.map(s => s.type))).length;
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.q = search;
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await listSuppliers(params);
      setSuppliers(res.data);
    } catch (err) {
      console.error('Failed to load suppliers', err);
      Toast.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, statusFilter]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleDelete = async (supplier) => {
    const ok = await Sweet.confirm('Are you sure you want to delete this supplier? This action cannot be undone.');
    if (!ok) return;
    setActionLoading(true);
    try {
      await deleteSupplierApi(supplier._id);
      Toast.success('Supplier deleted successfully');
      fetchSuppliers();
    } catch (err) {
      Toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async (id) => {
    setActionLoading(true);
    try {
      await suspendSupplierApi(id);
      Toast.success('Supplier suspended');
      fetchSuppliers();
    } catch (err) {
      Toast.error(err.response?.data?.message || 'Suspend failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivate = async (id) => {
    setActionLoading(true);
    try {
      await activateSupplierApi(id);
      Toast.success('Supplier activated');
      fetchSuppliers();
    } catch (err) {
      Toast.error(err.response?.data?.message || 'Activate failed');
    } finally {
      setActionLoading(false);
    }
  };

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

      // Header: Logo + "CeylonLeaf" + date/time
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
      doc.text('CeylonLeaf', left + logoW + 8, brandBaselineY);
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

      // Summary metrics
      const summaryRows = [
        [
          { content: `Total Suppliers:`, styles: { textColor: [30, 41, 59], fontStyle: 'bold' } },
          { content: `Active:`, styles: { textColor: [34, 197, 94], fontStyle: 'bold' } },
          { content: `Pending:`, styles: { textColor: [202, 138, 4], fontStyle: 'bold' } },
          { content: `Suspended:`, styles: { textColor: [107, 114, 128], fontStyle: 'bold' } },
          { content: `Types:`, styles: { textColor: [0, 0, 0], fontStyle: 'bold' } }
        ],
        [
          { content: `${totalSuppliers}`, styles: { textColor: [0, 0, 0], fontStyle: 'bold' } },
          { content: `${activeSuppliers}`, styles: { textColor: [34, 197, 94], fontStyle: 'bold' } },
          { content: `${pendingSuppliers}`, styles: { textColor: [202, 138, 4], fontStyle: 'bold' } },
          { content: `${suspendedSuppliers}`, styles: { textColor: [107, 114, 128], fontStyle: 'bold' } },
          { content: `${uniqueTypes}`, styles: { textColor: [0, 0, 0], fontStyle: 'bold' } }
        ]
      ];
      autoTable(doc, {
        body: summaryRows,
        startY: titleY + 12,
        theme: 'plain',
        styles: { fontSize: 11, fontStyle: 'bold', cellPadding: { top: 1, bottom: 1, left: 2, right: 2 } },
        margin: { left: 40, right: 40 },
        didDrawCell: function (data) {
          data.cell.height = 16;
        }
      });

      // Table
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
            const raw = String(data.cell.raw || '').toLowerCase();
            if (raw === 'suspended') {
              data.cell.styles.textColor = [107, 114, 128];
              data.cell.styles.fontStyle = 'bold';
            } else if (raw === 'pending') {
              data.cell.styles.textColor = [202, 138, 4];
              data.cell.styles.fontStyle = 'bold';
            } else if (raw === 'active') {
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
              <option value="">All Types</option>
              <option value="fertilizer">Fertilizer</option>
              <option value="insecticide">Insecticide</option>
              <option value="tools">Tools</option>
              <option value="equipment">Equipment</option>
              <option value="other">Other</option>
            </select>
            <select className="select select-bordered w-full sm:w-40" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
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
            <button className="btn btn-primary btn-sm sm:btn-md w-full sm:w-auto sm:ml-auto" onClick={() => navigate('/inventory/suppliers/create')}>
              <span className="sm:hidden">+ Supplier</span>
              <span className="hidden sm:inline">+ New Supplier</span>
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
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-1 sm:gap-2">
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
              <div className={`p-1.5 rounded-full flex-shrink-0 ${isLightTheme ? 'bg-emerald-100 text-emerald-600' : 'bg-green-500/20 text-green-300'}`}>
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
            
            <div className={`rounded-md p-2 flex items-center gap-2 border hover:shadow-md transition-all duration-200 ${isLightTheme ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-gradient-to-r from-slate-700/30 to-slate-900/40 border-slate-600/30 text-slate-200'}`}>
              <div className={`p-1.5 rounded-full flex-shrink-0 ${isLightTheme ? 'bg-slate-200 text-slate-600' : 'bg-slate-500/30 text-slate-200'}`}>
                <AlertTriangle className="w-3 h-3" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-base-content/70 font-medium truncate">Suspended</div>
                <div className={`font-bold text-base sm:text-lg ${isLightTheme ? 'text-slate-700' : 'text-slate-200'}`}>{suspendedSuppliers}</div>
              </div>
            </div>

            <div className={`rounded-md p-2 flex items-center gap-2 border hover:shadow-md transition-all duration-200 ${isLightTheme ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-gradient-to-r from-purple-800/20 to-purple-900/30 border-purple-700/30 text-purple-300'}`}>
              <div className={`p-1.5 rounded-full flex-shrink-0 ${isLightTheme ? 'bg-purple-100 text-purple-600' : 'bg-purple-500/20 text-purple-200'}`}>
                <Package className="w-3 h-3" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-base-content/70 font-medium truncate">Unique Types</div>
                <div className={`font-bold text-base sm:text-lg ${isLightTheme ? 'text-purple-700' : 'text-purple-200'}`}>{uniqueTypes}</div>
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
            No suppliers match your current filters. Try adjusting the search or filters.
          </div>
        ) : (
          <>
            {/* Mobile view - Cards */}
            <div className="md:hidden space-y-3">
              {suppliers.map(supplier => (
                <div key={supplier._id} className="bg-base-100 rounded-lg shadow p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-sm">{supplier.name}</h3>
                      <p className="text-xs text-base-content/60">{supplier.supplierId}</p>
                    </div>
                    <div className="text-right">
                      {supplier.status === 'active' && <span className="badge badge-success badge-sm">Active</span>}
                      {supplier.status === 'pending' && <span className="badge badge-warning badge-sm">Pending</span>}
                      {supplier.status === 'suspended' && <span className="badge badge-sm bg-slate-500 text-white border-slate-500">Suspended</span>}
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
                    {supplier.email && (
                      <div className="col-span-2">
                        <span className="text-base-content/60">Email:</span>
                        <br />
                        <span>{supplier.email}</span>
                      </div>
                    )}
                    {supplier.contactPerson && (
                      <div className="col-span-2">
                        <span className="text-base-content/60">Contact Person:</span>
                        <br />
                        <span>{supplier.contactPerson}</span>
                      </div>
                    )}
                  </div>
                  
                  {supplier.notes && (
                    <div className="text-xs mb-3">
                      <span className="text-base-content/60">Notes:</span>
                      <br />
                      <span className="text-base-content/80">{supplier.notes}</span>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2">
                    {supplier.status === 'suspended' ? (
                      <button
                        className="btn btn-xs btn-success flex-1 min-w-0"
                        onClick={() => handleActivate(supplier._id)}
                        disabled={actionLoading}
                      >
                        <CheckCircle size={10}/> Activate
                      </button>
                    ) : (
                      <button
                        className="btn btn-xs bg-slate-600 hover:bg-slate-700 text-white border-slate-600 flex-1 min-w-0"
                        onClick={() => handleSuspend(supplier._id)}
                        disabled={actionLoading}
                      >
                        <AlertTriangle size={10}/> Suspend
                      </button>
                    )}
                    <button 
                      className="btn btn-xs btn-warning flex-1 min-w-0" 
                      onClick={() => navigate(`/inventory/suppliers/${supplier._id}/edit`)}
                    >
                      <Edit size={10}/> Edit
                    </button>
                    <button 
                      className="btn btn-xs btn-error flex-1 min-w-0" 
                      onClick={() => handleDelete(supplier)}
                      disabled={actionLoading}
                    >
                      <Trash2 size={10}/> Delete
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
                    <th>Email</th>
                    <th>Contact Person</th>
                    <th>Status</th>
                    <th className="w-48">Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map(supplier => (
                    <tr key={supplier._id}>
                      <td>{supplier.supplierId}</td>
                      <td className="font-semibold">{supplier.name}</td>
                      <td className="capitalize">{supplier.type}</td>
                      <td>{supplier.contactNumber}</td>
                      <td>{supplier.email || <span className="text-base-content/50">-</span>}</td>
                      <td>{supplier.contactPerson || <span className="text-base-content/50">-</span>}</td>
                      <td>
                        {supplier.status === 'active' && <span className="badge badge-success gap-1">Active</span>}
                        {supplier.status === 'pending' && <span className="badge badge-warning gap-1">Pending</span>}
                        {supplier.status === 'suspended' && <span className="badge badge-sm bg-slate-500 text-white border-slate-500 gap-1">Suspended</span>}
                      </td>
                      <td>{supplier.notes || <span className="text-base-content/50">-</span>}</td>
                      <td>
                        <div className="flex items-center gap-1">
                          <div className="w-24 flex-shrink-0">
                            {supplier.status === 'suspended' ? (
                              <button
                                className="btn btn-sm btn-success w-full text-xs"
                                onClick={() => handleActivate(supplier._id)}
                                disabled={actionLoading}
                              >
                                <CheckCircle size={12}/> Activate
                              </button>
                            ) : (
                              <button
                                className="btn btn-sm bg-slate-600 hover:bg-slate-700 text-white border-slate-600 w-full text-xs"
                                onClick={() => handleSuspend(supplier._id)}
                                disabled={actionLoading}
                              >
                                <AlertTriangle size={12}/> Suspend
                              </button>
                            )}
                          </div>
                          <button 
                            className="btn btn-sm btn-warning flex-shrink-0 text-xs" 
                            onClick={() => navigate(`/inventory/suppliers/${supplier._id}/edit`)}
                          >
                            <Edit size={12}/> Edit
                          </button>
                          <button 
                            className="btn btn-sm btn-error flex-shrink-0 text-xs" 
                            onClick={() => handleDelete(supplier)}
                            disabled={actionLoading}
                          >
                            <Trash2 size={12}/> Delete
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
      </div>
    </div>
  );
}
