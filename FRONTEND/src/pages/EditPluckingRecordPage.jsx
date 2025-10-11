// FRONTEND/src/pages/EditPluckingRecordPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Calendar, MapPin, DollarSign, Scale, User, Plus, X, Save, Loader, ArrowLeft, Leaf, CreditCard } from 'lucide-react';

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
  const [currentUser, setCurrentUser] = useState(null);
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

  useEffect(() => {
    fetchCurrentUser();
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

  const fetchCurrentUser = () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setCurrentUser(user);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchRecordData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/plucking-records/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const record = response.data.pluckingRecord || response.data;
      
      // Check if current user can edit this record
      if (currentUser && currentUser._id !== record.reportedBy) {
        await Swal.fire({
          icon: 'warning',
          title: 'Access Denied',
          text: 'Only the reporter can edit this plucking record.',
          confirmButtonColor: '#16a34a'
        });
        navigate('/plucking-records');
        return;
      }
      
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

    } catch (error) {
      console.error('Error fetching plucking record:', error);
      setError('Failed to load plucking record. Please check if the record exists.');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8 px-4">
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate('/plucking-records')}
            className="flex items-center text-green-600 hover:text-green-700 mr-4 font-medium"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Records
          </button>
          <div className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center mr-4 border border-green-100">
            <Leaf className="w-6 h-6 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Plucking Record</h1>
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
          {/* Read-only fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 p-6 bg-gray-50 rounded-2xl border-2 border-gray-200">
            <div>
              <label className="label">
                <span className="label-text flex items-center text-gray-900 font-semibold text-base">
                  <Calendar className="w-5 h-5 mr-2 text-green-600" />
                  Date
                </span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full bg-gray-100 border-2 border-gray-300 rounded-xl py-3 px-4 text-gray-600 font-medium"
                value={new Date(formData.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
                disabled
              />
            </div>

            <div>
              <label className="label">
                <span className="label-text flex items-center text-gray-900 font-semibold text-base">
                  <MapPin className="w-5 h-5 mr-2 text-green-600" />
                  Field
                </span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full bg-gray-100 border-2 border-gray-300 rounded-xl py-3 px-4 text-gray-600 font-medium"
                value={formData.field}
                disabled
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Editable fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            {/* Totals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200">
              <div className="text-center">
                <h4 className="font-bold text-green-800 text-lg">Total Tea Leaves Weight</h4>
                <p className="text-3xl font-bold text-green-900 mt-2">{totalWeight.toFixed(2)} kg</p>
              </div>
              <div className="text-center">
                <h4 className="font-bold text-green-800 text-lg">Total Daily Payment</h4>
                <p className="text-3xl font-bold text-green-900 mt-2">LKR {totalPayment.toFixed(2)}</p>
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
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
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