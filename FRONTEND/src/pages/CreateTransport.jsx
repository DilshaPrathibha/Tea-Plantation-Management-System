import React, { useState, useEffect } from 'react';
import { getActiveDrivers } from '../utils/activeDrivers';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Swal from 'sweetalert2';

const CreateTransport = () => {
  const [formData, setFormData] = useState({
    vehicleId: '',
    vehicleType: '',
    driverName: '',
    batchId: '',
    destination: '',
    departureTime: new Date().toISOString().slice(0, 16),
    estimatedArrival: '',
    status: 'scheduled',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [batchIds, setBatchIds] = useState([]);
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  const driverNames = [
    'Kalum Perera',
    'Manel Kumara',
    'Nimal Fernando',
    'Kamal Silva',
    'Sunil Rajapaksa'
  ];

  const [activeDrivers, setActiveDrivers] = useState([]);

  useEffect(() => {
    getActiveDrivers(API_URL).then(setActiveDrivers);
  }, [API_URL]);

  const vehicleTypes = [
    'Van',
    'Lorry',
    'Truck',
    'Container'
  ];

  useEffect(() => {
    generateVehicleId();
    fetchBatchIds();
  }, []);

  const generateVehicleId = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/transports`);
      const transports = response.data;
      
      let highestNumber = 0;
      transports.forEach(transport => {
        if (transport.vehicleId && transport.vehicleId.startsWith('V')) {
          const numberPart = parseInt(transport.vehicleId.slice(1), 10);
          if (!isNaN(numberPart) && numberPart > highestNumber) {
            highestNumber = numberPart;
          }
        }
      });
      
      const newNumber = highestNumber + 1;
      const newVehicleId = 'V' + newNumber.toString().padStart(3, '0');
      
      setFormData(prev => ({ ...prev, vehicleId: newVehicleId }));
    } catch (error) {
      console.error('Error generating vehicle ID:', error);
      const randomId = 'V' + Math.floor(100 + Math.random() * 900);
      setFormData(prev => ({ ...prev, vehicleId: randomId }));
    }
  };

  const fetchBatchIds = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/production-batches`);
      const batches = response.data;
      
      const uniqueBatchIds = [...new Set(batches.map(batch => batch.batchId))];
      setBatchIds(uniqueBatchIds);
    } catch (error) {
      console.error('Error fetching batch IDs:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');

      await axios.post(`${API_URL}/api/transports`, formData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
      Swal.fire('Success', 'Transport created successfully', 'success');
      navigate('/transports');
    } catch (error) {
      Swal.fire('Error', 'Failed to create transport', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
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
                className="input input-bordered bg-base-200"
                readOnly
                required
              />
            </div>

            <div className="form-control">
              <label className="label">Vehicle Type</label>
              <select
                name="vehicleType"
                value={formData.vehicleType}
                onChange={handleChange}
                className="select select-bordered"
                required
              >
                <option value="">Select Vehicle Type</option>
                {vehicleTypes.map((type, index) => (
                  <option key={index} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-control">
              <label className="label">Driver Name</label>
              <select
                name="driverName"
                value={formData.driverName}
                onChange={handleChange}
                className="select select-bordered"
                required
              >
                <option value="">Select Driver</option>
                {driverNames.map((name, index) => (
                  <option
                    key={index}
                    value={name}
                    disabled={activeDrivers.includes(name)}
                    style={activeDrivers.includes(name) ? { color: '#a3a3a3' } : {}}
                  >
                    {name}
                    {activeDrivers.includes(name) ? ' (Unavailable)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-control">
              <label className="label">Batch ID</label>
              <select
                name="batchId"
                value={formData.batchId}
                onChange={handleChange}
                className="select select-bordered"
                required
              >
                <option value="">Select Batch ID</option>
                {batchIds.map((batchId, index) => (
                  <option key={index} value={batchId}>
                    {batchId}
                  </option>
                ))}
              </select>
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