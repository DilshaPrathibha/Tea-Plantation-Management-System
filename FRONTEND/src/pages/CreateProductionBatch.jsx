import React, { useState, useEffect } from 'react';
import { getTodaysPluckingTotal } from '../utils/pluckingTotal';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Swal from 'sweetalert2';

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
  // const [fieldNames, setFieldNames] = useState([]); // No longer needed
  const [loading, setLoading] = useState(false);
  const [pluckingTotal, setPluckingTotal] = useState(0);
  const [varianceReason, setVarianceReason] = useState('');
  const [varianceNote, setVarianceNote] = useState('');
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  useEffect(() => {
    fetchSupervisors();
    generateBatchId();
    // Fetch today's plucking total
    const today = new Date().toISOString().split('T')[0];
    getTodaysPluckingTotal(API_URL, today).then(setPluckingTotal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSupervisors = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `${API_URL}/api/admin/users?role=field_supervisor&limit=50`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const users = res.data.items || res.data || [];
      setSupervisors(users);
    } catch (error) {
      console.error('Error fetching supervisors:', error);
    }
  };

  // const fetchFieldNames = async () => {}; // No longer needed

  const generateBatchId = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/production-batches`);
      const batches = res.data || [];

      let highestNumber = 0;
      batches.forEach((batch) => {
        if (batch.batchId && batch.batchId.startsWith('B')) {
          const numberPart = parseInt(batch.batchId.slice(1), 10);
          if (!isNaN(numberPart) && numberPart > highestNumber) {
            highestNumber = numberPart;
          }
        }
      });

      const newNumber = highestNumber + 1;
      const newBatchId = 'B' + newNumber.toString().padStart(4, '0');
      setFormData((prev) => ({ ...prev, batchId: newBatchId }));
    } catch (error) {
      console.error('Error generating batch ID:', error);
      const fallbackId = 'B' + Date.now().toString().slice(-4);
      setFormData((prev) => ({ ...prev, batchId: fallbackId }));
    }
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  // Field selection logic removed

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Check for variance
    if (Number(formData.teaWeight) !== pluckingTotal) {
      if (!varianceReason || !varianceNote) {
        Swal.fire('Error', 'Please provide a reason and note for the variance.', 'error');
        return;
      }
    }
    setLoading(true);
    try {
      // Debug: log formData before POST
      console.log('Submitting batch formData:', formData);
      await axios.post(`${API_URL}/api/production-batches`, {
        ...formData,
        pluckingDate: new Date(formData.pluckingDate),
        varianceReason: Number(formData.teaWeight) !== pluckingTotal ? varianceReason : undefined,
        varianceNote: Number(formData.teaWeight) !== pluckingTotal ? varianceNote : undefined,
        pluckingTotal
      });
      Swal.fire('Success', 'Batch created successfully', 'success');
      navigate('/production-batches');
    } catch (error) {
      Swal.fire('Error', 'Failed to create batch', 'error');
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

            <div className="form-control">
              <label className="label">Tea Weight (kg) (Production Manager)</label>
              <input
                type="number"
                name="teaWeight"
                value={formData.teaWeight}
                onChange={handleChange}
                className="input input-bordered"
                required
              />
              <div className="text-sm mt-2">
                <span className="font-semibold">Total Plucked Today (All Fields): </span>
                <span className="text-green-600 font-bold">{pluckingTotal} kg</span>
              </div>
            </div>

            {/* Variance reason/note if needed */}
            {Number(formData.teaWeight) !== pluckingTotal && (
              <div className="form-control border border-warning rounded p-3 bg-yellow-50">
                <label className="label font-semibold text-warning">Variance Detected</label>
                <label className="label">Reason for Variance</label>
                <select
                  className="select select-bordered"
                  value={varianceReason}
                  onChange={e => setVarianceReason(e.target.value)}
                  required
                >
                  <option value="">Select Reason</option>
                  <option value="Moisture Loss">Moisture Loss</option>
                  <option value="Spillage">Spillage</option>
                  <option value="Measurement Error">Measurement Error</option>
                  <option value="Other">Other</option>
                </select>
                <label className="label">Explanation</label>
                <textarea
                  className="textarea textarea-bordered"
                  value={varianceNote}
                  onChange={e => setVarianceNote(e.target.value)}
                  required
                  placeholder="Please explain the variance..."
                />
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
              rows="3"
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
