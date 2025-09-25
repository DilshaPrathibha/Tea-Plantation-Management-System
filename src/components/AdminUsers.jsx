import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  UserPlus, Users, Copy, Check, RefreshCw, Trash2, Hash,
  Pencil, Save, X as XIcon, Plus, Search, Download, ArrowUpAZ, ArrowDownAZ
} from 'lucide-react';
import { Sweet, Toast } from '@/utils/sweet';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const defaultCreate = {
  name: '', email: '', role: 'worker', password: '', empId: '',
  phone: ''
};
const defaultEdit = {
  id: '', name: '', email: '', role: 'worker', empId: '',
  phone: '', password: ''
};

// allowed sort fields must match backend whitelist
const SORT_FIELDS = [
  { value: 'createdAt', label: 'Created' },
  { value: 'name', label: 'Name' },
  { value: 'email', label: 'Email' },
  { value: 'role', label: 'Role' },
  { value: 'empId', label: 'Emp ID' },
  { value: 'phone', label: 'Phone' },
];

export default function AdminUsers() {
  const token = localStorage.getItem('token');
  const authHeader = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  // table
  const [listLoading, setListLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;

  // search/sort
  const [q, setQ] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc'); // 'asc' | 'desc'

  // create
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(defaultCreate);
  const [creating, setCreating] = useState(false);
  const [tempPw, setTempPw] = useState('');
  const [justCopied, setJustCopied] = useState(false);

  // edit
  const [showEdit, setShowEdit] = useState(false);
  const [edit, setEdit] = useState(defaultEdit);
  const [savingEdit, setSavingEdit] = useState(false);

  // errors
  const [error, setError] = useState('');

  // -------- data ----------
  const fetchUsers = async () => {
    try {
      setError('');
      setListLoading(true);

      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (q.trim()) params.set('q', q.trim());
      if (sortBy) params.set('sortBy', sortBy);
      if (sortDir) params.set('sortDir', sortDir);

      const res = await axios.get(`${API}/api/admin/users?` + params.toString(), { headers: authHeader });
      setUsers(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || 'Failed to load users');
    } finally {
      setListLoading(false);
    }
  };

  // debounce: fetch on filter/sort/page changes
  useEffect(() => {
    const t = setTimeout(fetchUsers, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, q, sortBy, sortDir]);

  // -------- create ----------
  const onCreate = async (e) => {
    e.preventDefault();
    setError('');
    setCreating(true);
    setTempPw('');
    try {
      const res = await axios.post(`${API}/api/admin/users`, form, {
        headers: { ...authHeader, 'Content-Type': 'application/json' }
      });
      setTempPw(res.data.temporaryPassword || '');
      Toast.success('User created');
      setForm(defaultCreate);
      setPage(1);
      fetchUsers();
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || 'Failed to create user');
      Toast.error(e?.response?.data?.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const copyTemp = async () => {
    try {
      await navigator.clipboard.writeText(tempPw);
      setJustCopied(true);
      Toast.success('Copied to clipboard');
      setTimeout(() => setJustCopied(false), 1200);
    } catch {
      Toast.error('Copy failed');
    }
  };

  // -------- edit ----------
  const openEdit = (u) => {
    setEdit({
      id: u._id || u.id,
      name: u.name || '',
      email: u.email || '',
      role: u.role || 'worker',
      empId: u.empId || '',
      phone: u.phone || '',
      password: ''
    });
    setShowEdit(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setShowEdit(false);
    setEdit(defaultEdit);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!edit.id) return;
    setSavingEdit(true);
    setError('');
    try {
      const payload = {
        name: edit.name,
        email: edit.email,
        role: edit.role,
        empId: edit.empId || undefined,
        phone: edit.phone,
      };
      if (edit.password && edit.password.trim().length >= 6) {
        payload.password = edit.password.trim();
      }
      await axios.patch(`${API}/api/admin/users/${edit.id}`, payload, {
        headers: { ...authHeader, 'Content-Type': 'application/json' }
      });
      Toast.success('User updated');
      setShowEdit(false);
      setEdit(defaultEdit);
      fetchUsers();
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || 'Failed to update user');
      Toast.error(e?.response?.data?.message || 'Failed to update user');
    } finally {
      setSavingEdit(false);
    }
  };

  // -------- other actions ----------
  const resetPassword = async (id) => {
    try {
      const res = await axios.post(`${API}/api/admin/users/${id}/reset-password`, {}, { headers: authHeader });
      await Sweet.success(`New temporary password: ${res.data.temporaryPassword}`);
    } catch (e) {
      console.error(e);
      await Sweet.error(e?.response?.data?.message || 'Failed to reset password');
    }
  };

  const deleteUser = async (id) => {
    const ok = await Sweet.confirm('Delete this user?');
    if (!ok) return;
    try {
      await axios.delete(`${API}/api/admin/users/${id}`, { headers: authHeader });
      Toast.success('User deleted');
      const remaining = (total - 1) - ((page - 1) * limit);
      if (remaining <= 0 && page > 1) {
        setPage((p) => p - 1);
      } else {
        fetchUsers();
      }
    } catch (e) {
      console.error(e);
      await Sweet.error(e?.response?.data?.message || 'Failed to delete');
    }
  };

  const totalPages = Math.max(Math.ceil(total / limit), 1);

  // -------- PDF (no dependency) ----------
  const exportPdf = () => {
    const w = window.open('', '_blank');
    if (!w) return Sweet.error('Please allow popups to export.');

    const escapeHTML = (s) =>
      String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const style = `
      <style>
        * { font-family: Arial, Helvetica, sans-serif; }
        .header { display:flex; justify-content:space-between; align-items:center; }
        .title { font-size:20px; font-weight:bold; margin:0; }
        .meta { font-size:12px; color:#444; text-align:right; }
        .hr { border:0; border-top:1px solid #ddd; margin:12px 0; }
        table { width:100%; border-collapse:collapse; font-size:12px; }
        th, td { border:1px solid #ddd; padding:6px 8px; }
        th { background:#f3f3f3; text-align:left; }
      </style>
    `;

    const now = new Date();
    const rowsHtml = users.map(u => `
      <tr>
        <td>${escapeHTML(u.name)}</td>
        <td>${escapeHTML(u.empId || '-')}</td>
        <td>${escapeHTML(u.email)}</td>
        <td>${escapeHTML((u.role || '').replace('_', ' '))}</td>
        <td>${escapeHTML(u.phone || '-')}</td>
        <td>${u.createdAt ? escapeHTML(new Date(u.createdAt).toLocaleString()) : '-'}</td>
      </tr>
    `).join('');

    const html = `
      <!doctype html><html><head><meta charset="utf-8">${style}</head><body>
        <div class="header">
          <div>
            <h1 class="title">CeylonLeaf</h1>
            <div class="meta">Users Report</div>
          </div>
          <div class="meta">
            Generated: ${now.toLocaleString()}<br/>
            ${q ? `Search: "${escapeHTML(q)}"<br/>` : ''}
            Sort: ${escapeHTML(SORT_FIELDS.find(s => s.value === sortBy)?.label || 'Created')} (${escapeHTML(sortDir)})
            &nbsp;•&nbsp; Page ${page} of ${totalPages}
          </div>
        </div>
        <hr class="hr"/>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Emp ID</th>
              <th>Email</th>
              <th>Role</th>
              <th>Phone</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || `<tr><td colspan="6" style="text-align:center;color:#666;">No data</td></tr>`}
          </tbody>
        </table>
      </body></html>
    `;
    w.document.open(); w.document.write(html); w.document.close();
    w.onload = () => { w.focus(); w.print(); };
  };

  return (
    <div className="min-h-screen bg-base-200">
      <div className="mx-auto max-w-6xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold">Admin — Users</h1>
          </div>

          <div className="flex items-center gap-2">
            <button className="btn" onClick={() => setShowCreate((s) => !s)}>
              <Plus className="w-4 h-4 mr-1" />
              {showCreate ? 'Hide form' : 'Add user'}
            </button>
            <button className="btn" onClick={exportPdf} disabled={users.length === 0}>
              <Download className="w-4 h-4 mr-1" />
              Export PDF
            </button>
            <button className="btn btn-ghost" onClick={fetchUsers}>
              <RefreshCw className={`w-4 h-4 ${listLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Toolbar: Search + Sort */}
        <div className="mt-4 flex flex-col md:flex-row gap-3 items-stretch">
          <div className="relative flex-1">
            <Search className="w-4 h-4 opacity-60 absolute left-3 top-3.5" />
            <input
              className="input input-bordered w-full pl-9"
              placeholder="Search name, email, role, empId, phone…"
              value={q}
              onChange={(e) => {
                setPage(1);
                setQ(e.target.value);
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              className="select select-bordered"
              value={sortBy}
              onChange={(e) => {
                setPage(1);
                setSortBy(e.target.value);
              }}
              title="Sort by"
            >
              {SORT_FIELDS.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
            <button
              className="btn"
              onClick={() => {
                setPage(1);
                setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
              }}
              title="Toggle sort direction"
            >
              {sortDir === 'asc' ? <ArrowUpAZ className="w-4 h-4 mr-1" /> : <ArrowDownAZ className="w-4 h-4 mr-1" />}
              {sortDir === 'asc' ? 'Asc' : 'Desc'}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="alert alert-error mt-4">
            <span>{error}</span>
          </div>
        )}

        {/* Edit Form */}
        {showEdit && (
          <div className="mt-6 rounded-2xl bg-base-100 p-6 shadow border border-base-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Pencil className="w-5 h-5 text-primary" /> Edit User
              </h2>
              <button className="btn btn-ghost" onClick={cancelEdit}>
                <XIcon className="w-4 h-4 mr-1" /> Cancel
              </button>
            </div>

            <form onSubmit={saveEdit} className="space-y-3">
              <label className="form-control">
                <span className="label-text">Full name</span>
                <input
                  className="input input-bordered"
                  value={edit.name}
                  onChange={(e) => setEdit((p) => ({ ...p, name: e.target.value }))}
                  required
                />
              </label>

              <label className="form-control">
                <span className="label-text">Email</span>
                <input
                  type="email"
                  className="input input-bordered"
                  value={edit.email}
                  onChange={(e) => setEdit((p) => ({ ...p, email: e.target.value }))}
                  required
                />
              </label>

              <label className="form-control">
                <span className="label-text">Role</span>
                <select
                  className="select select-bordered"
                  value={edit.role}
                  onChange={(e) => setEdit((p) => ({ ...p, role: e.target.value }))}
                >
                  <option value="worker">Worker</option>
                  <option value="production_manager">Production Manager</option>
                  <option value="inventory_manager">Inventory Manager</option>
                  <option value="field_supervisor">Field Supervisor</option>
                  <option value="admin">Admin</option>
                </select>
              </label>

              <label className="form-control">
                <span className="label-text">Emp ID</span>
                <div className="relative">
                  <input
                    className="input input-bordered w-full pl-9"
                    value={edit.empId}
                    onChange={(e) => setEdit((p) => ({ ...p, empId: e.target.value.toUpperCase() }))}
                    placeholder="Emp ID (auto pattern by role)"
                  />
                  <Hash className="w-4 h-4 absolute left-3 top-3.5 opacity-60" />
                </div>
              </label>

              <label className="form-control">
                <span className="label-text">Phone</span>
                <input
                  className="input input-bordered"
                  value={edit.phone}
                  onChange={(e) => setEdit((p) => ({ ...p, phone: e.target.value }))}
                />
              </label>

              <label className="form-control">
                <span className="label-text">New password (optional, min 6)</span>
                <input
                  className="input input-bordered"
                  value={edit.password}
                  onChange={(e) => setEdit((p) => ({ ...p, password: e.target.value }))}
                  placeholder="Leave blank to keep current password"
                />
              </label>

              <button className={`btn btn-primary ${savingEdit ? 'btn-disabled' : ''}`} type="submit">
                {savingEdit && <span className="loading loading-spinner loading-sm mr-2" />}
                <Save className="w-4 h-4 mr-1" /> Save changes
              </button>
            </form>
          </div>
        )}

        {/* Create User */}
        {showCreate && (
          <div className="mt-6 rounded-2xl bg-base-100 p-6 shadow border border-base-200">
            <div className="flex items-center gap-2 mb-3">
              <UserPlus className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Create New User</h2>
            </div>

            <form onSubmit={onCreate} className="space-y-3">
              <label className="form-control">
                <span className="label-text">Full name</span>
                <input
                  className="input input-bordered"
                  placeholder="Full name"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  required
                />
              </label>

              <label className="form-control">
                <span className="label-text">Email (unique)</span>
                <input
                  type="email"
                  className="input input-bordered"
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  required
                />
              </label>

              <label className="form-control">
                <span className="label-text">Role</span>
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
              </label>

              <label className="form-control">
                <span className="label-text">Emp ID (auto if blank)</span>
                <div className="relative">
                  <input
                    className="input input-bordered w-full pl-9"
                    placeholder="e.g., W001, PM01"
                    value={form.empId}
                    onChange={(e) => setForm((p) => ({ ...p, empId: e.target.value.toUpperCase() }))}
                  />
                  <Hash className="w-4 h-4 absolute left-3 top-3.5 opacity-60" />
                </div>
              </label>

              <label className="form-control">
                <span className="label-text">Password (or leave blank)</span>
                <input
                  className="input input-bordered"
                  placeholder="Password (min 6 to set)"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                />
              </label>

              <label className="form-control">
                <span className="label-text">Phone</span>
                <input
                  className="input input-bordered"
                  placeholder="Phone"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                />
              </label>

              <button className={`btn btn-primary ${creating ? 'btn-disabled' : ''}`} type="submit">
                {creating && <span className="loading loading-spinner loading-sm mr-2" />}
                Create user
              </button>
            </form>

            {tempPw && (
              <div className="alert alert-success mt-4 items-center">
                <span>
                  Temporary password:&nbsp;
                  <code className="px-2 py-1 rounded bg-base-200">{tempPw}</code>
                </span>
                <button className="btn btn-sm" onClick={copyTemp}>
                  {justCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {justCopied ? 'Copied' : 'Copy'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Users Table */}
        <div className="mt-6 rounded-2xl bg-base-100 p-6 shadow border border-base-200">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Emp ID</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Phone</th>
                  <th>Created</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id || u.id}>
                    <td>{u.name}</td>
                    <td><code>{u.empId || '-'}</code></td>
                    <td>{u.email}</td>
                    <td className="capitalize">{(u.role || '').replace('_', ' ')}</td>
                    <td>{u.phone || '-'}</td>
                    <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <button className="btn btn-sm" onClick={() => openEdit(u)}>
                          <Pencil className="w-4 h-4 mr-1" /> Edit
                        </button>
                        <button className="btn btn-sm" onClick={() => resetPassword(u._id || u.id)}>
                          Reset PW
                        </button>
                        <button className="btn btn-sm btn-error" onClick={() => deleteUser(u._id || u.id)}>
                          <Trash2 className="w-4 h-4 mr-1" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && !listLoading && (
                  <tr>
                    <td colSpan={7} className="text-center text-base-content/60">No users found</td>
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
              <button className="btn join-item" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                Next »
              </button>
            </div>
          </div>

          {listLoading && <div className="mt-3 text-sm opacity-70">Loading…</div>}
        </div>

      </div>
    </div>
  );
}
