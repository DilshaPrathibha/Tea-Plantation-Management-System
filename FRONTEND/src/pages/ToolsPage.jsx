import React, { useState, useEffect } from 'react';
import { Download, Printer, UserPlus, UserMinus, Edit3, Trash2, Wrench, CheckCircle, Clock, AlertTriangle, Package } from 'lucide-react';
import { jsPDF } from 'jspdf';            
import autoTable from 'jspdf-autotable';
import { Sweet, Toast } from '../utils/sweet';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config/api.js';

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

const ToolsPage = () => {
  const [tools, setTools] = useState([]);
  const [allTools, setAllTools] = useState([]); // For retired tools statistics only
  // Summary metrics (filtered tools for most stats, allTools only for retired count)
  const totalTools = tools.length;
  const availableTools = tools.filter(t => t.status === 'available').length;
  const assignedTools = tools.filter(t => t.status === 'assigned').length;
  const needsRepairTools = tools.filter(t => String(t.condition).toLowerCase() === 'needs_repair').length;
  const retiredTools = allTools.filter(t => String(t.condition).toLowerCase() === 'retired').length;
  const uniqueTypes = Array.from(new Set(tools.map(t => t.toolType))).length;
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [workers, setWorkers] = useState([]);
  const [assignModal, setAssignModal] = useState({ open: false, tool: null });
  const [assignWorkerId, setAssignWorkerId] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [noteModal, setNoteModal] = useState({ open: false, note: '' });
  const navigate = useNavigate();

  const fetchTools = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.q = search;
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.status = statusFilter;
      const response = await api.get('/tools', { params });
      setTools(response.data);
    } catch (error) {
      console.error('Failed to fetch tools', error);
      Toast.error('Could not load tools.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTools = async () => {
    try {
      // Fetch both active and retired tools separately and combine them
      const [activeResponse, retiredResponse] = await Promise.all([
        api.get('/tools'),
        api.get('/tools', { params: { status: 'retired' } })
      ]);
      setAllTools([...activeResponse.data, ...retiredResponse.data]);
    } catch (error) {
      console.error('Failed to fetch all tools for statistics', error);
      // Fallback: use current tools data for statistics
      setAllTools([]);
    }
  };

  const fetchWorkers = async () => {
    try {
      const res = await api.get('/admin/workers');
      setWorkers(res.data);
    } catch (error) {
      console.error('Workers fetch error:', error.response || error);
      if (error.response?.status === 401) {
        Toast.error('Authentication failed. Please login again.');
      } else if (error.response?.status === 403) {
        Toast.error('Access denied. Insufficient permissions.');
      } else {
        Toast.error('Could not load workers: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  useEffect(() => {
    fetchTools();
  }, [search, typeFilter, statusFilter]);

  useEffect(() => {
    fetchAllTools();
  }, []);

  // Export CSV
  const exportCSV = () => {
    const rows = [
      ['Tool ID', 'Type', 'Assigned To', 'Condition', 'Status', 'Notes'],
      ...tools.map(t => [
        t.toolId,
        t.toolType,
        t.assignedTo?.name || '',
        t.condition,
        t.status,
        t.note
      ])
    ];
    const csv = rows.map(r => r.map(x => `"${String(x ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tools.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export PDF (with logo + brand wordmark)
  const exportPDF = async () => {
    const win = window.open('', '_blank');
    try {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const left = 40;
      const right = pageWidth - 40;

      // --- Header: Logo + "CeylonLeaf" on left, date/time on right ---
      // Align the logo to the same baseline as the brand text
      const logoPng = await svgToPngDataUrl(CEYLONLEAF_SVG, 18); // 18pt for better baseline alignment
      const logoW = 20; // pts
      const logoH = 20; // pts
      const headerTop = 48; // baseline for brand text
      const brandBaselineY = headerTop;

      // Draw logo so its vertical center aligns with the text baseline
      doc.addImage(
        logoPng,
        'PNG',
        left,
        brandBaselineY - logoH * 0.75, // tweak to visually center with text
        logoW,
        logoH
      );

      // Brand text next to logo
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(34, 197, 94); // #22C55E
      const brandText = 'CeylonLeaf';
      doc.text(brandText, left + logoW + 8, brandBaselineY);

      // Reset text color for the rest
      doc.setTextColor(0, 0, 0);

      // Date/time on the right
      doc.setFontSize(10);
      const dateStr = `Generated on ${new Date().toLocaleString()}`;
      const dateWidth = doc.getTextWidth(dateStr);
      doc.text(dateStr, right - dateWidth, brandBaselineY - 8);

      // Report Title centered under header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      const reportTitle = 'Tool Inventory Report';
      const titleWidth = doc.getTextWidth(reportTitle);
      const titleY = headerTop + 20;
      doc.text(reportTitle, (pageWidth - titleWidth) / 2, titleY);

      // Render summary as a table below the title, with custom colors
      autoTable(doc, {
        body: [[
          { content: `Total Tools: ${totalTools}`, styles: { textColor: [30, 41, 59] } },
          { content: `Available: ${availableTools}`, styles: { textColor: [34, 197, 94] } }, // green
          { content: `Assigned: ${assignedTools}`, styles: { textColor: [202, 138, 4] } }, // yellow
          { content: `Needs Repair: ${needsRepairTools}`, styles: { textColor: [220, 38, 38] } }, // red
          { content: `Tool Types: ${uniqueTypes}`, styles: { textColor: [30, 41, 59] } }
        ]],
        startY: titleY + 12,
        theme: 'plain',
        styles: { fontSize: 11, fontStyle: 'bold' },
        margin: { left: 40, right: 40 },
      });

      // Table
      const body = (Array.isArray(tools) ? tools : []).map(t => [
        t.toolId || '-',
        t.toolType || '',
        t.assignedTo?.name || 'Unassigned',
        t.condition === 'needs_repair' ? 'needs repair' : (t.condition || ''),
        t.status || '',
        t.note || ''
      ]);
      if (body.length === 0) body.push(['-', '-', '-', '-', '-', '-']);

      autoTable(doc, {
        head: [['Tool ID', 'Type', 'Assigned To', 'Condition', 'Status', 'Notes']],
        body,
        startY: doc.lastAutoTable.finalY + 10,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [34, 197, 94], textColor: [0, 0, 0] },
        alternateRowStyles: { fillColor: [240, 253, 244] },
        margin: { left: 40, right: 40 },
        columnStyles: {
          3: { minCellWidth:  70} //min width for Condition'
        },
        didParseCell: function (data) {
          // Condition column index is 3
          if (data.section === 'body' && data.column.index === 3) {
            if (data.cell.raw === 'needs repair') {
              data.cell.styles.textColor = [220, 38, 38]; // Tailwind red-600
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

  const deleteTool = async id => {
    const ok = await Sweet.confirm('Are you sure you want to retire this tool? This action will mark it as permanently out of service but keep it in records.');
    if (!ok) return;
    setActionLoading(true);
    try {
      await api.delete(`/tools/${id}`);
      Toast.success('Tool retired successfully');
      fetchTools();
    } catch {
      Toast.error('Retire failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Assign tool
  const openAssignModal = tool => {
    setAssignModal({ open: true, tool });
    setAssignWorkerId('');
    fetchWorkers();
  };
  const assignTool = async () => {
    if (!assignWorkerId) return Toast.error('Select a worker');
    setActionLoading(true);
    try {
      await api.post(`/tools/${assignModal.tool._id}/assign`, { workerId: assignWorkerId });
      Toast.success('Tool assigned');
      setAssignModal({ open: false, tool: null });
      fetchTools();
    } catch {
      Toast.error('Assign failed');
    } finally {
      setActionLoading(false);
    }
  };
  const unassignTool = async tool => {
    setActionLoading(true);
    try {
      await api.post(`/tools/${tool._id}/unassign`);
      Toast.success('Tool unassigned');
      fetchTools();
    } catch {
      Toast.error('Unassign failed');
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
              placeholder="Search tools..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select className="select select-bordered w-full sm:w-40" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="">All Types</option>
              <option value="knife">Knife</option>
              <option value="sprayer">Sprayer</option>
              <option value="hoe">Hoe</option>
              <option value="other">Other</option>
            </select>
            <select className="select select-bordered w-full sm:w-40" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="available">Available</option>
              <option value="assigned">Assigned</option>
              <option value="needs_repair">Needs Repair</option>
              <option value="retired">Retired</option>
            </select>
            
            {/* Export buttons right after filters */}
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
            
            {/* New Tool button stays on the right */}
            <button className="btn btn-primary btn-sm sm:btn-md w-full sm:w-auto sm:ml-auto" onClick={() => navigate('/inventory/tools/create')}>
              <span className="sm:hidden">+ Tool</span>
              <span className="hidden sm:inline">+ New Tool</span>
            </button>
          </div>
        </div>

        {/* Tools Summary Section */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4 bg-base-100 rounded-lg shadow p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="text-center p-2 sm:p-0">
            <div className="flex items-center justify-center gap-1 mb-2">
              <Package className="w-4 h-4 text-base-content/60" />
              <div className="text-xs text-base-content/60">Total Tools</div>
            </div>
            <div className="font-bold text-base sm:text-lg">{totalTools}</div>
          </div>
          <div className="text-center p-2 sm:p-0">
            <div className="flex items-center justify-center gap-1 mb-2">
              <CheckCircle className="w-4 h-4 text-success" />
              <div className="text-xs text-base-content/60">Available</div>
            </div>
            <div className="font-bold text-base sm:text-lg text-success">{availableTools}</div>
          </div>
          <div className="text-center p-2 sm:p-0">
            <div className="flex items-center justify-center gap-1 mb-2">
              <Clock className="w-4 h-4 text-warning" />
              <div className="text-xs text-base-content/60">Assigned</div>
            </div>
            <div className="font-bold text-base sm:text-lg text-warning">{assignedTools}</div>
          </div>
          <div className="text-center p-2 sm:p-0">
            <div className="flex items-center justify-center gap-1 mb-2">
              <AlertTriangle className="w-4 h-4 text-error" />
              <div className="text-xs text-base-content/60">Needs Repair</div>
            </div>
            <div className="font-bold text-base sm:text-lg text-error">{needsRepairTools}</div>
          </div>
          <div className="text-center p-2 sm:p-0 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-center gap-1 mb-2">
              <Trash2 className="w-4 h-4 text-base-content/60" />
              <div className="text-xs text-base-content/60">Retired</div>
            </div>
            <div className="font-bold text-base sm:text-lg">{retiredTools}</div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Mobile view - Cards */}
            <div className="md:hidden space-y-3">
              {tools.map(tool => (
                <div key={tool._id} className="bg-base-100 rounded-lg shadow p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-sm">{tool.toolId}</h3>
                      <p className="text-xs text-base-content/60 capitalize">{tool.toolType}</p>
                    </div>
                    <div className="text-right">
                      {tool.status === 'available' && <span className="badge badge-success badge-sm">Available</span>}
                      {tool.status === 'assigned' && <span className="badge badge-warning badge-sm">Assigned</span>}
                      {tool.status === 'needs_repair' && <span className="badge badge-error badge-sm">Needs Repair</span>}
                      {tool.status === 'retired' && <span className="badge badge-neutral badge-sm">Retired</span>}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div>
                      <span className="text-base-content/60">Assigned to:</span>
                      <br />
                      <span className={tool.assignedTo ? "" : "text-base-content/50"}>
                        {tool.assignedTo ? tool.assignedTo.name : "Unassigned"}
                      </span>
                    </div>
                    <div>
                      <span className="text-base-content/60">Condition:</span>
                      <br />
                      <span className="capitalize">{tool.condition}</span>
                    </div>
                  </div>
                  
                  {tool.note && (
                    <div className="text-xs mb-3">
                      <span className="text-base-content/60">Notes:</span>
                      <br />
                      <span className="text-base-content/80">{tool.note}</span>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const isAssigned = !!tool.assignedTo;
                      const isRepair = String(tool.condition).toLowerCase() === 'needs_repair';
                      const isRetired = String(tool.condition).toLowerCase() === 'retired';
                      
                      if (isRetired) {
                        return (
                          <button className="btn btn-xs btn-disabled flex-1 min-w-0" disabled>
                            <span className="text-xs">Retired</span>
                          </button>
                        );
                      } else if (!isAssigned) {
                        return (
                          <button
                            className={`btn btn-xs btn-success flex-1 min-w-0 ${isRepair ? 'btn-disabled opacity-50 cursor-not-allowed' : ''}`}
                            disabled={isRepair}
                            title={isRepair ? 'Disabled: tool needs repair' : 'Assign this tool'}
                            onClick={() => {
                              if (isRepair) return;
                              openAssignModal(tool);
                            }}
                          >
                            <UserPlus size={10}/> Assign
                          </button>
                        );
                      } else {
                        return (
                          <button
                            className="btn btn-xs btn-outline btn-success flex-1 min-w-0"
                            title="Unassign from worker"
                            onClick={() => unassignTool(tool)}
                          >
                            <UserMinus size={10}/> Unassign
                          </button>
                        );
                      }
                    })()}
                    <button 
                      className="btn btn-xs btn-warning flex-1 min-w-0" 
                      onClick={() => navigate(`/tools/${tool._id}`)}
                    >
                      <Edit3 size={10}/> Edit
                    </button>
                    {String(tool.condition).toLowerCase() !== 'retired' && (
                      <button 
                        className="btn btn-xs btn-error flex-1 min-w-0" 
                        disabled={actionLoading} 
                        onClick={() => deleteTool(tool._id)}
                      >
                        <Trash2 size={10}/> Retire
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop view - Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Tool ID</th>
                    <th>Type</th>
                    <th>Assigned To</th>
                    <th>Condition</th>
                    <th>Status</th>
                    <th className="w-48">Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tools.map(tool => (
                    <tr key={tool._id}>
                      <td>{tool.toolId}</td>
                      <td className="capitalize">{tool.toolType}</td>
                      <td>{tool.assignedTo ? `${tool.assignedTo.name}` : <span className="text-base-content/50">Unassigned</span>}</td>
                      <td className="capitalize">{tool.condition}</td>
                      <td>
                        {tool.status === 'available' && <span className="badge badge-success gap-1">Available</span>}
                        {tool.status === 'assigned' && <span className="badge badge-warning gap-1">Assigned</span>}
                        {tool.status === 'needs_repair' && <span className="badge badge-error gap-1">Needs Repair</span>}
                        {tool.status === 'retired' && <span className="badge badge-neutral gap-1">Retired</span>}
                      </td>
                      <td>{tool.note}</td>
                      <td>
                        <div className="flex items-center gap-1">
                          <div className="w-24 flex-shrink-0">
                            {(() => {
                              const isAssigned = !!tool.assignedTo;
                              const isRepair = String(tool.condition).toLowerCase() === 'needs_repair';
                              const isRetired = String(tool.condition).toLowerCase() === 'retired';
                              
                              if (isRetired) {
                                return (
                                  <button className="btn btn-sm btn-disabled w-full text-xs" disabled>
                                    Retired
                                  </button>
                                );
                              } else if (!isAssigned) {
                                return (
                                  <button
                                    className={`btn btn-sm btn-success w-full text-xs ${isRepair ? 'btn-disabled opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={isRepair}
                                    title={isRepair ? 'Disabled: tool needs repair' : 'Assign this tool'}
                                    onClick={() => {
                                      if (isRepair) return;
                                      openAssignModal(tool);
                                    }}
                                  >
                                    <UserPlus size={12}/> Assign
                                  </button>
                                );
                              } else {
                                return (
                                  <button
                                    className="btn btn-sm btn-outline btn-success w-full text-xs"
                                    title="Unassign from worker"
                                    onClick={() => unassignTool(tool)}
                                  >
                                    <UserMinus size={12}/> Unassign
                                  </button>
                                );
                              }
                            })()}
                          </div>
                          <button className="btn btn-sm btn-warning flex-shrink-0 text-xs" onClick={() => navigate(`/inventory/tools/${tool._id}`)}>
                            <Edit3 size={12}/> Details
                          </button>
                          {String(tool.condition).toLowerCase() !== 'retired' && (
                            <button className="btn btn-sm btn-error flex-shrink-0 text-xs" disabled={actionLoading} onClick={() => deleteTool(tool._id)}>
                              <Trash2 size={12}/> Retire
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {noteModal.open && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-base-100 rounded-xl shadow-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Tool Note</h2>
              <div className="mb-4 text-base-content/80">
                {noteModal.note && noteModal.note.trim() ? noteModal.note : <span className="text-base-content/50">No note</span>}
              </div>
              <div className="flex gap-2 justify-end">
                <button className="btn" onClick={() => setNoteModal({ open: false, note: '' })}>Close</button>
              </div>
            </div>
          </div>
        )}

        {assignModal.open && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-base-100 rounded-xl shadow-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Assign Tool</h2>
              <select className="select select-bordered w-full mb-4" value={assignWorkerId} onChange={e => setAssignWorkerId(e.target.value)}>
                <option value="">Select worker...</option>
                {workers.map(w => (
                  <option key={w._id} value={w._id}>{w.name}</option>
                ))}
              </select>
              <div className="flex gap-2 justify-end">
                <button className="btn" onClick={() => setAssignModal({ open: false, tool: null })}>Cancel</button>
                <button className="btn btn-primary" disabled={actionLoading} onClick={assignTool}>Assign</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolsPage;
