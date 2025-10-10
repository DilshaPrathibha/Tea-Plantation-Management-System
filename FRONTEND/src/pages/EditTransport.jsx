import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
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

const EditTransport = () => {
  const [formData, setFormData] = useState({
    vehicleId: '',
    vehicleType: '',
    driverName: '',
    batchId: '',
    destination: '',
    departureTime: '',
    estimatedArrival: '',
    status: 'scheduled',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [batchIds, setBatchIds] = useState([]);
  const [activeDrivers, setActiveDrivers] = useState([]);
  const navigate = useNavigate();
  const { id } = useParams();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  const driverNames = [
    'Kalum Perera',
    'Manel Kumara',
    'Nimal Fernando',
    'Kamal Silva',
    'Sunil Rajapaksa'
  ];

  const vehicleTypes = [
    'Van',
    'Lorry',
    'Truck',
    'Container'
  ];

  useEffect(() => {
    getTransportData();
    fetchBatchIds();
  }, [id]);

  const fetchBatchIds = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/production-batches`);
      const batches = response.data || [];
      const uniqueBatchIds = [...new Set(batches.map((batch) => batch.batchId))];
      setBatchIds(uniqueBatchIds);
    } catch (error) {
      console.error('Error fetching batch IDs:', error);
    }
  };

  const refreshActiveDrivers = useCallback(
    async (currentDriver) => {
      try {
        const { data } = await axios.get(`${API_URL}/api/transports`);
        const drivers = (data || [])
          .filter((t) => t.status !== 'delivered' && t._id !== id)
          .map((t) => t.driverName)
          .filter(Boolean);
        setActiveDrivers(Array.from(new Set(drivers.filter((d) => d !== currentDriver))));
      } catch (error) {
        console.error('Error fetching active drivers:', error);
        setActiveDrivers([]);
      }
    },
    [API_URL, id]
  );

  const getTransportData = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/transports/${id}`);
      const transport = response.data;
      setFormData({
        vehicleId: transport.vehicleId,
        vehicleType: transport.vehicleType || '',
        driverName: transport.driverName,
        batchId: transport.batchId,
        destination: transport.destination,
        departureTime: transport.departureTime ? new Date(transport.departureTime).toISOString().slice(0, 16) : '',
        estimatedArrival: transport.estimatedArrival ? new Date(transport.estimatedArrival).toISOString().slice(0, 16) : '',
        status: transport.status,
        notes: transport.notes || ''
      });
      refreshActiveDrivers(transport.driverName);
    } catch (error) {
      Swal.fire('Error', 'Cannot load transport data', 'error');
      navigate('/transports');
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
      const base = formData.departureTime ? new Date(formData.departureTime) : new Date();
      if (timePart) {
        const [hours = '0', minutes = '0'] = timePart.split(':');
        base.setHours(parseInt(hours, 10) || 0, parseInt(minutes, 10) || 0, 0, 0);
      }
      setFormData((prev) => ({ ...prev, departureTime: toDatetimeLocal(base) }));
      return;
    }

    if (name === 'estimatedArrival') {
      if (!value) {
        setFormData((prev) => ({ ...prev, estimatedArrival: '' }));
        return;
      }
      const chosen = new Date(value);
      const start = new Date(chosen);
      start.setHours(0, 0, 0, 0);
      const departure = formData.departureTime ? new Date(formData.departureTime) : new Date();
      departure.setHours(0, 0, 0, 0);
      if (start < departure) {
        Swal.fire('Invalid date', 'Estimated arrival cannot be before the departure day.', 'warning');
        setFormData((prev) => ({ ...prev, estimatedArrival: '' }));
        return;
      }
      setFormData((prev) => ({ ...prev, estimatedArrival: value }));
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const departureBounds = useMemo(() => {
    if (!formData.departureTime) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 0, 0);
      return { min: toDatetimeLocal(now), max: toDatetimeLocal(end) };
    }
    const base = new Date(formData.departureTime);
    const start = new Date(base);
    start.setHours(0, 0, 0, 0);
    const end = new Date(base);
    end.setHours(23, 59, 0, 0);
    return { min: toDatetimeLocal(start), max: toDatetimeLocal(end) };
  }, [formData.departureTime]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/api/transports/${id}`,
        formData,
        token
          ? {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          : undefined
      );
      Swal.fire('Success', 'Transport updated successfully', 'success');
      navigate('/transports');
    } catch (error) {
      const message = error?.response?.data?.message || 'Cannot update transport';
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
          <h1 className="text-2xl font-bold">Edit Transport</h1>
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
                    disabled={activeDrivers.includes(name) && name !== formData.driverName}
                    style={activeDrivers.includes(name) && name !== formData.driverName ? { color: '#9ca3af' } : undefined}
                  >
                    {name}
                    {activeDrivers.includes(name) && name !== formData.driverName ? ' (Unavailable)' : ''}
                  </option>
                ))}
              </select>
              {activeDrivers.length > 0 && (
                <p className="text-xs mt-1 text-warning">
                  Active drivers currently assigned: {activeDrivers.join(', ')}
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
                min={departureBounds.min}
                max={departureBounds.max}
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
                min={departureBounds.min}
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
              {loading ? 'Updating...' : 'Update Transport'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTransport;
