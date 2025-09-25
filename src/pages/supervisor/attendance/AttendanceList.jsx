import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Sweet, Toast } from '@/utils/sweet';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function AttendanceList() {
  const token = localStorage.getItem('token');
  const authHeader = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [limit] = useState(50);

  const load = async () => {
    try {
      setLoading(true);
      setErr('');
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (status) params.set('status', status);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      params.set('limit', String(limit));

      const { data } = await axios.get(`${API}/api/attendance?${params.toString()}`, { headers: authHeader });
      setRows(data.items || []);
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.message || 'Load failed';
      setErr(msg);
      Toast.fire({ icon: 'error', title: msg });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status, dateFrom, dateTo, limit]);

  const deleteRow = async (id) => {
    const first = await Sweet.fire({
      title: 'Delete this attendance record?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
    });
    if (!first.isConfirmed) return;

    const second = await Sweet.fire({
      title: 'Are you absolutely sure?',
      text: 'Deleting will permanently remove this record.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete permanently',
      cancelButtonText: 'No',
    });
    if (!second.isConfirmed) return;

    try {
      await axios.delete(`${API}/api/attendance/${id}`, { headers: authHeader });
      setRows((r) => r.filter((x) => x._id !== id));
      Toast.fire({ icon: 'success', title: 'Attendance record deleted' });
    } catch (e) {
      const msg = e?.response?.data?.message || 'Delete failed';
      console.error(e);
      Sweet.fire({ icon: 'error', title: 'Failed to delete', text: msg });
    }
  };

  // ---- ZERO-DEPENDENCY PDF (print) ----
  const exportPdf = () => {
    const w = window.open('', '_blank');
    if (!w) {
      Toast.fire({ icon: 'error', title: 'Please allow popups to export.' });
      return;
    }

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

    const rowsHtml = rows.map(r => `
      <tr>
        <td>${escapeHTML(r.date)}</td>
        <td>${escapeHTML(r.workerId)}</td>
        <td>${escapeHTML(r.workerName)}</td>
        <td>${escapeHTML(r.field)}</td>
        <td>${escapeHTML(r.checkInTime)}</td>
        <td>${escapeHTML(r.expectedOutTime || '-')}</td>
        <td>${escapeHTML(r.status)}</td>
        <td>${escapeHTML(r.notes)}</td>
      </tr>
    `).join('');

    const html = `
      <!doctype html><html><head><meta charset="utf-8">${style}</head><body>
        <div class="header">
          <div>
            <h1 class="title">CeylonLeaf</h1>
            <div class="meta">Attendance Report</div>
          </div>
          <div class="meta">
            Generated: ${now.toLocaleString()}<br/>
            ${q ? `Search: "${escapeHTML(q)}"<br/>` : ''}
            ${status ? `Status: ${escapeHTML(status)}<br/>` : ''}
            ${dateFrom ? `From: ${escapeHTML(dateFrom)}<br/>` : ''}
            ${dateTo ? `To: ${escapeHTML(dateTo)}` : ''}
          </div>
        </div>
        <hr class="hr"/>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>EmpID</th>
              <th>Name</th>
              <th>Field</th>
              <th>In</th>
              <th>Expected Out</th>
              <th>Status</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || `<tr><td colspan="8" style="text-align:center;color:#666;">No data</td></tr>`}
          </tbody>
        </table>
      </body></html>
    `;
    w.document.open(); w.document.write(html); w.document.close();
    w.onload = () => { w.focus(); w.print(); /* w.close(); */ };
    Toast.fire({ icon: 'success', title: 'Preparing print preview…' });
  };

  return (
    <div className="min-h-screen bg-base-200">
      <div className="mx-auto max-w-7xl p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h1 className="text-2xl md:text-3xl font-bold">Attendance</h1>
          <div className="flex gap-2">
            <Link className="btn btn-primary" to="/supervisor/attendance/new">New</Link>
            <Link className="btn" to="/supervisor/attendance/scan">Scan</Link>
            <button className="btn btn-outline" onClick={exportPdf} disabled={rows.length === 0}>Export PDF</button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3 bg-base-100 border rounded-xl p-4">
          <input
            className="input input-bordered"
            placeholder="Search EmpID / Name / Field"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select className="select select-bordered" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All status</option>
            <option value="present">present</option>
            <option value="absent">absent</option>
            <option value="leave">leave</option>
            <option value="late">late</option>
          </select>
          <input type="date" className="input input-bordered" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <input type="date" className="input input-bordered" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          <button className="btn" onClick={load} disabled={loading}>Apply</button>
        </div>

        {err && <div className="alert alert-error mt-4"><span>{err}</span></div>}

        <div className="mt-4 overflow-x-auto rounded-xl border bg-base-100">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>EmpID</th>
                <th>Name</th>
                <th>Field</th>
                <th>In</th>
                <th>Expected Out</th>
                <th>Status</th>
                <th style={{ width: 160 }} />
              </tr>
            </thead>
            <tbody>
              {loading && (<tr><td colSpan={8}>Loading…</td></tr>)}
              {!loading && rows.length === 0 && (<tr><td colSpan={8}>No records</td></tr>)}
              {rows.map((r) => (
                <tr key={r._id}>
                  <td>{r.date}</td>
                  <td>{r.workerId}</td>
                  <td>{r.workerName}</td>
                  <td>{r.field}</td>
                  <td>{r.checkInTime}</td>
                  <td>{r.expectedOutTime || '-'}</td>
                  <td className="capitalize">{r.status}</td>
                  <td className="text-right">
                    <Link className="btn btn-sm mr-2" to={`/supervisor/attendance/${r._id}`}>Edit</Link>
                    <button className="btn btn-sm btn-error" onClick={() => deleteRow(r._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
