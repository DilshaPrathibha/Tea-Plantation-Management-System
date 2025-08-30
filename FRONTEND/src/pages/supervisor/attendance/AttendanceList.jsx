// FRONTEND/src/pages/supervisor/attendance/AttendanceList.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function AttendanceList() {
  const token = localStorage.getItem('token');
  const authHeader = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const limit = 10;

  const [filters, setFilters] = useState({ date: '', workerId: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit });
      if (filters.date) params.append('date', filters.date);
      if (filters.workerId) params.append('workerId', filters.workerId.trim());

      const res = await axios.get(`${API}/api/attendance?${params.toString()}`, { headers: authHeader });
      setItems(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, [page]);

  const totalPages = Math.max(Math.ceil(total / limit), 1);

  const onDelete = async (id) => {
    if (!confirm('Delete this record?')) return;
    try {
      await axios.delete(`${API}/api/attendance/${id}`, { headers: authHeader });
      fetchData();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      <div className="mx-auto max-w-6xl p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold">Attendance</h1>
          <div className="flex gap-2">
            <Link to="/supervisor/attendance/scan" className="btn">QR Scan</Link>
            <Link to="/supervisor/attendance/new" className="btn btn-primary">+ New</Link>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 items-end">
          <div>
            <label className="label"><span className="label-text">Date</span></label>
            <input type="date" className="input input-bordered" value={filters.date} onChange={e => setFilters(p => ({ ...p, date: e.target.value }))} />
          </div>
          <div>
            <label className="label"><span className="label-text">Worker ID</span></label>
            <input type="text" className="input input-bordered" value={filters.workerId} onChange={e => setFilters(p => ({ ...p, workerId: e.target.value }))} />
          </div>
          <button className="btn" onClick={() => { setPage(1); fetchData(); }} disabled={loading}>Filter</button>
        </div>

        <div className="mt-6 rounded-2xl bg-base-100 p-4 shadow border">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Worker</th>
                  <th>Date</th>
                  <th>In</th>
                  <th>Out</th>
                  <th>Field</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r._id}>
                    <td>
                      <div className="font-medium">{r.workerName || '-'}</div>
                      <div className="text-xs opacity-70">{r.workerId}</div>
                    </td>
                    <td>{r.date}</td>
                    <td>{r.checkInTime || '-'}</td>
                    <td>{r.checkOutTime || '-'}</td>
                    <td>{r.field || '-'}</td>
                    <td className="capitalize">{r.status || '-'}</td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <Link to={`/supervisor/attendance/${r._id}/edit`} className="btn btn-sm">Edit</Link>
                        <button className="btn btn-sm btn-error" onClick={() => onDelete(r._id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && !loading && (
                  <tr><td colSpan={7} className="text-center opacity-60">No records</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm opacity-70">Page {page} of {totalPages} • {total} total</div>
            <div className="join">
              <button className="btn join-item" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>« Prev</button>
              <button className="btn join-item" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next »</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
