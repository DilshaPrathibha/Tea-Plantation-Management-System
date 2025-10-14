import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Swal from 'sweetalert2';

const fetchTodaysPluckingTotal = async (apiUrl, date) => {
  try {
    const token = localStorage.getItem('token');
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
    const { data } = await axios.get(`${apiUrl}/api/plucking-records?date=${date}`, config);
    const list = data?.items || data || [];
    const total = list.reduce((sum, rec) => sum + (Number(rec.totalWeight) || 0), 0);
    return Number(total.toFixed(2));
  } catch (error) {
    if (error?.response?.status === 401) {
      Swal.fire('Unauthorized', 'Please log in again to view plucking totals.', 'error');
    }
    return 0;
  }
};

const CreateProductionBatch = () => {
  const [formData, setFormData] = useState({
    batchId: '',
    pluckingDate: new Date().toISOString().split('T')[0],
    teaWeight: '',
    qualityGrade: 'Premium',
    supervisor: '',
    notes: '',
    status: 'pending',
  });

  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pluckingTotal, setPluckingTotal] = useState(0);
  const [varianceReason, setVarianceReason] = useState('');
  const [varianceNote, setVarianceNote] = useState('');
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  useEffect(() => {
    fetchSupervisors();
    generateBatchId();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const targetDate = formData.pluckingDate || new Date().toISOString().split('T')[0];
    fetchTodaysPluckingTotal(API_URL, targetDate).then(setPluckingTotal);
  }, [API_URL, formData.pluckingDate]);

  const fetchSupervisors = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `${API_URL}/api/admin/users?role=field_supervisor&limit=50`,
        token
          ? {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          : undefined
      );
      const users = res.data.items || res.data || [];
      setSupervisors(users);
    } catch (error) {
      console.error('Error fetching supervisors:', error);
    }
  };

  const generateBatchId = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/production-batches`);
      const batches = res.data || [];

      let highestNumber = 0;
      batches.forEach((batch) => {
        if (batch.batchId && batch.batchId.startsWith('B')) {
          const numberPart = parseInt(batch.batchId.slice(1), 10);
          if (!Number.isNaN(numberPart) && numberPart > highestNumber) {
            highestNumber = numberPart;
          }
        }
      });

      const newNumber = highestNumber + 1;
      const newBatchId = `B${newNumber.toString().padStart(4, '0')}`;
      setFormData((prev) => ({ ...prev, batchId: newBatchId }));
    } catch (error) {
      console.error('Error generating batch ID:', error);
      const fallbackId = `B${Date.now().toString().slice(-4)}`;
      setFormData((prev) => ({ ...prev, batchId: fallbackId }));
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const varianceRequired = (() => {
    const numeric = Number(formData.teaWeight);
    if (Number.isNaN(numeric)) return false;
    return numeric !== pluckingTotal;
  })();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (varianceRequired && (!varianceReason || !varianceNote.trim())) {
      Swal.fire('Provide Details', 'Please explain the variance between plucked and recorded tea weight.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/production-batches`,
        {
          ...formData,
          pluckingDate: new Date(formData.pluckingDate),
          varianceReason: varianceRequired ? varianceReason : '',
          varianceNote: varianceRequired ? varianceNote : '',
          pluckingTotal,
        },
        token
          ? {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          : undefined
      );
      Swal.fire('Success', 'Batch created successfully', 'success');
      navigate('/production-batches');
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to create batch';
      Swal.fire('Error', message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto p-4 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/production-batches')}
            className="btn btn-ghost btn-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-2xl font-bold">Create Production Batch</h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-base-100 p-6 rounded-lg shadow space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">Batch ID</label>
              <input
                type="text"
                name="batchId"
                value={formData.batchId}
                onChange={handleChange}
                className="input input-bordered bg-base-200"
                readOnly
                required
              />
            </div>

            <div className="form-control">
              <label className="label">Plucking Date</label>
              <input
                type="date"
                name="pluckingDate"
                value={formData.pluckingDate}
                onChange={handleChange}
                className="input input-bordered"
                required
                min={new Date().toISOString().split('T')[0]}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="form-control md:col-span-2">
              <label className="label">Tea Weight (kg) (Production Manager)</label>
              <input
                type="number"
                name="teaWeight"
                value={formData.teaWeight}
                onChange={handleChange}
                className="input input-bordered"
                required
                min="0"
                step="0.01"
              />
              <div className="text-sm mt-2">
                <span className="font-semibold">Total Plucked Today (All Fields): </span>
                <span className="text-green-500 font-bold">{pluckingTotal} kg</span>
              </div>
            </div>

            {varianceRequired && (
              <div className="form-control md:col-span-2 border border-warning/60 rounded-lg bg-warning/10 p-4 space-y-3">
                <label className="label font-semibold text-warning">Variance Detected</label>
                <div>
                  <label className="label pb-1">Reason for variance</label>
                  <select
                    className="select select-bordered w-full"
                    value={varianceReason}
                    onChange={(e) => setVarianceReason(e.target.value)}
                    required
                  >
                    <option value="">Select Reason</option>
                    <option value="Moisture Loss">Moisture Loss</option>
                    <option value="Spillage">Spillage</option>
                    <option value="Measurement Error">Measurement Error</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="label pb-1">Explanation</label>
                  <textarea
                    className="textarea textarea-bordered w-full"
                    value={varianceNote}
                    onChange={(e) => setVarianceNote(e.target.value)}
                    rows={3}
                    placeholder="Explain why the recorded weight differs from the total plucked weight."
                    required
                  />
                </div>
              </div>
            )}

            <div className="form-control">
              <label className="label">Quality Grade</label>
              <select
                name="qualityGrade"
                value={formData.qualityGrade}
                onChange={handleChange}
                className="select select-bordered"
                required
              >
                <option value="Premium">Premium</option>
                <option value="Standard">Standard</option>
                <option value="Economy">Economy</option>
              </select>
            </div>

            <div className="form-control">
              <label className="label">Supervisor</label>
              <select
                name="supervisor"
                value={formData.supervisor}
                onChange={handleChange}
                className="select select-bordered"
                required
              >
                <option value="">Select Supervisor</option>
                {supervisors.map((s) => (
                  <option key={s._id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-control">
            <label className="label">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="select select-bordered"
              required
            >
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="form-control">
            <label className="label">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="textarea textarea-bordered"
              rows={3}
              placeholder="Optional notes for production team..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/production-batches')}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Batch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProductionBatch;
