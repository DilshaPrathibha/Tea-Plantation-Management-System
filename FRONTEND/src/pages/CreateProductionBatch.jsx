import React, { useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const CreateProductionBatch = () => {
  const [formData, setFormData] = useState({
    fieldId: '',
    fieldName: '',
    pluckingDate: new Date().toISOString().split('T')[0],
    teaWeight: '',
    qualityGrade: 'Premium',
    supervisor: '',
    notes: '',
    status: 'pending'
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const API_URL = 'http://localhost:5001';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const batchId = 'PB' + Date.now();
      await axios.post(`${API_URL}/api/production-batches`, {
        ...formData,
        batchId
      });
      alert('Batch created successfully');
      navigate('/production-batches');
    } catch (error) {
      alert('Failed to create batch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />
      
      <div className="container mx-auto p-4 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/production-batches')} className="btn btn-ghost btn-sm">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-2xl font-bold">Create Production Batch</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-base-100 p-6 rounded-lg shadow space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">Field ID</label>
              <input
                type="text"
                name="fieldId"
                value={formData.fieldId}
                onChange={handleChange}
                className="input input-bordered"
                required
              />
            </div>

            <div className="form-control">
              <label className="label">Field Name</label>
              <input
                type="text"
                name="fieldName"
                value={formData.fieldName}
                onChange={handleChange}
                className="input input-bordered"
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
              <input
                type="text"
                name="supervisor"
                value={formData.supervisor}
                onChange={handleChange}
                className="input input-bordered"
                required
              />
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
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Batch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProductionBatch;