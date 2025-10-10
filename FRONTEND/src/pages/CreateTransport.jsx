import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Swal from 'sweetalert2';

const toDatetimeLocal = (date) => {
  if (!date) return '';
  const pad = (n) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hour}:${minute}`;
};

const fetchActiveDrivers = async (apiUrl) => {
  try {
    const { data } = await axios.get(`${apiUrl}/api/transports`);
    return (data || [])
      .filter((t) => t.status !== 'delivered')
      .map((t) => t.driverName);
  } catch (error) {
    console.error('Error fetching active drivers:', error);
    return [];
  }
};

const CreateTransport = () => {
  const [formData, setFormData] = useState(() => ({
    vehicleId: '',
    vehicleType: '',
    driverName: '',
    batchId: '',
    destination: '',
    departureTime: toDatetimeLocal(new Date()),
    estimatedArrival: '',
    status: 'scheduled',
    notes: ''
  }));

  const todayStartLocal = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return toDatetimeLocal(d);
  }, []);

  const todayEndLocal = useMemo(() => {
    const d = new Date();
    d.setHours(23, 59, 0, 0);
    return toDatetimeLocal(d);
  }, []);

  const [loading, setLoading] = useState(false);
  const [batchIds, setBatchIds] = useState([]);
  const [activeDrivers, setActiveDrivers] = useState([]);
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  const driverNames = [
    'Kalum Perera',
    'Manel Kumara',
    'Nimal Fernando',
    'Kamal Silva',
    'Sunil Rajapaksa'
  ];

  const vehicleTypes = ['Van', 'Lorry', 'Truck', 'Container'];

  useEffect(() => {
    generateVehicleId();
    fetchBatchIds();
    fetchActiveDrivers(API_URL).then((drivers) => {
      setActiveDrivers(Array.from(new Set(drivers.filter(Boolean))));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateVehicleId = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/transports`);
      const transports = data || [];

      let highestNumber = 0;
      transports.forEach((transport) => {
        if (transport.vehicleId && transport.vehicleId.startsWith('V')) {
          const numberPart = parseInt(transport.vehicleId.slice(1), 10);
          if (!Number.isNaN(numberPart) && numberPart > highestNumber) {
            highestNumber = numberPart;
          }
        }
      });

      const newNumber = highestNumber + 1;
      const newVehicleId = `V${newNumber.toString().padStart(3, '0')}`;
      setFormData((prev) => ({ ...prev, vehicleId: newVehicleId }));
    } catch (error) {
      console.error('Error generating vehicle ID:', error);
      const fallbackId = `V${Math.floor(100 + Math.random() * 900)}`;
      setFormData((prev) => ({ ...prev, vehicleId: fallbackId }));
    }
  };

  const fetchBatchIds = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/production-batches`);
      const batches = data || [];
      const uniqueBatchIds = [...new Set(batches.map((batch) => batch.batchId))];
      setBatchIds(uniqueBatchIds);
    } catch (error) {
      console.error('Error fetching batch IDs:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'departureTime') {
      if (!value) {
        setFormData((prev) => ({ ...prev, departureTime: toDatetimeLocal(new Date()) }));
        return;
      }
      const timePart = value.split('T')[1] || '';
      const today = new Date();
      if (timePart) {
        const [hours = '0', minutes = '0'] = timePart.split(':');
        today.setHours(parseInt(hours, 10) || 0, parseInt(minutes, 10) || 0, 0, 0);
      }
      setFormData((prev) => ({ ...prev, departureTime: toDatetimeLocal(today) }));
      return;
    }

    if (name === 'estimatedArrival') {
      if (!value) {
        setFormData((prev) => ({ ...prev, estimatedArrival: '' }));
        return;
      }
      const chosen = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const chosenDay = new Date(chosen);
      chosenDay.setHours(0, 0, 0, 0);
      if (chosenDay < today) {
        setFormData((prev) => ({ ...prev, estimatedArrival: todayStartLocal }));
        return;
      }
      setFormData((prev) => ({ ...prev, estimatedArrival: value }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/transports`,
        formData,
        token
          ? {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          : undefined
      );
      Swal.fire('Success', 'Transport created successfully', 'success');
      navigate('/transports');
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to create transport';
      Swal.fire('Error', message, 'error');
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
                {vehicleTypes.map((type) => (
                  <option key={type} value={type}>
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
                {driverNames.map((name) => (
                  <option
                    key={name}
                    value={name}
                    disabled={activeDrivers.includes(name)}
                    style={activeDrivers.includes(name) ? { color: '#9ca3af' } : undefined}
                  >
                    {name}
                    {activeDrivers.includes(name) ? ' (Unavailable)' : ''}
                  </option>
                ))}
              </select>
              {activeDrivers.length > 0 && (
                <p className="text-xs mt-1 text-warning">
                  {activeDrivers.length} driver{activeDrivers.length > 1 ? 's are' : ' is'} currently assigned to
                  ongoing transports.
                </p>
              )}
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
                {batchIds.map((batchId) => (
                  <option key={batchId} value={batchId}>
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
                min={todayStartLocal}
                max={todayEndLocal}
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
                min={todayStartLocal}
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
              rows={3}
              placeholder="Optional instructions for the driver..."
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
