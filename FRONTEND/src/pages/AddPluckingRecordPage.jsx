// FRONTEND/src/pages/AddPluckingRecordPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Calendar, MapPin, DollarSign, Scale, User, Plus, X, Save, Loader, Leaf, CreditCard } from 'lucide-react';

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
        await Swal.fire({
          icon: 'info',
          title: 'No Attendance Found',
          text: 'There are no attendance records for the selected field and date. Please check the attendance records first.',
          confirmButtonColor: '#16a34a',
          confirmButtonText: 'OK'
        });
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

  const calculateIndividualPayment = (weight) => {
    const price = parseFloat(formData.dailyPricePerKg) || 0;
    const weightValue = parseFloat(weight) || 0;
    return weightValue * price;
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
      
      // Check for existing records for this field and date
      const existingRecordsResponse = await axios.get(`${API}/api/plucking-records`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const existingRecords = existingRecordsResponse.data.items || [];
      const duplicateRecord = existingRecords.find(record => 
        record.field === formData.field && 
        new Date(record.date).toISOString().split('T')[0] === formData.date
      );

      if (duplicateRecord) {
        await Swal.fire({
          icon: 'warning',
          title: 'Record Already Exists',
          text: `A plucking record already exists for field "${formData.field}" on ${new Date(formData.date).toLocaleDateString()}. You cannot create multiple records for the same field on the same date.`,
          confirmButtonColor: '#16a34a',
          confirmButtonText: 'OK'
        });
        setLoading(false);
        return;
      }

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

      await Swal.fire({
        title: 'Success!',
        text: 'Plucking record has been created successfully.',
        icon: 'success',
        confirmButtonColor: '#16a34a'
      });

      navigate('/plucking-records');
    } catch (error) {
      console.error('Error creating plucking record:', error);
      
      // Handle backend duplicate record error
      if (error.response?.status === 400 && error.response.data.message?.includes('already exists')) {
        await Swal.fire({
          icon: 'warning',
          title: 'Record Already Exists',
          text: error.response.data.message,
          confirmButtonColor: '#16a34a',
          confirmButtonText: 'OK'
        });
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to create plucking record';
        setError(errorMessage);
        await Swal.fire({
          title: 'Error!',
          text: errorMessage,
          icon: 'error',
          confirmButtonColor: '#dc2626'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <div className="w-14 h-14 bg-white rounded-2xl shadow-lg flex items-center justify-center mr-4 border border-green-100">
            <Leaf className="w-7 h-7 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Daily Plucking Record</h1>
            <p className="text-gray-800 mt-2 font-medium">Fill out all the details about the daily plucking activities.</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-800 rounded-2xl border border-red-200 shadow-sm">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-red-600 text-sm font-bold">!</span>
              </div>
              {error}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center text-gray-900 font-semibold text-base">
                    <Calendar className="w-5 h-5 mr-2 text-green-600" />
                    Date
                  </span>
                </label>
                <input
                  type="date"
                  name="date"
                  className="input input-bordered w-full bg-white border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl py-3 px-4 text-gray-900"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center text-gray-900 font-semibold text-base">
                    <MapPin className="w-5 h-5 mr-2 text-green-600" />
                    Field
                  </span>
                </label>
                <select
                  name="field"
                  className="select select-bordered w-full bg-white border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl py-3 px-4 text-gray-900"
                  value={formData.field}
                  onChange={handleInputChange}
                  required
                >
                  <option value="" className="text-gray-500">Select a field</option>
                  {fields.map(field => (
                    <option key={field._id} value={field.name} className="text-gray-900">
                      {field.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center text-gray-900 font-semibold text-base">
                    <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                    Daily Price per KG (LKR)
                  </span>
                </label>
                <input
                  type="number"
                  name="dailyPricePerKg"
                  className="input input-bordered w-full bg-white border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl py-3 px-4 text-gray-900"
                  placeholder="0.00"
                  min="0"
                  max="500"
                  step="0.01"
                  value={formData.dailyPricePerKg}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text text-gray-900 font-semibold text-base">Tea Grade</span>
                </label>
                <select
                  name="teaGrade"
                  className="select select-bordered w-full bg-white border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl py-3 px-4 text-gray-900"
                  value={formData.teaGrade}
                  onChange={handleInputChange}
                  required
                >
                  <option value="" className="text-gray-500">Select tea grade</option>
                  {teaGrades.map(grade => (
                    <option key={grade} value={grade} className="text-gray-900">{grade}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Workers Section */}
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 bg-gray-50">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <User className="w-6 h-6 mr-3 text-green-600" />
                  Workers
                </h3>
                <button
                  type="button"
                  onClick={addWorkerField}
                  className="btn bg-white border-2 border-green-500 text-green-600 hover:bg-green-50 font-semibold rounded-xl px-4 py-2"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Worker
                </button>
              </div>

              {formData.workers.map((worker, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-gray-900 font-medium">Worker {index + 1}</span>
                    </label>
                    <select
                      className="select select-bordered w-full bg-white border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl py-2 px-3 text-gray-900"
                      value={worker.workerId}
                      onChange={(e) => handleWorkerChange(index, 'workerId', e.target.value)}
                      required
                    >
                      <option value="" className="text-gray-500">Select worker</option>
                      {getAvailableWorkerOptions(index).map(workerOption => (
                        <option key={workerOption.workerId} value={workerOption.workerId} className="text-gray-900">
                          {workerOption.workerName} ({workerOption.workerId})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text flex items-center text-gray-900 font-medium">
                        <Scale className="w-5 h-5 mr-2 text-green-600" />
                        Weight (KG)
                      </span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered w-full bg-white border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl py-2 px-3 text-gray-900"
                      placeholder="0.00"
                      min="0"
                      max="100"
                      step="0.01"
                      value={worker.weight}
                      onChange={(e) => handleWorkerChange(index, 'weight', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text flex items-center text-gray-900 font-medium">
                        <CreditCard className="w-5 h-5 mr-2 text-green-600" />
                        Daily Payment (LKR)
                      </span>
                    </label>
                    <div className="flex items-center h-12 px-3 bg-green-50 border-2 border-green-200 rounded-xl text-gray-900 font-semibold">
                      {calculateIndividualPayment(worker.weight).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {formData.dailyPricePerKg ? `${parseFloat(formData.dailyPricePerKg).toFixed(2)} × ${worker.weight || '0.00'}` : 'Set price first'}
                    </div>
                  </div>

                  <div className="form-control flex items-end">
                    {formData.workers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeWorkerField(index)}
                        className="btn btn-outline btn-error rounded-xl py-2 px-3 border-2"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Section */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Leaf className="w-5 h-5 mr-2 text-green-600" />
                Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center p-6 bg-white rounded-xl border-2 border-green-200 shadow-sm">
                  <div className="text-3xl font-bold text-green-700">
                    {totalWeight.toFixed(2)} KG
                  </div>
                  <div className="text-gray-900 font-medium mt-2">Total Weight</div>
                </div>
                <div className="text-center p-6 bg-white rounded-xl border-2 border-green-200 shadow-sm">
                  <div className="text-3xl font-bold text-green-700">
                    LKR {totalPayment.toFixed(2)}
                  </div>
                  <div className="text-gray-900 font-medium mt-2">Total Payment</div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t-2 border-gray-100">
              <button
                type="button"
                onClick={() => navigate('/plucking-records')}
                className="btn bg-white border-2 border-gray-300 text-gray-800 hover:bg-gray-50 px-8 py-3 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Create Record
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

export default AddPluckingRecordPage;