// Copied from NEWPAGES
// ...existing code from NEWPAGES/FRONTEND/src/pages/ToolsPage.jsx...

import React, { useState, useEffect } from 'react';
import { Download, Printer, UserPlus, UserMinus, Edit3, Trash2 } from 'lucide-react';
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

  // Export PDF (print)
  const exportPDF = () => {
    window.print();
  };

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
                  <th className="w-48">Actions</th>
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
                        {tool.status !== 'needs_repair' && (
                          tool.assignedTo ? (
                            <button className="btn btn-sm btn-outline" disabled={actionLoading} onClick={() => unassignTool(tool)}>
                              <UserMinus size={16}/> Unassign
                            </button>
                          ) : (
                            <button className="btn btn-sm btn-outline" disabled={actionLoading} onClick={() => openAssignModal(tool)}>
                              <UserPlus size={16}/> Assign
                            </button>
                          )
                        )}
                        <button className="btn btn-sm btn-warning" onClick={() => navigate(`/tool/${tool._id}`)}>
                          <Edit3 size={16}/> Edit
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
