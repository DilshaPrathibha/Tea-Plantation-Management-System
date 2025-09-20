import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../utils/api';
import { 
  Camera, Upload, X, User, MapPin, Calendar, AlertCircle, 
  FileText, CheckCircle, Map, Ruler, Loader, ArrowLeft 
} from 'lucide-react';
import FieldActionNav from '@/components/FieldActionNav';
import Swal from 'sweetalert2';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const UpdatePestDiseasePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const handleBack = () => {
    navigate('/pest-diseases');
  };
  const [imagePreview, setImagePreview] = useState(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  // Form state
  const [form, setForm] = useState({
    issueType: '',
    pestDiseaseName: '',
    location: '',
    mapCoordinates: { lat: null, lng: null },
    date: '',
    severity: '',
    description: '',
    affectedArea: 1,
    requestedActions: [],
    status: 'Pending'
  });

  // Fetch report data and available fields
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Fetch report data
        const reportResponse = await api.get(`/api/pest-diseases/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const reportData = reportResponse.data.pestDisease;
        
        // Format date for input field (YYYY-MM-DD)
        const formattedDate = reportData.date 
          ? new Date(reportData.date).toISOString().split('T')[0]
          : '';
        
        // Update form with existing data
        setForm({
          issueType: reportData.issueType || '',
          pestDiseaseName: reportData.pestDiseaseName || '',
          location: reportData.location || '',
          mapCoordinates: reportData.mapCoordinates || { lat: null, lng: null },
          date: formattedDate,
          severity: reportData.severity || '',
          description: reportData.description || '',
          affectedArea: reportData.affectedArea || 1,
          requestedActions: reportData.requestedActions || [],
          status: reportData.status || 'Pending'
        });
        
        // Fetch fields for location dropdown
        const fieldsResponse = await api.get(`/api/fields`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFields(fieldsResponse.data.items || []);
        
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load report data. Please try again.');
      } finally {
        setFetching(false);
      }
    };
    
    fetchData();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate status change to "Resolved"
    if (form.status === 'Resolved') {
      const result = await Swal.fire({
        title: 'Confirm Resolution',
        text: 'Are you sure this issue has been completely resolved?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#059669',
        cancelButtonColor: '#DC2626',
        confirmButtonText: 'Yes, mark as resolved',
        cancelButtonText: 'Cancel'
      });
      
      if (!result.isConfirmed) {
        return;
      }
    }
    
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      // Append form fields to FormData
      Object.keys(form).forEach(key => {
        if (key === 'mapCoordinates') {
          formData.append(key, JSON.stringify(form[key]));
        } else {
          formData.append(key, form[key]);
        }
      });
      // Handle image upload if there's a new image
      if (imagePreview) {
        const response = await fetch(imagePreview);
        const blob = await response.blob();
        formData.append('image', blob);
      }
      await api.patch(`/api/pest-diseases/${id}`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`
        }
      });
      await Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Report updated successfully.',
        confirmButtonColor: '#059669'
      });
      navigate('/pest-diseases');
    } catch (error) {
      console.error('Error updating report:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error?.response?.data?.message || 'Failed to update report. Please try again.',
        confirmButtonColor: '#059669'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
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

  const handleCheckboxChange = (action) => {
    setForm(prev => ({
      ...prev,
      requestedActions: prev.requestedActions.includes(action)
        ? prev.requestedActions.filter(a => a !== action)
        : [...prev.requestedActions, action]
    }));
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-green-50 py-10 px-4 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader className="w-8 h-8 animate-spin text-green-600 mb-4" />
          <div className="text-lg">Loading report data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50">
      <FieldActionNav />
      
      <div className="py-6 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header with back button */}
          <div className="flex items-center mb-6">
            <button 
              onClick={handleBack}
              className="inline-flex items-center text-green-600 hover:text-green-700 mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Reports
            </button>
            <h1 className="text-2xl font-bold text-green-800">Update Pest/Disease Report</h1>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="mb-6">
              <p className="text-gray-600">Update the details about this agricultural threat</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-lg flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Report updated successfully! Redirecting...
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
              value={JSON.parse(localStorage.getItem('user') || '{}').name || ''}
              disabled
            />
          </div>

          {/* Date of Report (disabled) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              Date of Report
            </label>
            <input
              type="date"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
              value={form.date}
              disabled
            />
            <p className="text-xs text-gray-500 mt-1">Report date cannot be changed</p>
          </div>

          {/* Type of Issue */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type of Issue
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              value={form.issueType}
              onChange={(e) => setForm({ ...form, issueType: e.target.value })}
              required
            >
              <option value="Pest Infestation">Pest Infestation</option>
              <option value="Disease">Disease</option>
              <option value="Both">Both</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Pest/Disease Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pest/Disease Name
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Enter the name of the pest or disease"
              value={form.pestDiseaseName}
              onChange={(e) => setForm({ ...form, pestDiseaseName: e.target.value })}
              required
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              Location
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              required
            >
              <option value="">Select a field location</option>
              {fields.map(field => (
                <option key={field._id} value={field.name}>{field.name}</option>
              ))}
            </select>
          </div>

          {/* Map Location (Placeholder) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Map className="w-4 h-4 mr-1" />
              Map Location (Optional)
            </label>
            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 text-center">
              <p className="text-gray-500 text-sm">Map integration will be implemented in future version</p>
            </div>
          </div>

          {/* Severity Level */}
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
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          {/* Affected Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Ruler className="w-4 h-4 mr-1" />
              Estimated Affected Area (Acres)
            </label>
            <input
              type="number"
              min="1"
              max="5"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              value={form.affectedArea}
              onChange={(e) => setForm({ ...form, affectedArea: parseInt(e.target.value) })}
              required
            />
            <p className="text-xs text-gray-500 mt-1">Must be between 1-5 acres</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <FileText className="w-4 h-4 mr-1" />
              Description of Symptoms
            </label>
            <textarea
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Describe the symptoms, appearance, and any observations..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
          </div>

          {/* Requested Actions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Requested Actions
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['Fertilizer', 'Insecticide', 'Fungicide', 'Manual Intervention', 'Other'].map(action => (
                <label key={action} className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={form.requestedActions.includes(action)}
                    onChange={() => handleCheckboxChange(action)}
                  />
                  <span className="text-sm">{action}</span>
                </label>
              ))}
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
              <option value="Monitoring">Monitoring</option>
              <option value="Treatment Ongoing">Treatment Ongoing</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Evidence Images (Optional)
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

          {/* Buttons */}
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/pest-diseases')}
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
      </div>
    </div>
  );
};

export default UpdatePestDiseasePage;