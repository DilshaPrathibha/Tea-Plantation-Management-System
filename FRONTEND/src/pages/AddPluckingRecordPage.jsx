// FRONTEND/src/pages/AddPluckingRecordPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, MapPin, DollarSign, Scale, User, Plus, X, Save, Loader } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const teaGrades = [
  'Pekoe (P)',
  'Broken Pekoe (BP)',
  'Broken Pekoe Fannings (BPF)',
  'Flowery Broken Orange Pekoe (FBOP)',
  'Flowery Broken Orange Pekoe Fannings (FBOPF)',
  'Orange Pekoe (OP)',
  'Broken Orange Pekoe (BOP)',
  'Broken Orange Pekoe Fannings (BOPF)',
  'Dust Grade (Dust / PD)'
];

const AddPluckingRecordPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fields, setFields] = useState([]);
  const [availableWorkers, setAvailableWorkers] = useState([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    field: '',
    dailyPricePerKg: '',
    teaGrade: '',
    workers: [{
      workerId: '',
      workerName: '',
      weight: ''
    }]
  });

  const [totalWeight, setTotalWeight] = useState(0);
  const [totalPayment, setTotalPayment] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    if (formData.date && formData.field) {
      fetchFieldWorkers();
    }
  }, [formData.date, formData.field]);

  useEffect(() => {
    calculateTotals();
  }, [formData.workers, formData.dailyPricePerKg]);

  const fetchFields = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/fields`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFields(response.data.items || []);
    } catch (error) {
      console.error('Error fetching fields:', error);
      setError('Failed to load fields');
    }
  };

  const fetchFieldWorkers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/plucking-records/field-workers`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          date: formData.date,
          field: formData.field
        }
      });
      setAvailableWorkers(response.data.workers || []);
      setError('');
    } catch (error) {
      console.error('Error fetching field workers:', error);
      if (error.response?.status === 404) {
        setError(error.response.data.message);
      } else {
        setError('Failed to load field workers');
      }
      setAvailableWorkers([]);
    }
  };

  const calculateTotals = () => {
    let weightTotal = 0;
    let paymentTotal = 0;
    const price = parseFloat(formData.dailyPricePerKg) || 0;

    formData.workers.forEach(worker => {
      const weight = parseFloat(worker.weight) || 0;
      weightTotal += weight;
      paymentTotal += weight * price;
    });

    setTotalWeight(weightTotal);
    setTotalPayment(paymentTotal);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleWorkerChange = (index, field, value) => {
    const updatedWorkers = [...formData.workers];
    
    if (field === 'workerId') {
      const selectedWorker = availableWorkers.find(w => w.workerId === value);
      updatedWorkers[index] = {
        ...updatedWorkers[index],
        workerId: value,
        workerName: selectedWorker ? selectedWorker.workerName : ''
      };
    } else {
      updatedWorkers[index] = {
        ...updatedWorkers[index],
        [field]: value
      };
    }

    setFormData(prev => ({
      ...prev,
      workers: updatedWorkers
    }));
  };

  const addWorkerField = () => {
    setFormData(prev => ({
      ...prev,
      workers: [...prev.workers, { workerId: '', workerName: '', weight: '' }]
    }));
  };

  const removeWorkerField = (index) => {
    if (formData.workers.length > 1) {
      setFormData(prev => ({
        ...prev,
        workers: prev.workers.filter((_, i) => i !== index)
      }));
    }
  };

  const getAvailableWorkerOptions = (currentIndex) => {
    const selectedWorkerIds = formData.workers
      .filter((_, index) => index !== currentIndex)
      .map(worker => worker.workerId)
      .filter(id => id !== '');

    return availableWorkers.filter(worker => 
      !selectedWorkerIds.includes(worker.workerId)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        dailyPricePerKg: parseFloat(formData.dailyPricePerKg),
        workers: formData.workers
          .filter(worker => worker.workerId && worker.weight)
          .map(worker => ({
            workerId: worker.workerId,
            workerName: worker.workerName,
            weight: parseFloat(worker.weight)
          }))
      };

      await axios.post(`${API}/api/plucking-records`, payload, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      navigate('/plucking-records');
    } catch (error) {
      console.error('Error creating plucking record:', error);
      setError(error.response?.data?.message || 'Failed to create plucking record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-50 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-green-800 mb-2">Create Daily Plucking Record</h1>
          <p className="text-gray-600">Fill out all the details about the daily plucking activities.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Date
              </label>
              <input
                type="date"
                name="date"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value={formData.date}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                Field
              </label>
              <select
                name="field"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value={formData.field}
                onChange={handleInputChange}
                required
              >
                <option value="">Select a field</option>
                {fields.map(field => (
                  <option key={field._id} value={field.name}>
                    {field.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <DollarSign className="w-4 h-4 mr-1" />
                Daily Price per KG (LKR)
              </label>
              <input
                type="number"
                name="dailyPricePerKg"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="0.00"
                min="0"
                max="500"
                step="0.01"
                value={formData.dailyPricePerKg}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tea Grade
              </label>
              <select
                name="teaGrade"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value={formData.teaGrade}
                onChange={handleInputChange}
                required
              >
                <option value="">Select tea grade</option>
                {teaGrades.map(grade => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Workers Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Workers
              </h3>
              <button
                type="button"
                onClick={addWorkerField}
                className="flex items-center px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Worker
              </button>
            </div>

            {formData.workers.map((worker, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Worker {index + 1}
                  </label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    value={worker.workerId}
                    onChange={(e) => handleWorkerChange(index, 'workerId', e.target.value)}
                    required
                  >
                    <option value="">Select worker</option>
                    {getAvailableWorkerOptions(index).map(workerOption => (
                      <option key={workerOption.workerId} value={workerOption.workerId}>
                        {workerOption.workerName} ({workerOption.workerId})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Scale className="w-4 h-4 mr-1" />
                    Weight (KG)
                  </label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={worker.weight}
                    onChange={(e) => handleWorkerChange(index, 'weight', e.target.value)}
                    required
                  />
                </div>

                <div className="flex items-end">
                  {worker.workerId && worker.weight && formData.dailyPricePerKg && (
                    <div className="text-sm text-green-700 font-medium">
                      Payment: LKR {(parseFloat(worker.weight) * parseFloat(formData.dailyPricePerKg)).toFixed(2)}
                    </div>
                  )}
                  {formData.workers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeWorkerField(index)}
                      className="ml-auto p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-green-50 rounded-lg">
            <div>
              <h4 className="font-semibold text-green-800">Total Tea Leaves Weight</h4>
              <p className="text-2xl font-bold text-green-900">{totalWeight.toFixed(2)} kg</p>
            </div>
            <div>
              <h4 className="font-semibold text-green-800">Total Daily Payment</h4>
              <p className="text-2xl font-bold text-green-900">LKR {totalPayment.toFixed(2)}</p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/plucking-records')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Record
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPluckingRecordPage;