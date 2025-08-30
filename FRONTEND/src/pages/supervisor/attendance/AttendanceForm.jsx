// FRONTEND/src/pages/supervisor/attendance/AttendanceForm.jsx
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const empty = () => ({
  workerId: '',
  workerName: '',
  date: new Date().toISOString().slice(0, 10),
  checkInTime: '',
  checkOutTime: '',
  field: '',
  status: 'present',
  notes: ''
});

export default function AttendanceForm() {
  const token = localStorage.getItem('token');
  const authHeader = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const navigate = useNavigate();
  const { id } = useParams(); // present when editing

  const [form, setForm] = useState(empty());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const res = await axios.get(`${API}/api/attendance/${id}`, { headers: authHeader });
        setForm({
          workerId: res.data.item.workerId || '',
          workerName: res.data.item.workerName || '',
          date: res.data.item.date || new Date().toISOString().slice(0,10),
          checkInTime: res.data.item.checkInTime || '',
          checkOutTime: res.data.item.checkOutTime || '',
          field: res.data.item.field || '',
          status: res.data.item.status || 'present',
          notes: res.data.item.notes || ''
        });
      } catch (e) {
        console.error(e);
        alert(e?.response?.data?.message || 'Failed to load record');
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (id) {
        await axios.put(`${API}/api/attendance/${id}`, form, { headers: authHeader });
      } else {
        await axios.post(`${API}/api/attendance`, form, { headers: authHeader });
      }
      navigate('/supervisor/attendance');
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl md:text-3xl font-bold">{id ? 'Edit' : 'New'} Attendance</h1>

        <form className="mt-6 grid md:grid-cols-2 gap-4" onSubmit={onSubmit}>
          <input className="input input-bordered" placeholder="Worker ID *" required
                 value={form.workerId} onChange={e => setForm(p => ({ ...p, workerId: e.target.value }))} />
          <input className="input input-bordered" placeholder="Worker Name"
                 value={form.workerName} onChange={e => setForm(p => ({ ...p, workerName: e.target.value }))} />

          <div>
            <label className="label"><span className="label-text">Date *</span></label>
            <input type="date" className="input input-bordered w-full" required
                   value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
          </div>

          <div>
            <label className="label"><span className="label-text">Check-in</span></label>
            <input type="time" className="input input-bordered w-full"
                   value={form.checkInTime} onChange={e => setForm(p => ({ ...p, checkInTime: e.target.value }))} />
          </div>

          <div>
            <label className="label"><span className="label-text">Check-out</span></label>
            <input type="time" className="input input-bordered w-full"
                   value={form.checkOutTime} onChange={e => setForm(p => ({ ...p, checkOutTime: e.target.value }))} />
          </div>

          <input className="input input-bordered" placeholder="Field / Section"
                 value={form.field} onChange={e => setForm(p => ({ ...p, field: e.target.value }))} />

          <select className="select select-bordered" value={form.status}
                  onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
            <option value="present">present</option>
            <option value="absent">absent</option>
            <option value="leave">leave</option>
          </select>

          <div className="md:col-span-2">
            <textarea className="textarea textarea-bordered w-full" rows={3}
                      placeholder="Notes"
                      value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </div>

          <div className="md:col-span-2">
            <button className={`btn btn-primary ${loading ? 'btn-disabled' : ''}`} type="submit">
              {loading && <span className="loading loading-spinner loading-sm mr-2" />}
              {id ? 'Update' : 'Create'}
            </button>
            <button type="button" className="btn ml-2" onClick={() => navigate('/supervisor/attendance')}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
