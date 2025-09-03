// src/pages/field_supervisor/AssignedTasks.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Pencil,
  Trash2,
  User,
  ClipboardList,
  Calendar,
  RefreshCw,
  X,
  Save,
  ArrowLeft, // ✅ Added missing import
} from "lucide-react";
import { useNavigate } from "react-router-dom"; // ✅ Import navigate hook

const API = import.meta.env.VITE_API_URL || "http://localhost:5001";

export default function AssignedTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [editing, setEditing] = useState(null);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("token");
  const navigate = useNavigate(); // ✅ Initialize navigate

  async function fetchTasks() {
    setLoading(true);
    setErr("");
    try {
      const res = await axios.get(`${API}/api/tasks/get-tasks`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setTasks(res.data || []);
    } catch (e) {
      setErr("Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  }

  async function deleteTask(id) {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await axios.delete(`${API}/api/tasks/delete-task/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setTasks((prev) => prev.filter((t) => t._id !== id));
    } catch {
      alert("Failed to delete task");
    }
  }

  async function saveEdit() {
    setSaving(true);
    try {
      await axios.put(`${API}/api/tasks/update-task/${editing._id}`, editData, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setTasks((prev) =>
        prev.map((t) => (t._id === editing._id ? { ...t, ...editData } : t))
      );
      setEditing(null);
    } catch {
      alert("Failed to update task");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950 text-white">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Assigned Tasks</h1>
          <div className="flex gap-3">
            <button
              onClick={fetchTasks}
              className="btn btn-sm btn-outline flex items-center gap-1"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>

            <button className="btn btn-sm flex items-center" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </button>
          </div>
        </div>

        {err && <div className="alert alert-error mb-4">{err}</div>}

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
          <table className="table table-zebra text-white/90">
            <thead className="bg-white/10">
              <tr>
                <th>Worker</th>
                <th>Task</th>
                <th>Description</th>
                <th>Date</th>
                <th>Status</th>
                <th>Assigned By</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-6">
                    Loading...
                  </td>
                </tr>
              ) : tasks.length ? (
                tasks.map((t) => (
                  <tr key={t._id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {t.workerId?.name}{" "}
                        {t.workerId?.estate ? `(${t.workerId.estate})` : ""}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <ClipboardList className="w-4 h-4" /> {t.taskName}
                      </div>
                    </td>
                    <td>{t.taskDescription || "—"}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(t.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`px-2 py-1 rounded-xl text-xs font-medium ${
                          t.status === "completed"
                            ? "bg-green-200/90 text-emerald-800"
                            : t.status === "in_progress"
                            ? "bg-blue-200/90 text-blue-800"
                            : t.status === "cancelled"
                            ? "bg-rose-200/90 text-rose-800"
                            : "bg-yellow-200/90 text-yellow-800"
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td>{t.assignedBy?.name || "—"}</td>
                    <td className="text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => {
                            setEditing(t);
                            setEditData({
                              taskName: t.taskName,
                              taskDescription: t.taskDescription,
                              date: t.date?.split("T")[0],
                              status: t.status,
                            });
                          }}
                          className="btn btn-xs btn-outline"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteTask(t._id)}
                          className="btn btn-xs btn-error"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-6">
                    No tasks assigned yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ✨ Edit Task Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-emerald-900/95 via-emerald-800/95 to-emerald-900/95 rounded-3xl p-6 w-full max-w-2xl border border-white/20 shadow-2xl animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 border-b border-white/20 pb-3">
              <h3 className="text-2xl font-semibold text-white flex items-center gap-2">
                <ClipboardList className="w-6 h-6 text-emerald-300" />
                Edit Task
              </h3>
              <button
                className="btn btn-ghost btn-sm text-white/70 hover:text-white"
                onClick={() => setEditing(null)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="grid md:grid-cols-2 gap-4">
              <input
                className="input input-bordered bg-white/10 text-white placeholder:text-white/50 rounded-xl"
                placeholder="Task name"
                value={editData.taskName}
                onChange={(e) =>
                  setEditData((p) => ({ ...p, taskName: e.target.value }))
                }
              />
              <input
                className="input input-bordered bg-white/10 text-white placeholder:text-white/50 rounded-xl"
                placeholder="Assigned date"
                type="date"
                value={editData.date?.slice(0, 10)}
                onChange={(e) =>
                  setEditData((p) => ({ ...p, date: e.target.value }))
                }
              />
              <textarea
                className="textarea textarea-bordered bg-white/10 text-white placeholder:text-white/50 rounded-xl md:col-span-2"
                placeholder="Task description"
                rows={3}
                value={editData.taskDescription}
                onChange={(e) =>
                  setEditData((p) => ({
                    ...p,
                    taskDescription: e.target.value,
                  }))
                }
              />
              <select
                className="select select-bordered bg-white/10 text-white rounded-xl md:col-span-2"
                value={editData.status}
                onChange={(e) =>
                  setEditData((p) => ({ ...p, status: e.target.value }))
                }
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 mt-8">
              <button
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium shadow transition"
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
              <button
                className={`px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow-lg flex items-center gap-2 transition ${
                  saving ? "opacity-70 cursor-not-allowed" : ""
                }`}
                onClick={saveEdit}
              >
                {saving ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
