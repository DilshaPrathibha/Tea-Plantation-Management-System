// Copied from NEWPAGES
// ...existing code from NEWPAGES/FRONTEND/src/pages/ToolsPage.jsx...

import React, { useState, useEffect } from 'react';
import { Download, Printer, UserPlus, UserMinus, Edit3, Trash2 } from 'lucide-react';
import { jsPDF } from 'jspdf';            
import autoTable from 'jspdf-autotable';
import Navbar from '@/components/Navbar';
import RateLimitedUI from '@/components/RateLimitedUI';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const api = axios.create({
  baseURL: 'http://localhost:5001/api',
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' }
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
  const [loading, setLoading] = useState(true);
  const [isRateLimited, setIsRateLimited] = useState(false);
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
      setIsRateLimited(false);
    } catch (error) {
      console.error('Failed to fetch tools', error);
      if (error.response?.status === 429) {
        setIsRateLimited(true);
        toast.error('You are being rate-limited. Please try again shortly.');
      } else {
        toast.error('Could not load tools.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkers = async () => {
    try {
      const res = await api.get('/workers');
      setWorkers(res.data);
    } catch {
      toast.error('Could not load workers');
    }
  };

  useEffect(() => {
    fetchTools();
  }, [search, typeFilter, statusFilter]);

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

      // Table
      const body = (Array.isArray(tools) ? tools : []).map(t => [
        t.toolId || '-',
        t.toolType || '',
        t.assignedTo?.name || 'Unassigned',
        t.condition || '',
        t.status || '',
        t.note || ''
      ]);
      if (body.length === 0) body.push(['-', '-', '-', '-', '-', '-']);

      autoTable(doc, {
        head: [['Tool ID', 'Type', 'Assigned To', 'Condition', 'Status', 'Notes']],
        body,
        startY: titleY + 16,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [34, 197, 94], textColor: [0, 0, 0] },
        alternateRowStyles: { fillColor: [240, 253, 244] },
        margin: { left: 40, right: 40 }
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
    if (!window.confirm('Are you sure you want to delete this tool?')) return;
    setActionLoading(true);
    try {
      await api.delete(`/tools/${id}`);
      toast.success('Tool deleted');
      fetchTools();
    } catch {
      toast.error('Delete failed');
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
    if (!assignWorkerId) return toast.error('Select a worker');
    setActionLoading(true);
    try {
      await api.post(`/tools/${assignModal.tool._id}/assign`, { workerId: assignWorkerId });
      toast.success('Tool assigned');
      setAssignModal({ open: false, tool: null });
      fetchTools();
    } catch {
      toast.error('Assign failed');
    } finally {
      setActionLoading(false);
    }
  };
  const unassignTool = async tool => {
    setActionLoading(true);
    try {
      await api.post(`/tools/${tool._id}/unassign`);
      toast.success('Tool unassigned');
      fetchTools();
    } catch {
      toast.error('Unassign failed');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />
      <div className="container mx-auto p-4">
        {isRateLimited && <RateLimitedUI />}
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
          <input
            className="input input-bordered w-full md:w-64"
            placeholder="Search tools..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="select select-bordered w-full md:w-40" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            <option value="knife">Knife</option>
            <option value="sprayer">Sprayer</option>
            <option value="hoe">Hoe</option>
            <option value="other">Other</option>
          </select>
          <select className="select select-bordered w-full md:w-40" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="assigned">Assigned</option>
            <option value="needs_repair">Needs Repair</option>
          </select>
          <button className="btn btn-outline gap-2" onClick={exportCSV}><Download size={16}/> Export CSV</button>
          <button className="btn btn-outline gap-2" onClick={exportPDF}><Printer size={16}/> Export PDF</button>
          <button className="btn btn-primary ml-auto" onClick={() => navigate('/tools/create')}>+ New Tool</button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Tool ID</th>
                  <th>Type</th>
                  <th>Assigned To</th>
                  <th>Condition</th>
                  <th>Status</th>
                  <th className="w-48">Notes</th>
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
                    </td>
                    <td>{tool.note}</td>
                    <td>
                      <div className="flex gap-2">
                        {(() => {
                          const isAssigned = !!tool.assignedTo;
                          const isRepair = String(tool.condition).toLowerCase() === 'needs_repair';
                          if (!isAssigned) {
                            return (
                              <button
                                className={`btn btn-sm btn-neutral ${isRepair ? 'btn-disabled opacity-50 cursor-not-allowed' : ''}`}
                                disabled={isRepair}
                                title={isRepair ? 'Disabled: tool needs repair' : 'Assign this tool'}
                                onClick={() => {
                                  if (isRepair) return;
                                  openAssignModal(tool);
                                }}
                              >
                                <UserPlus size={16} className="mr-1"/> Assign
                              </button>
                            );
                          } else {
                            return (
                              <button
                                className="btn btn-sm"
                                title="Unassign from worker"
                                onClick={() => unassignTool(tool)}
                              >
                                Unassign
                              </button>
                            );
                          }
                        })()}
                        <button className="btn btn-sm btn-warning" onClick={() => navigate(`/tools/${tool._id}`)}>
                          <Edit3 size={16}/> Details
                        </button>
                        <button className="btn btn-sm btn-error" disabled={actionLoading} onClick={() => deleteTool(tool._id)}>
                          <Trash2 size={16}/> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Notes Modal / Assign Modal below */}
          </div>
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
