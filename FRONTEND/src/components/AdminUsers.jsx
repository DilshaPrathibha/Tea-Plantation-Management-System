import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  UserPlus, Users, Copy, Check, RefreshCw, Trash2, Hash,
  Pencil, Save, X as XIcon, Plus, Search, Download, ArrowUpAZ, ArrowDownAZ
} from 'lucide-react';
import { Sweet, Toast } from '@/utils/sweet';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const CEYLONLEAF_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
     fill="none" stroke="#22C55E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
  <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
</svg>
`;

const svgToPngDataUrl = (svgMarkup, targetPx = 28) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      const scale = targetPx / (img.width || 28);
      const w = Math.max(1, Math.round((img.width || 28) * scale));
      const h = Math.max(1, Math.round((img.height || 28) * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      try {
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = reject;
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgMarkup);
  });

const defaultCreate = {
  name: '', email: '', role: '', password: '', empId: '',
  phone: ''
};
const defaultEdit = {
  id: '', name: '', email: '', role: '', empId: '',
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
  
  // validation
  const [validationErrors, setValidationErrors] = useState({});
  const [editValidationErrors, setEditValidationErrors] = useState({});

  const formatRole = (role = '') =>
    role
      .toString()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (ch) => ch.toUpperCase());

  // Validation functions
  const validateForm = () => {
    const errors = {};
    
    // Full name validation - no special characters or numbers
    if (!form.name.trim()) {
      errors.name = 'Full name is required';
    } else if (!/^[a-zA-Z\s]+$/.test(form.name.trim())) {
      errors.name = 'Full name cannot contain special characters or numbers';
    }
    
    // Email validation - must contain @ symbol
    if (!form.email.trim()) {
      errors.email = 'Email is required';
    } else if (!form.email.includes('@')) {
      errors.email = 'Email must contain @ symbol';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }
    
    // Role validation - must be selected
    if (!form.role) {
      errors.role = 'Role must be selected';
    }
    
    // Password validation - if provided, must be strong (min 6 chars, at least one letter and one number)
    if (form.password && form.password.length > 0) {
      if (form.password.length < 6) {
        errors.password = 'Password must be at least 6 characters long';
      } else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(form.password)) {
        errors.password = 'Password must contain at least one letter and one number';
      }
    }
    
    // Phone validation - must be exactly 10 digits
    if (form.phone && form.phone.trim()) {
      const phoneDigits = form.phone.replace(/\D/g, ''); // Remove non-digits
      if (phoneDigits.length !== 10) {
        errors.phone = 'Phone number must be exactly 10 digits';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Edit form validation function
  const validateEditForm = () => {
    const errors = {};
    
    // Full name validation - no special characters or numbers
    if (!edit.name.trim()) {
      errors.name = 'Full name is required';
    } else if (!/^[a-zA-Z\s]+$/.test(edit.name.trim())) {
      errors.name = 'Full name cannot contain special characters or numbers';
    }
    
    // Email validation - must contain @ symbol
    if (!edit.email.trim()) {
      errors.email = 'Email is required';
    } else if (!edit.email.includes('@')) {
      errors.email = 'Email must contain @ symbol';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(edit.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }
    
    // Role validation - must be selected
    if (!edit.role) {
      errors.role = 'Role must be selected';
    }
    
    // Password validation - if provided, must be strong (min 6 chars, at least one letter and one number)
    if (edit.password && edit.password.length > 0) {
      if (edit.password.length < 6) {
        errors.password = 'Password must be at least 6 characters long';
      } else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(edit.password)) {
        errors.password = 'Password must contain at least one letter and one number';
      }
    }
    
    // Phone validation - must be exactly 10 digits
    if (edit.phone && edit.phone.trim()) {
      const phoneDigits = edit.phone.replace(/\D/g, ''); // Remove non-digits
      if (phoneDigits.length !== 10) {
        errors.phone = 'Phone number must be exactly 10 digits';
      }
    }
    
    setEditValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const roleBreakdown = users.reduce(
    (acc, user) => {
      const key = (user.role || 'other').toLowerCase();
      if (acc[key] === undefined) acc.other += 1;
      else acc[key] += 1;
      return acc;
    },
    {
      admin: 0,
      field_supervisor: 0,
      production_manager: 0,
      inventory_manager: 0,
      worker: 0,
      other: 0,
    }
  );
  const totalUsersCount = users.length;

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
    setValidationErrors({});
    
    // Validate form before submission
    if (!validateForm()) {
      Toast.error('Please fix the validation errors before submitting');
      return;
    }
    
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
      role: u.role || '',
      empId: u.empId || '',
      phone: u.phone || '',
      password: ''
    });
    setEditValidationErrors({}); // Clear any previous validation errors
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
    setError('');
    setEditValidationErrors({});
    
    // Validate form before submission
    if (!validateEditForm()) {
      Toast.error('Please fix the validation errors before submitting');
      return;
    }
    
    setSavingEdit(true);
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

  const exportPdf = async () => {
    try {
      const fetchLimit = 200;
      let aggregatedUsers = [];
      let totalAvailable = 0;
      let exportPage = 1;

      while (true) {
        const params = new URLSearchParams();
        params.set('page', String(exportPage));
        params.set('limit', String(fetchLimit));
        if (q.trim()) params.set('q', q.trim());
        if (sortBy) params.set('sortBy', sortBy);
        if (sortDir) params.set('sortDir', sortDir);

        const res = await axios.get(`${API}/api/admin/users?${params.toString()}`, { headers: authHeader });
        const items = Array.isArray(res.data?.items) ? res.data.items : [];
        aggregatedUsers = aggregatedUsers.concat(items);
        totalAvailable = res.data?.total ?? aggregatedUsers.length;

        if (items.length < fetchLimit || aggregatedUsers.length >= totalAvailable) {
          break;
        }
        exportPage += 1;
        if (exportPage > 500) break;
      }

      if (!aggregatedUsers.length) {
        Toast.error('No users to export');
        return;
      }

      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginX = 48;
      const marginY = 42;

      const logoDataUrl = await svgToPngDataUrl(CEYLONLEAF_SVG, 30);
      const generatedAt = new Date();
      const totalUsersCount = totalAvailable || aggregatedUsers.length;

      const renderHeader = () => {
        const brandBaseline = marginY + 18;
        const logoSize = 28;
        if (logoDataUrl) {
          doc.addImage(logoDataUrl, 'PNG', marginX, marginY - 6, logoSize, logoSize);
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.setTextColor(34, 197, 94);
        doc.text('CeylonLeaf', marginX + logoSize + 8, brandBaseline);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105);
        doc.text(`Generated on ${generatedAt.toLocaleString()}`, pageWidth - marginX, marginY, { align: 'right' });
        doc.text(`Exported ${aggregatedUsers.length} of ${totalUsersCount} users`, pageWidth - marginX, marginY + 12, { align: 'right' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(17, 24, 39);
        doc.text('User Directory', pageWidth / 2, marginY + 32, { align: 'center' });
      };

      const renderFooter = (pageNumber) => {
        const footerTop = pageHeight - 72;
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.line(marginX, footerTop, pageWidth - marginX, footerTop);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(34, 197, 94);
        doc.text('CeylonLeaf Plantations', pageWidth / 2, footerTop + 18, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text('No. 123, Tea Estate Road, Nuwara Eliya, Sri Lanka', pageWidth / 2, footerTop + 32, { align: 'center' });
        doc.text('Cultivating excellence in every leaf.', pageWidth / 2, footerTop + 46, { align: 'center' });

        doc.setFontSize(8);
        doc.text(`Page ${pageNumber}`, pageWidth - marginX, footerTop + 46, { align: 'right' });
      };

      renderHeader();

      const pdfRoleBreakdown = aggregatedUsers.reduce(
        (acc, user) => {
          const key = (user.role || 'other').toLowerCase();
          if (acc[key] === undefined) acc.other += 1;
          else acc[key] += 1;
          return acc;
        },
        {
          admin: 0,
          field_supervisor: 0,
          production_manager: 0,
          inventory_manager: 0,
          worker: 0,
          other: 0,
        }
      );

      autoTable(doc, {
        body: [[
          { content: `Total Users: ${totalUsersCount}`, styles: { textColor: [30, 41, 59], fontStyle: 'bold' } },
          { content: `Admins: ${pdfRoleBreakdown.admin}`, styles: { textColor: [59, 130, 246], fontStyle: 'bold' } },
          { content: `Supervisors: ${pdfRoleBreakdown.field_supervisor}`, styles: { textColor: [249, 115, 22], fontStyle: 'bold' } },
          { content: `Inventory: ${pdfRoleBreakdown.inventory_manager}`, styles: { textColor: [16, 185, 129], fontStyle: 'bold' } },
          { content: `Production: ${pdfRoleBreakdown.production_manager}`, styles: { textColor: [107, 114, 128], fontStyle: 'bold' } },
          { content: `Workers: ${pdfRoleBreakdown.worker}`, styles: { textColor: [34, 197, 94], fontStyle: 'bold' } }
        ]],
        theme: 'plain',
        styles: { fontSize: 11 },
        margin: { left: marginX, right: marginX },
        startY: marginY + 46,
      });

      let tableStartY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : marginY + 66;

      const activeFilters = [];
      if (q) activeFilters.push(`Search: "${q}"`);
      activeFilters.push(`Sort: ${SORT_FIELDS.find((s) => s.value === sortBy)?.label || 'Created'} (${sortDir.toUpperCase()})`);

      if (activeFilters.length) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(10);
        doc.setTextColor(94, 104, 118);
        doc.text(`Filters - ${activeFilters.join(' | ')}`, marginX, tableStartY);
        tableStartY += 16;
      }

      const roleColors = {
        admin: [59, 130, 246],
        field_supervisor: [249, 115, 22],
        production_manager: [107, 114, 128],
        inventory_manager: [16, 185, 129],
        worker: [34, 197, 94],
      };

      const body = aggregatedUsers.map((u) => {
        const roleKey = (u.role || 'other').toLowerCase();
        return [
          u.name || '-',
          u.empId || '-',
          u.email || '-',
          { content: formatRole(u.role || '-'), roleKey },
          u.phone || '-',
          u.createdAt ? new Date(u.createdAt).toLocaleString() : '-',
        ];
      });

      autoTable(doc, {
        head: [['Name', 'Employee ID', 'Email', 'Role', 'Phone', 'Created']],
        body: body.length ? body : [['-', '-', '-', { content: '-', roleKey: 'other' }, '-', '-']],
        startY: tableStartY,
        margin: { top: marginY + 60, left: marginX, right: marginX, bottom: 90 },
        styles: { fontSize: 10, cellPadding: 6, lineWidth: 0.2, lineColor: [226, 232, 240] },
        headStyles: { fillColor: [34, 197, 94], textColor: [17, 24, 39], fontSize: 11, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: { 2: { cellWidth: 190 } },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 3) {
            const roleKey = typeof data.cell.raw === 'object' ? data.cell.raw.roleKey : 'other';
            const color = roleColors[roleKey] || [30, 41, 59];
            data.cell.styles.textColor = color;
            data.cell.styles.fontStyle = 'bold';
            data.cell.text = [typeof data.cell.raw === 'object' ? data.cell.raw.content : data.cell.raw];
          }
        },
        didDrawPage: (data) => {
          renderHeader();
          renderFooter(data.pageNumber);
        },
      });

      const blobUrl = doc.output('bloburl');
      window.open(blobUrl, '_blank');
      Toast.success('User report ready');
    } catch (error) {
      console.error('[users pdf] error', error);
      Toast.error('Failed to generate PDF');
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      <div className="mx-auto max-w-6xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold">Admin - Users</h1>
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
              placeholder="Search name, email, role, empId, phone..."
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
                  className={`input input-bordered ${editValidationErrors.name ? 'input-error' : ''}`}
                  value={edit.name}
                  onChange={(e) => {
                    setEdit((p) => ({ ...p, name: e.target.value }));
                    // Clear validation error when user starts typing
                    if (editValidationErrors.name) {
                      setEditValidationErrors(prev => ({ ...prev, name: undefined }));
                    }
                  }}
                  required
                />
                {editValidationErrors.name && (
                  <div className="label">
                    <span className="label-text-alt text-error">{editValidationErrors.name}</span>
                  </div>
                )}
              </label>

              <label className="form-control">
                <span className="label-text">Email</span>
                <input
                  type="email"
                  className={`input input-bordered ${editValidationErrors.email ? 'input-error' : ''}`}
                  value={edit.email}
                  onChange={(e) => {
                    setEdit((p) => ({ ...p, email: e.target.value }));
                    // Clear validation error when user starts typing
                    if (editValidationErrors.email) {
                      setEditValidationErrors(prev => ({ ...prev, email: undefined }));
                    }
                  }}
                  required
                />
                {editValidationErrors.email && (
                  <div className="label">
                    <span className="label-text-alt text-error">{editValidationErrors.email}</span>
                  </div>
                )}
              </label>

              <label className="form-control">
                <span className="label-text">Role</span>
                <select
                  className={`select select-bordered ${editValidationErrors.role ? 'select-error' : ''}`}
                  value={edit.role}
                  onChange={(e) => {
                    setEdit((p) => ({ ...p, role: e.target.value }));
                    // Clear validation error when user selects a role
                    if (editValidationErrors.role) {
                      setEditValidationErrors(prev => ({ ...prev, role: undefined }));
                    }
                  }}
                >
                  <option value="">Select a role</option>
                  <option value="worker">Worker</option>
                  <option value="production_manager">Production Manager</option>
                  <option value="inventory_manager">Inventory Manager</option>
                  <option value="field_supervisor">Field Supervisor</option>
                  <option value="admin">Admin</option>
                </select>
                {editValidationErrors.role && (
                  <div className="label">
                    <span className="label-text-alt text-error">{editValidationErrors.role}</span>
                  </div>
                )}
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
                  className={`input input-bordered ${editValidationErrors.phone ? 'input-error' : ''}`}
                  placeholder="Phone (10 digits)"
                  value={edit.phone}
                  onChange={(e) => {
                    // Only allow digits and limit to 10 characters
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setEdit((p) => ({ ...p, phone: value }));
                    // Clear validation error when user starts typing
                    if (editValidationErrors.phone) {
                      setEditValidationErrors(prev => ({ ...prev, phone: undefined }));
                    }
                  }}
                />
                {editValidationErrors.phone && (
                  <div className="label">
                    <span className="label-text-alt text-error">{editValidationErrors.phone}</span>
                  </div>
                )}
              </label>

              <label className="form-control">
                <span className="label-text">New password (optional, min 6)</span>
                <input
                  className={`input input-bordered ${editValidationErrors.password ? 'input-error' : ''}`}
                  value={edit.password}
                  onChange={(e) => {
                    setEdit((p) => ({ ...p, password: e.target.value }));
                    // Clear validation error when user starts typing
                    if (editValidationErrors.password) {
                      setEditValidationErrors(prev => ({ ...prev, password: undefined }));
                    }
                  }}
                  placeholder="Leave blank to keep current password"
                />
                {editValidationErrors.password && (
                  <div className="label">
                    <span className="label-text-alt text-error">{editValidationErrors.password}</span>
                  </div>
                )}
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
                  className={`input input-bordered ${validationErrors.name ? 'input-error' : ''}`}
                  placeholder="Full name"
                  value={form.name}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, name: e.target.value }));
                    // Clear validation error when user starts typing
                    if (validationErrors.name) {
                      setValidationErrors(prev => ({ ...prev, name: undefined }));
                    }
                  }}
                  required
                />
                {validationErrors.name && (
                  <div className="label">
                    <span className="label-text-alt text-error">{validationErrors.name}</span>
                  </div>
                )}
              </label>

              <label className="form-control">
                <span className="label-text">Email (unique)</span>
                <input
                  type="email"
                  className={`input input-bordered ${validationErrors.email ? 'input-error' : ''}`}
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, email: e.target.value }));
                    // Clear validation error when user starts typing
                    if (validationErrors.email) {
                      setValidationErrors(prev => ({ ...prev, email: undefined }));
                    }
                  }}
                  required
                />
                {validationErrors.email && (
                  <div className="label">
                    <span className="label-text-alt text-error">{validationErrors.email}</span>
                  </div>
                )}
              </label>

              <label className="form-control">
                <span className="label-text">Role</span>
                <select
                  className={`select select-bordered ${validationErrors.role ? 'select-error' : ''}`}
                  value={form.role}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, role: e.target.value }));
                    // Clear validation error when user selects a role
                    if (validationErrors.role) {
                      setValidationErrors(prev => ({ ...prev, role: undefined }));
                    }
                  }}
                >
                  <option value="">Select a role</option>
                  <option value="worker">Worker</option>
                  <option value="production_manager">Production Manager</option>
                  <option value="inventory_manager">Inventory Manager</option>
                  <option value="field_supervisor">Field Supervisor</option>
                  <option value="admin">Admin</option>
                </select>
                {validationErrors.role && (
                  <div className="label">
                    <span className="label-text-alt text-error">{validationErrors.role}</span>
                  </div>
                )}
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
                  className={`input input-bordered ${validationErrors.password ? 'input-error' : ''}`}
                  placeholder="Password (min 6 to set)"
                  value={form.password}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, password: e.target.value }));
                    // Clear validation error when user starts typing
                    if (validationErrors.password) {
                      setValidationErrors(prev => ({ ...prev, password: undefined }));
                    }
                  }}
                />
                {validationErrors.password && (
                  <div className="label">
                    <span className="label-text-alt text-error">{validationErrors.password}</span>
                  </div>
                )}
              </label>

              <label className="form-control">
                <span className="label-text">Phone</span>
                <input
                  className={`input input-bordered ${validationErrors.phone ? 'input-error' : ''}`}
                  placeholder="Phone (10 digits)"
                  value={form.phone}
                  onChange={(e) => {
                    // Only allow digits and limit to 10 characters
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setForm((p) => ({ ...p, phone: value }));
                    // Clear validation error when user starts typing
                    if (validationErrors.phone) {
                      setValidationErrors(prev => ({ ...prev, phone: undefined }));
                    }
                  }}
                />
                {validationErrors.phone && (
                  <div className="label">
                    <span className="label-text-alt text-error">{validationErrors.phone}</span>
                  </div>
                )}
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
              Page {page} of {totalPages} | {total} total
            </div>
            <div className="join">
              <button className="btn join-item" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                &lt; Prev
              </button>
              <button className="btn join-item" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                Next &gt;
              </button>
            </div>
          </div>

          {listLoading && <div className="mt-3 text-sm opacity-70">Loading...</div>}
        </div>

      </div>
    </div>
  );
}
