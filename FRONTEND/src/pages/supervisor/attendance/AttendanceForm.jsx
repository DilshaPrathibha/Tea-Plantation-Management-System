import React, { useEffect, useMemo, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { Sweet } from '@/utils/sweet';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const empty = () => ({
  workerId: '',
  workerName: '',
  date: new Date().toISOString().slice(0, 10),
  checkInTime: '',
  expectedOutTime: '',
  field: '',
  status: 'present',
  notes: ''
});

export default function AttendanceForm() {
  const token = localStorage.getItem('token');
  const authHeader = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const navigate = useNavigate();
  const { id } = useParams();

  const [form, setForm] = useState(empty());
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [validation, setValidation] = useState('');

  // keep original expectedOutTime to detect changes
  const originalExpectedOutRef = useRef('');

  useEffect(() => {
    const load = async () => {
      if (!id) return; // this screen is used as Edit in your routes
      try {
        setLoading(true);
        const res = await axios.get(`${API}/api/attendance/${id}`, { headers: authHeader });
        const it = res.data.item;
        const next = {
          workerId: it.workerId || '',
          workerName: it.workerName || '',
          date: it.date || new Date().toISOString().slice(0, 10),
          checkInTime: it.checkInTime || '',
          expectedOutTime: it.expectedOutTime || '',
          field: it.field || '',
          status: it.status || 'present',
          notes: ''
        };
        setForm(next);
        originalExpectedOutRef.current = next.expectedOutTime || '';
      } catch (e) {
        console.error(e);
        const msg = e?.response?.data?.message || 'Failed to load record';
        setErr(msg);
        await Sweet.error(msg);
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const timeChanged = () =>
    (form.expectedOutTime || '') !== (originalExpectedOutRef.current || '');

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setValidation('');

    // Only expectedOutTime is editable; if changed, notes is required
    if (timeChanged()) {
      const reason = (form.notes || '').trim();
      if (reason.length < 3) {
        setValidation('Please provide a short reason in Notes for changing the expected out time.');
        await Sweet.info('Please add a short reason in Notes.');
        return;
      }
    }

    try {
      setLoading(true);

      const payload = {
        expectedOutTime: form.expectedOutTime || '',
        notes: form.notes || ''
      };

      await axios.put(`${API}/api/attendance/${id}`, payload, {
        headers: { ...authHeader, 'Content-Type': 'application/json' }
      });

      await Sweet.success('Attendance updated');
      navigate('/supervisor/attendance', { replace: true });
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.message || 'Save failed';
      setErr(msg);
      await Sweet.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl md:text-3xl font-bold">Edit Attendance</h1>

        {(err || validation) && (
          <div className={`alert ${err ? 'alert-error' : 'alert-warning'} mt-4`}>
            <span>{err || validation}</span>
          </div>
        )}

        <form className="mt-6 grid md:grid-cols-2 gap-4" onSubmit={onSubmit}>
          {/* READ-ONLY*/}
          <div className="md:col-span-1">
            <label className="label"><span className="label-text">Emp ID</span></label>
            <input className="input input-bordered w-full" value={form.workerId} disabled />
          </div>

          <div className="md:col-span-1">
            <label className="label"><span className="label-text">Worker Name</span></label>
            <input className="input input-bordered w-full" value={form.workerName} disabled />
          </div>

          <div className="md:col-span-1">
            <label className="label"><span className="label-text">Date</span></label>
            <input type="date" className="input input-bordered w-full" value={form.date} disabled />
          </div>

          <div className="md:col-span-1">
            <label className="label"><span className="label-text">Check-in</span></label>
            <input type="time" className="input input-bordered w-full" value={form.checkInTime} disabled />
          </div>

          <div className="md:col-span-1">
            <label className="label"><span className="label-text">Field</span></label>
            <input className="input input-bordered w-full" value={form.field} disabled />
          </div>

          <div className="md:col-span-1">
            <label className="label"><span className="label-text">Status</span></label>
            <input className="input input-bordered w-full capitalize" value={form.status} disabled />
          </div>

          {/* ONLY editable */}
          <div className="md:col-span-1">
            <label className="label">
              <span className="label-text">Expected check-out (HH:mm)</span>
            </label>
            <input
              type="time"
              className="input input-bordered w-full"
              value={form.expectedOutTime}
              onChange={(e) => setForm((p) => ({ ...p, expectedOutTime: e.target.value }))}
              required={false}
            />
            <div className="text-xs opacity-70 mt-1">
              Change only if the worker and supervisor agree on a new expected time.
            </div>
          </div>

          {/* Notes becomes required only if time was modified */}
          <div className="md:col-span-2">
            <label className="label">
              <span className="label-text">
                Notes {timeChanged() ? '(required when expected time is changed)' : '(optional)'}
              </span>
            </label>
            <textarea
              className="textarea textarea-bordered w-full"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Reason for editing expected out time"
              required={timeChanged()}
            />
          </div>

          <div className="md:col-span-2">
            <button className={`btn btn-primary ${loading ? 'btn-disabled' : ''}`} type="submit">
              {loading && <span className="loading loading-spinner loading-sm mr-2" />}
              Update
            </button>
            <button type="button" className="btn ml-2" onClick={() => navigate('/supervisor/attendance')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
