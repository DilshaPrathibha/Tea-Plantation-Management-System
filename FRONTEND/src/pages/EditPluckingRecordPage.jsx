// FRONTEND/src/pages/EditPluckingRecordPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Calendar, MapPin, DollarSign, Scale, User, Plus, X, Save, Loader, ArrowLeft } from 'lucide-react';
import RateLimitedUI from '../components/RateLimitedUI';

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

const EditPluckingRecordPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState([]);
  const [availableWorkers, setAvailableWorkers] = useState([]);
  const [formData, setFormData] = useState({
    date: '',
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
  const [isRateLimited, setIsRateLimited] = useState(false);

  useEffect(() => {
    fetchRecordData();
    fetchFields();
  }, [id]);

  useEffect(() => {
    if (formData.date && formData.field) {
      fetchFieldWorkers();
    }
  }, [formData.date, formData.field]);

  useEffect(() => {
    calculateTotals();
  }, [formData.workers, formData.dailyPricePerKg]);

  const fetchRecordData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/plucking-records/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const record = response.data.pluckingRecord || response.data;
      
      // Format date for input field
      const formattedDate = new Date(record.date).toISOString().split('T')[0];
      
      setFormData({
        date: formattedDate,
        field: record.field,
        dailyPricePerKg: record.dailyPricePerKg.toString(),
        teaGrade: record.teaGrade,
        workers: record.workers.map(worker => ({
          workerId: worker.workerId,
          workerName: worker.workerName,
          weight: worker.weight.toString()
        }))
      });

      // Fetch workers for this field and date after setting form data
      await fetchFieldWorkers(record.field, formattedDate);

    } catch (error) {
      console.error('Error fetching plucking record:', error);
      if (error.response?.status === 429) {
        setIsRateLimited(true);
        // Automatically retry after 10 seconds
        setTimeout(() => {
          setIsRateLimited(false);
          fetchRecordData();
        }, 10000);
      } else {
        setError('Failed to load plucking record. Please check if the record exists.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchFields = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/fields`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFields(response.data.items || []);
    } catch (error) {
      console.error('Error fetching fields:', error);
      if (error.response?.status === 429) {
        setIsRateLimited(true);
        // Automatically retry after 10 seconds
        setTimeout(() => {
          setIsRateLimited(false);
          fetchFields();
        }, 10000);
      } else {
        setError('Failed to load fields');
      }
    }
  };

  const fetchFieldWorkers = async (field = null, date = null) => {
    try {
      const token = localStorage.getItem('token');
      const fieldToUse = field || formData.field;
      const dateToUse = date || formData.date;
      
      const response = await axios.get(`${API}/api/plucking-records/field-workers`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          date: dateToUse,
          field: fieldToUse,
          includeAssigned: true // Add this parameter to include assigned workers
        }
      });
      
      // Combine existing workers with available workers
      const existingWorkers = formData.workers
        .filter(w => w.workerId && w.workerName)
        .map(w => ({
          workerId: w.workerId,
          workerName: w.workerName
        }));

      const newWorkers = response.data.workers || [];
      
      // Remove duplicates while preserving existing workers
      const combinedWorkers = [
        ...existingWorkers,
        ...newWorkers.filter(nw => 
          !existingWorkers.some(ew => ew.workerId === nw.workerId)
        )
      ];
      
      setAvailableWorkers(combinedWorkers);
      setError('');
    } catch (error) {
      console.error('Error fetching field workers:', error);
      if (error.response?.status === 429) {
        setIsRateLimited(true);
        // Automatically retry after 10 seconds
        setTimeout(() => {
          setIsRateLimited(false);
          fetchFieldWorkers(field, date);
        }, 10000);
      } else {
        // Keep existing workers even if fetch fails
        const existingWorkers = formData.workers
          .filter(w => w.workerId && w.workerName)
          .map(w => ({
            workerId: w.workerId,
            workerName: w.workerName
          }));
        setAvailableWorkers(existingWorkers);
        setError('Failed to load additional workers');
      }
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
    setSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const payload = {
        dailyPricePerKg: parseFloat(formData.dailyPricePerKg),
        teaGrade: formData.teaGrade,
        workers: formData.workers
          .filter(worker => worker.workerId && worker.weight)
          .map(worker => ({
            workerId: worker.workerId,
            workerName: worker.workerName,
            weight: parseFloat(worker.weight)
          }))
      };

      await axios.put(`${API}/api/plucking-records/${id}`, payload, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      await Swal.fire({
        title: 'Success!',
        text: 'Plucking record has been updated.',
        icon: 'success',
        confirmButtonColor: '#059669'
      });

      navigate('/plucking-records');
    } catch (error) {
      console.error('Error updating plucking record:', error);
      Swal.fire({
        title: 'Error!',
        text: error.response?.data?.message || 'Failed to update plucking record',
        icon: 'error',
        confirmButtonColor: '#DC2626'
      });
    } finally {
      setSaving(false);
    }
  };

  if (isRateLimited) {
    return <RateLimitedUI />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-green-50 py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <div className="animate-pulse bg-gray-200 h-6 w-6 rounded mr-3"></div>
            <div className="animate-pulse bg-gray-200 h-6 w-32 rounded"></div>
          </div>
          <div className="bg-white rounded-xl shadow p-6 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/plucking-records')}
            className="flex items-center text-green-600 hover:text-green-700 mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Records
          </button>
          <h1 className="text-2xl font-bold text-green-800">Edit Plucking Record</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md p-6">
          {/* Read-only fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Date
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                value={new Date(formData.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                Field
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                value={formData.field}
                disabled
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Editable fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
              >
                {saving ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Update Record
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditPluckingRecordPage;