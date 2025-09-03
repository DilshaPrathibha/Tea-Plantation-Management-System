import React, { useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const CreateTransport = () => {
  const [formData, setFormData] = useState({
    vehicleId: '',
    driverName: '',
    batchId: '',
    destination: '',
    departureTime: new Date().toISOString().slice(0, 16),
    estimatedArrival: '',
    status: 'scheduled',
    notes: ''
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
      await axios.post(`${API_URL}/api/transports`, formData);
      alert('Transport created successfully');
      navigate('/transports');
    } catch (error) {
      alert('Failed to create transport');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />
      
      <div className="container mx-auto p-4 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/transports')} className="btn btn-ghost btn-sm">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-2xl font-bold">Create Transport</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-base-100 p-6 rounded-lg shadow space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">Vehicle ID</label>
              <input
                type="text"
                name="vehicleId"
                value={formData.vehicleId}
                onChange={handleChange}
                className="input input-bordered"
                required
              />
            </div>

            <div className="form-control">
              <label className="label">Driver Name</label>
              <input
                type="text"
                name="driverName"
                value={formData.driverName}
                onChange={handleChange}
                className="input input-bordered"
                required
              />
            </div>

            <div className="form-control">
              <label className="label">Batch ID</label>
              <input
                type="text"
                name="batchId"
                value={formData.batchId}
                onChange={handleChange}
                className="input input-bordered"
                required
              />
            </div>

            <div className="form-control">
              <label className="label">Destination</label>
              <input
                type="text"
                name="destination"
                value={formData.destination}
                onChange={handleChange}
                className="input input-bordered"
                required
              />
            </div>

            <div className="form-control">
              <label className="label">Departure Time</label>
              <input
                type="datetime-local"
                name="departureTime"
                value={formData.departureTime}
                onChange={handleChange}
                className="input input-bordered"
                required
              />
            </div>

            <div className="form-control">
              <label className="label">Estimated Arrival</label>
              <input
                type="datetime-local"
                name="estimatedArrival"
                value={formData.estimatedArrival}
                onChange={handleChange}
                className="input input-bordered"
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
              <option value="scheduled">Scheduled</option>
              <option value="in-transit">In Transit</option>
              <option value="delivered">Delivered</option>
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
              onClick={() => navigate('/transports')}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Transport'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTransport;