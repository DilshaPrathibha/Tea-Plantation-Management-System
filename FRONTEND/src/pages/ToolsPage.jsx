// Copied from NEWPAGES
// ...existing code from NEWPAGES/FRONTEND/src/pages/ToolsPage.jsx...

import React, { useState, useEffect } from 'react';
import { Download, Printer, UserPlus, UserMinus, Edit3, Trash2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Navbar from '@/components/Navbar';
import RateLimitedUI from '@/components/RateLimitedUI';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const api = axios.create({
  baseURL: 'http://localhost:5001/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  }
});

const ToolsPage = () => {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [workers, setWorkers] = useState([]);
  const [assignModal, setAssignModal] = useState({ open: false, tool: null });
  const [assignWorkerId, setAssignWorkerId] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [noteModal, setNoteModal] = useState({ open: false, note: "" });
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
      console.error("Failed to fetch tools", error);
      if (error.response?.status === 429) {
        setIsRateLimited(true);
        toast.error("You are being rate-limited. Please try again shortly.");
      } else {
        toast.error("Could not load tools.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkers = async () => {
    try {
      const res = await api.get('/workers');
      setWorkers(res.data);
    } catch (err) {
      toast.error("Could not load workers");
    }
  };

  useEffect(() => {
    fetchTools();
  }, [search, typeFilter, statusFilter]);

  // Export CSV
  const exportCSV = () => {
    const rows = [
      ["Tool ID", "Type", "Assigned To", "Condition", "Status", "Note"],
      ...tools.map(t => [
        t.toolId,
        t.toolType,
        t.assignedTo?.name || "",
        t.condition,
        t.status,
        t.note
      ])
    ];
    const csv = rows.map(r => r.map(x => `"${x}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tools.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export PDF (jsPDF, popup-safe, robust)
  const exportPDF = async () => {
    const win = window.open('', '_blank');
    console.log('Export PDF clicked');
    try {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      // Title centered
      doc.setFontSize(18);
      const pageWidth = doc.internal.pageSize.getWidth();
      const title = 'CeylonLeaf - Tool Inventory Report';
      const titleWidth = doc.getTextWidth(title);
      doc.text(title, (pageWidth - titleWidth) / 2, 40);
      // Date/time right
      doc.setFontSize(10);
      const dateStr = `Generated on ${new Date().toLocaleString()}`;
      doc.text(dateStr, pageWidth - doc.getTextWidth(dateStr) - 40, 60);
      // Table rows
      const rows = Array.isArray(tools) ? tools : [];
      let body = rows.map(t => [
        t.toolId || '-',
        t.toolType || '',
        t.assignedTo?.name || 'Unassigned',
        t.condition || '',
        t.status || ''
      ]);
      if (body.length === 0) {
        body.push(['-', '-', '-', '-', '-']);
      }
      console.log('Table rows count:', body.length);
      console.log('autoTable exists?', typeof autoTable);
      autoTable(doc, {
        head: [['Tool ID', 'Type', 'Assigned To', 'Condition', 'Status']],
        body,
        startY: 80,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [34, 197, 94], textColor: [0,0,0] },
        alternateRowStyles: { fillColor: [240, 253, 244] },
        margin: { left: 40, right: 40 },
      });
      // Open PDF in pre-opened tab if possible
      const url = doc.output('bloburl');
      if (win) {
        win.location.href = url;
        console.log('Opened in pre-opened tab');
      } else {
        window.open(url, '_blank');
        console.log('Opened in fallback new tab');
      }
    } catch (e) {
      console.error(e);
      if (win) {
        win.document.body.innerHTML = '<p style="font-family:sans-serif">Failed to generate PDF.</p>';
      }
    }
  };

  // To re-enable logo in PDF export:
  // const base = import.meta.env.BASE_URL || '/';
  // fetch(base + 'logo.png') ... fallback to base + 'logo192.png'
  // Only addImage if dataURL is valid.

  const deleteTool = async (id) => {
    if (!window.confirm("Are you sure you want to delete this tool?")) return;
    setActionLoading(true);
    try {
      await api.delete(`/tools/${id}`);
      toast.success("Tool deleted");
      fetchTools();
    } catch (err) {
      toast.error("Delete failed");
    } finally {
      setActionLoading(false);
    }
  };

  // Assign tool
  const openAssignModal = (tool) => {
    setAssignModal({ open: true, tool });
    setAssignWorkerId("");
    fetchWorkers();
  };
  const assignTool = async () => {
    if (!assignWorkerId) return toast.error("Select a worker");
    setActionLoading(true);
    try {
      await api.post(`/tools/${assignModal.tool._id}/assign`, { workerId: assignWorkerId });
      toast.success("Tool assigned");
      setAssignModal({ open: false, tool: null });
      fetchTools();
    } catch (err) {
      toast.error("Assign failed");
    } finally {
      setActionLoading(false);
    }
  };
  // Unassign tool
  const unassignTool = async (tool) => {
    setActionLoading(true);
    try {
      await api.post(`/tools/${tool._id}/unassign`);
      toast.success("Tool unassigned");
      fetchTools();
    } catch (err) {
      toast.error("Unassign failed");
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
            <option value="harvester">Harvester</option>
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
                  <th className="w-48">Actions / Notes</th>
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
                      {tool.status === 'available' && <span className="badge badge-success gap-1">✅ Available</span>}
                      {tool.status === 'assigned' && <span className="badge badge-warning gap-1">🟡 Assigned</span>}
                      {tool.status === 'needs_repair' && <span className="badge badge-error gap-1">🔴 Needs Repair</span>}
                    </td>
                    <td>{tool.note}</td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          className="btn btn-sm btn-neutral"
                          onClick={() => setNoteModal({ open: true, note: tool.note })}
                        >
                          Notes
                        </button>
                        {/* Drop-in snippet for Assign/Unassign actions */}
                        {(() => {
                          const isAssigned = !!tool.assignedTo;
                          const isRepair = String(tool.condition).toLowerCase() === 'needs_repair';
                          if (!isAssigned) {
                            return (
                              <button
                                className={`btn btn-sm ${isRepair ? 'btn-disabled opacity-50 cursor-not-allowed' : ''}`}
                                disabled={isRepair}
                                title={isRepair ? 'Disabled: tool needs repair' : 'Assign this tool'}
                                onClick={() => {
                                  if (isRepair) return;
                                  openAssignModal(tool);
                                }}
                              >
                                Assign
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
            {/* Notes Modal */}
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
                <button className="btn" onClick={() => setNoteModal({ open: false, note: "" })}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Assign Modal */}
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
