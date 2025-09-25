import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Swal from 'sweetalert2';

const EditProductionBatch = () => {
  const [formData, setFormData] = useState({
    batchId: '',
    fieldId: '',
    pluckingDate: '',
    teaWeight: '',
    qualityGrade: 'Premium',
    supervisor: '',
    notes: '',
    status: 'pending',
  });

  const [supervisors, setSupervisors] = useState([]);
  const [fieldNames, setFieldNames] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  useEffect(() => {
    getBatchData();
    fetchSupervisors();
    fetchFieldNames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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

  const fetchFieldNames = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/fields`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      setFieldNames(res.data.items || res.data || []);
    } catch (error) {
      console.error('Error fetching field names:', error);
    }
  };

  const getBatchData = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/production-batches/${id}`);
      const batch = res.data;
      setFormData({
        batchId: batch.batchId,
        fieldName: batch.fieldName,
        fieldId: batch.fieldId,
        pluckingDate: batch.pluckingDate
          ? new Date(batch.pluckingDate).toISOString().split('T')[0]
          : '',
        teaWeight: batch.teaWeight,
        qualityGrade: batch.qualityGrade,
        supervisor: batch.supervisor,
        notes: batch.notes || '',
        status: batch.status,
      });
    } catch (error) {
      Swal.fire('Error', 'Cannot load batch data', 'error');
      navigate('/production-batches');
    }
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  // keep if you later show a "Field" select
  const handleFieldChange = (e) => {
    const selectedId = e.target.value;
    const selectedField = fieldNames.find((f) => f._id === selectedId);
    setFormData((prev) => ({
      ...prev,
      fieldName: selectedField ? selectedField.name : '',
      fieldId: selectedId,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(`${API_URL}/api/production-batches/${id}`, formData);
      Swal.fire('Success', 'Batch updated successfully', 'success');
      navigate('/production-batches');
    } catch (error) {
      Swal.fire('Error', 'Cannot update batch', 'error');
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
          <h1 className="text-2xl font-bold">Edit Production Batch</h1>
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
              />
            </div>

            <div className="form-control">
              <label className="label">Tea Weight (kg)</label>
              <input
                type="number"
                name="teaWeight"
                value={formData.teaWeight}
                onChange={handleChange}
                className="input input-bordered"
                required
              />
            </div>

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
              {loading ? 'Updating...' : 'Update Batch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProductionBatch;
