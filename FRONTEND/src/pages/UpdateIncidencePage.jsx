import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Camera, Upload, X, User, MapPin, Calendar, Clock, AlertCircle, FileText, CheckCircle, Loader } from 'lucide-react';
import RateLimitedUI from '@/components/RateLimitedUI';
import Swal from 'sweetalert2';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const UpdateIncidencePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [fetchingFields, setFetchingFields] = useState(true);
  const [imagePreview, setImagePreview] = useState(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  // Form state
  const [form, setForm] = useState({
    reporterName: '',
    title: '',
    location: '',
    date: '',
    time: '',
    type: '',
    severity: '',
    description: '',
    status: 'Pending'
  });

  // Fetch fields from the system with retry logic
  const fetchFields = async () => {
    try {
      setFetchingFields(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/fields`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && response.data.items) {
        setFields(response.data.items);
        setIsRateLimited(false);
        setRetryCount(0); // Reset retry count on success
      } else {
        setFields([]);
      }
    } catch (error) {
      console.error('Error fetching fields:', error);
      if (error.response?.status === 429) {
        setIsRateLimited(true);
        const retryAfter = error.response.headers['retry-after'] || 60;
        
        if (retryCount < 3) {
          setRetryCount(prev => prev + 1);
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          return fetchFields();
        } else {
          await Swal.fire({
            title: 'Rate Limited',
            text: 'Too many requests. Please try again later.',
            icon: 'warning',
            confirmButtonText: 'OK',
            confirmButtonColor: '#059669'
          });
        }
      } else {
        await Swal.fire({
          title: 'Error',
          text: 'Failed to fetch field data. Please try again.',
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#059669'
        });
      }
      setFields([]);
    } finally {
      setFetchingFields(false);
    }
  };

  // Fetch incidence data
  const fetchIncidenceData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch incidence data
      const incidenceResponse = await axios.get(`${API}/api/incidences/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const incidenceData = incidenceResponse.data.incidence;
      
      // Format date for input field (YYYY-MM-DD)
      const formattedDate = incidenceData.date 
        ? new Date(incidenceData.date).toISOString().split('T')[0]
        : '';
      
      // Update form with existing data
      setForm({
        reporterName: incidenceData.reporterName || '',
        title: incidenceData.title || '',
        location: incidenceData.location || '',
        date: formattedDate,
        time: incidenceData.time || '',
        type: incidenceData.type || '',
        severity: incidenceData.severity || '',
        description: incidenceData.description || '',
        status: incidenceData.status || 'Pending'
      });
      
      setIsRateLimited(false);
      setRetryCount(0);
    } catch (error) {
      console.error('Error fetching incidence data:', error);
      if (error.response?.status === 429) {
        setIsRateLimited(true);
        const retryAfter = error.response.headers['retry-after'] || 60;
        
        if (retryCount < 3) {
          setRetryCount(prev => prev + 1);
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          return fetchIncidenceData();
        } else {
          await Swal.fire({
            title: 'Rate Limited',
            text: 'Too many requests. Please try again later.',
            icon: 'warning',
            confirmButtonText: 'OK',
            confirmButtonColor: '#059669'
          });
        }
      } else {
        await Swal.fire({
          title: 'Error',
          text: 'Failed to load incidence data. Please try again.',
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#059669'
        });
      }
      setError('Failed to load incidence data. Please try again.');
    } finally {
      setFetching(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      await fetchFields();
      await fetchIncidenceData();
    };
    
    fetchData();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/api/incidences/${id}`, form, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setSuccess(true);
      setIsRateLimited(false);
      setRetryCount(0);
      
      // Reset success message after 3 seconds and redirect
      setTimeout(() => {
        setSuccess(false);
        navigate('/incidence');
      }, 2000);
    } catch (error) {
      console.error('Error updating incidence:', error);
      if (error.response?.status === 429) {
        setIsRateLimited(true);
        const retryAfter = error.response.headers['retry-after'] || 60;
        
        if (retryCount < 3) {
          setRetryCount(prev => prev + 1);
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          return handleSubmit(e);
        } else {
          await Swal.fire({
            title: 'Rate Limited',
            text: 'Too many requests. Please try again later.',
            icon: 'warning',
            confirmButtonText: 'OK',
            confirmButtonColor: '#059669'
          });
        }
      } else {
        await Swal.fire({
          title: 'Error',
          text: 'Failed to update incidence report. Please try again.',
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#059669'
        });
      }
      setError('Failed to update incidence report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size too large. Maximum size is 10MB.');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-green-50 py-10 px-4 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader className="w-8 h-8 animate-spin text-green-600 mb-4" />
          <div className="text-lg">Loading incidence data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-green-800 mb-2">Update Incidence Report</h1>
          <p className="text-gray-600">Update the details about this incident below.</p>
        </div>

        {isRateLimited && (
          <div className="mb-6">
            <RateLimitedUI retryCount={retryCount} maxRetries={3} />
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-lg flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            Incidence updated successfully! Redirecting...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Reporter Name (disabled) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <User className="w-4 h-4 mr-1" />
              Reporter Name
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
              value={form.reporterName}
              disabled
            />
            <p className="text-xs text-gray-500 mt-1">Reporter name cannot be changed</p>
          </div>

          {/* Incidence Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Incidence Title
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Brief title describing the incident"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              Location
            </label>
            {fetchingFields ? (
              <div className="flex items-center px-4 py-2 border border-gray-300 rounded-lg bg-gray-100">
                <Loader className="w-4 h-4 animate-spin mr-2" />
                Loading fields...
              </div>
            ) : (
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                required
              >
                <option value="">Select a location</option>
                <option value="full_estate">Full Estate</option>
                {fields.map(field => (
                  <option key={field._id || field.id} value={field.name}>
                    {field.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Date of Incident
              </label>
              <input
                type="date"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                Time of Incident
              </label>
              <input
                type="time"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Type and Severity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type of Incident
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                required
              >
                <option value="">Select type</option>
                <option value="Injury">Injury</option>
                <option value="Equipment Damage">Equipment Damage</option>
                <option value="Environmental Hazard">Environmental Hazard</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severity Level
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value })}
                required
              >
                <option value="">Select severity</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <FileText className="w-4 h-4 mr-1" />
              Description of Incident
            </label>
            <textarea
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Provide detailed information about what happened..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Evidence (Optional)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
              <div className="space-y-1 text-center">
                {imagePreview ? (
                  <div className="relative">
                    <img src={imagePreview} alt="Preview" className="mx-auto h-32 w-auto object-contain" />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Camera className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none"
                      >
                        <span>Upload an image</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          onChange={handleImageChange}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              Status
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="Pending">Pending</option>
              <option value="Under Review">Under Review</option>
              <option value="Action Taken">Action Taken</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/incidence')}
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
                  Updating...
                </>
              ) : (
                'Update Report'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateIncidencePage;