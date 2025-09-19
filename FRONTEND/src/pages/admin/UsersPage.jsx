import React, { useEffect, useMemo, useState } from "react";
import { Sweet } from "../../utils/sweet";
import axios from "axios";
import {
  UserPlus,
  Users,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  ArrowLeft,
  Edit3,
  Save,
  X
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:5001";

// 7 creation inputs: name, email, role, password, phone, estate, department
const UsersPage = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const authHeader = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [listLoading, setListLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;

  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "worker",
    password: "",
    phone: "",
    estate: "",
    department: ""
  });
  const [creating, setCreating] = useState(false);
  const [tempPw, setTempPw] = useState("");
  const [justCopied, setJustCopied] = useState(false);
  const [error, setError] = useState("");

  // Edit modal state
  const [editing, setEditing] = useState(null); // holds the user object being edited
  const [editData, setEditData] = useState({
    name: "",
    email: "",
    role: "worker",
    phone: "",
    estate: "",
    department: "",
    password: "" // optional to change
  });
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    try {
      setListLoading(true);
      const res = await axios.get(`${API}/api/admin/users?page=${page}&limit=${limit}`, { headers: authHeader });
      setUsers(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || "Failed to load users");
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const onCreate = async (e) => {
    e.preventDefault();
    setError("");
    setCreating(true);
    setTempPw("");
    try {
      const res = await axios.post(`${API}/api/admin/users`, form, {
        headers: { ...authHeader, "Content-Type": "application/json" }
      });
      setTempPw(res.data.temporaryPassword);
      setForm({
        name: "",
        email: "",
        role: "worker",
        password: "",
        phone: "",
        estate: "",
        department: ""
      });
      fetchUsers();
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || "Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  const resetPassword = async (id) => {
    try {
      const res = await axios.post(`${API}/api/admin/users/${id}/reset-password`, {}, { headers: authHeader });
      Sweet.info(`New temporary password: ${res.data.temporaryPassword}`);
    } catch (e) {
      console.error(e);
      Sweet.error(e?.response?.data?.message || "Failed to reset password");
    }
  };

  const deleteUser = async (id) => {
    const ok = await Sweet.confirm("Delete this user?");
    if (!ok) return;
    try {
      await axios.delete(`${API}/api/admin/users/${id}`, { headers: authHeader });
      fetchUsers();
    } catch (e) {
      console.error(e);
      Sweet.error(e?.response?.data?.message || "Failed to delete");
    }
  };

  const openEdit = (u) => {
    setEditing(u);
    setEditData({
      name: u.name || "",
      email: u.email || "",
      role: u.role || "worker",
      phone: u.phone || "",
      estate: u.estate || "",
      department: u.department || "",
      password: "" // leave blank to keep current password
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await axios.patch(`${API}/api/admin/users/${editing._id || editing.id}`, editData, {
        headers: { ...authHeader, "Content-Type": "application/json" }
      });
      setEditing(null);
      setEditData({
        name: "",
        email: "",
        role: "worker",
        phone: "",
        estate: "",
        department: "",
        password: ""
      });
      fetchUsers();
    } catch (e) {
      console.error(e);
      Sweet.error(e?.response?.data?.message || "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const copyTemp = async () => {
    try {
      await navigator.clipboard.writeText(tempPw);
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 1200);
    } catch {}
  };

  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return (
    <div className="min-h-screen bg-base-200">
      <div className="mx-auto max-w-6xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="btn btn-ghost btn-sm" onClick={() => navigate("/admin-dashboard")}>
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <Users className="w-6 h-6 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold">Users</h1>
          </div>
          <button className="btn btn-ghost" onClick={fetchUsers}>
            <RefreshCw className={`w-4 h-4 ${listLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="alert alert-error mt-4">
            <span>{error}</span>
          </div>
        )}

        {/* Create User (7 inputs) */}
        <div className="mt-6 rounded-2xl bg-base-100 p-6 shadow border border-base-200">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Create New User</h2>
          </div>
          <form onSubmit={onCreate} className="grid md:grid-cols-4 gap-4">
            <input
              type="text"
              className="input input-bordered"
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
            />
            <input
              type="email"
              className="input input-bordered"
              placeholder="Email (unique)"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              required
            />
            <select
              className="select select-bordered"
              value={form.role}
              onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
            >
              <option value="worker">Worker</option>
              <option value="production_manager">Production Manager</option>
              <option value="inventory_manager">Inventory Manager</option>
              <option value="field_supervisor">Field Supervisor</option>
              <option value="admin">Admin</option>
            </select>
            <input
              type="text"
              className="input input-bordered"
              placeholder="Password (or leave blank to auto-generate)"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            />
            <input
              type="text"
              className="input input-bordered"
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            />
            <input
              type="text"
              className="input input-bordered"
              placeholder="Estate"
              value={form.estate}
              onChange={(e) => setForm((p) => ({ ...p, estate: e.target.value }))}
            />
            <input
              type="text"
              className="input input-bordered"
              placeholder="Department"
              value={form.department}
              onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
            />
            <div className="md:col-span-4">
              <button className={`btn btn-primary ${creating ? "btn-disabled" : ""}`} type="submit">
                {creating && <span className="loading loading-spinner loading-sm mr-2" />}
                Create user
              </button>
            </div>
          </form>

          {tempPw && (
            <div className="alert alert-success mt-4 items-center">
              <span>
                Temporary password:&nbsp;
                <code className="px-2 py-1 rounded bg-base-200">{tempPw}</code>
              </span>
              <button className="btn btn-sm" onClick={copyTemp}>
                {justCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {justCopied ? "Copied" : "Copy"}
              </button>
            </div>
          )}
        </div>

        {/* Users Table */}
        <div className="mt-6 rounded-2xl bg-base-100 p-6 shadow border border-base-200">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Phone</th>
                  <th>Estate</th>
                  <th>Department</th>
                  <th>Created</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id || u.id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td className="capitalize">{u.role.replace("_", " ")}</td>
                    <td>{u.phone || "-"}</td>
                    <td>{u.estate || "-"}</td>
                    <td>{u.department || "-"}</td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <button className="btn btn-sm" onClick={() => resetPassword(u._id || u.id)}>
                          Reset PW
                        </button>
                        <button className="btn btn-sm" onClick={() => openEdit(u)}>
                          <Edit3 className="w-4 h-4 mr-1" />
                          Edit
                        </button>
                        <button className="btn btn-sm btn-error" onClick={() => deleteUser(u._id || u.id)}>
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && !listLoading && (
                  <tr>
                    <td colSpan={8} className="text-center text-base-content/60">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-base-content/70">
              Page {page} of {totalPages} • {total} total
            </div>
            <div className="join">
              <button className="btn join-item" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                « Prev
              </button>
              <button
                className="btn join-item"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next »
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-base-100 rounded-2xl p-6 w-full max-w-2xl border border-base-300 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Edit User</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <input
                type="text"
                className="input input-bordered"
                placeholder="Full name"
                value={editData.name}
                onChange={(e) => setEditData((p) => ({ ...p, name: e.target.value }))}
              />
              <input
                type="email"
                className="input input-bordered"
                placeholder="Email"
                value={editData.email}
                onChange={(e) => setEditData((p) => ({ ...p, email: e.target.value.toLowerCase() }))}
              />
              <select
                className="select select-bordered"
                value={editData.role}
                onChange={(e) => setEditData((p) => ({ ...p, role: e.target.value }))}
              >
                <option value="worker">Worker</option>
                <option value="production_manager">Production Manager</option>
                <option value="inventory_manager">Inventory Manager</option>
                <option value="field_supervisor">Field Supervisor</option>
                <option value="admin">Admin</option>
              </select>

              <input
                type="text"
                className="input input-bordered"
                placeholder="Phone"
                value={editData.phone}
                onChange={(e) => setEditData((p) => ({ ...p, phone: e.target.value }))}
              />
              <input
                type="text"
                className="input input-bordered"
                placeholder="Estate"
                value={editData.estate}
                onChange={(e) => setEditData((p) => ({ ...p, estate: e.target.value }))}
              />
              <input
                type="text"
                className="input input-bordered"
                placeholder="Department"
                value={editData.department}
                onChange={(e) => setEditData((p) => ({ ...p, department: e.target.value }))}
              />

              <input
                type="text"
                className="input input-bordered md:col-span-3"
                placeholder="New password (optional)"
                value={editData.password}
                onChange={(e) => setEditData((p) => ({ ...p, password: e.target.value }))}
              />
            </div>

            <div className="flex items-center justify-end gap-2 mt-5">
              <button className="btn" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button className={`btn btn-primary ${saving ? "btn-disabled" : ""}`} onClick={saveEdit}>
                {saving ? <span className="loading loading-spinner loading-sm mr-2" /> : <Save className="w-4 h-4 mr-1" />}
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
