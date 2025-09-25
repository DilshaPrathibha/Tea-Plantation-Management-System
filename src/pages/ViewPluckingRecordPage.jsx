// FRONTEND/src/pages/ViewPluckingRecordPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Calendar, MapPin, DollarSign, Scale, User, Edit, Trash2, ArrowLeft, Users, FileText } from 'lucide-react';
import RateLimitedUI from '../components/RateLimitedUI';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const ViewPluckingRecordPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [isRateLimited, setIsRateLimited] = useState(false);

  useEffect(() => {
    fetchRecord();
  }, [id]);

  const fetchRecord = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/plucking-records/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecord(response.data.pluckingRecord);
    } catch (error) {
      console.error('Error fetching plucking record:', error);
      if (error.response?.status === 429) {
        setIsRateLimited(true);
        // Automatically retry after 10 seconds
        setTimeout(() => {
          setIsRateLimited(false);
          fetchRecord();
        }, 10000);
      } else {
        setError('Failed to load plucking record');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#059669',
        cancelButtonColor: '#DC2626',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel'
      });

      if (result.isConfirmed) {
        setDeleting(true);
        const token = localStorage.getItem('token');
        
        await axios.delete(`${API}/api/plucking-records/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        await Swal.fire({
          title: 'Deleted!',
          text: 'Plucking record has been deleted.',
          icon: 'success',
          confirmButtonColor: '#059669'
        });
        
        navigate('/plucking-records');
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to delete plucking record.',
        icon: 'error',
        confirmButtonColor: '#DC2626'
      });
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  if (error) {
    return (
      <div className="min-h-screen bg-green-50 py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/plucking-records" className="inline-flex items-center text-green-600 hover:text-green-700 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Records
          </Link>
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <div className="text-red-500 text-lg mb-4">{error}</div>
            <button
              onClick={fetchRecord}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen bg-green-50 py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/plucking-records" className="inline-flex items-center text-green-600 hover:text-green-700 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Records
          </Link>
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <div className="text-gray-600 mb-4">Plucking record not found</div>
            <Link
              to="/plucking-records"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              View All Records
            </Link>
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
          <Link 
            to="/plucking-records" 
            className="inline-flex items-center text-green-600 hover:text-green-700 mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Records
          </Link>
          <h1 className="text-2xl font-bold text-green-800">Plucking Record Details</h1>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-green-100">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {record.field} - {formatDate(record.date)}
                </h1>
                <p className="text-gray-600">Reported by {record.reporterName}</p>
              </div>
              <span className="mt-4 md:mt-0 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                {record.teaGrade}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium">{formatDate(record.date)}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <MapPin className="w-5 h-5 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Field</p>
                    <p className="font-medium">{record.field}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center">
                  <DollarSign className="w-5 h-5 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Price per KG</p>
                    <p className="font-medium">LKR {record.dailyPricePerKg.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Scale className="w-5 h-5 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Total Weight</p>
                    <p className="font-medium">{record.totalWeight} kg</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Workers List */}
            <div className="mb-6">
              <div className="flex items-center mb-3">
                <Users className="w-5 h-5 text-green-600 mr-2" />
                <h3 className="text-lg font-semibold">Workers ({record.workers.length})</h3>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {record.workers.map((worker, index) => (
                    <div key={index} className="bg-white rounded-lg p-3 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{worker.workerName}</p>
                          <p className="text-sm text-gray-600">ID: {worker.workerId}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{worker.weight} kg</p>
                          <p className="text-sm text-green-700">
                            LKR {(worker.weight * record.dailyPricePerKg).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Totals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-green-50 rounded-lg">
              <div>
                <h4 className="font-semibold text-green-800">Total Tea Leaves Weight</h4>
                <p className="text-2xl font-bold text-green-900">{record.totalWeight} kg</p>
              </div>
              <div>
                <h4 className="font-semibold text-green-800">Total Daily Payment</h4>
                <p className="text-2xl font-bold text-green-900">LKR {record.totalPayment.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => navigate(`/plucking-records/${record._id}/edit`)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Record
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? (
                  <Loader className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Delete Record
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewPluckingRecordPage;