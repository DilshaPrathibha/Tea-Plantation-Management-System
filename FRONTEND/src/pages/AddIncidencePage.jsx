import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Camera, 
  Upload, 
  X, 
  User, 
  MapPin, 
  Calendar, 
  Clock, 
  AlertCircle, 
  FileText, 
  CheckCircle, 
  Loader,
  Shield,
  AlertTriangle
} from 'lucide-react';
import Swal from 'sweetalert2';
import { uploadToSupabase } from '../utils/supabaseUpload'; // Import Supabase utility

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const AddIncidencePage = () => {
  const navigate = useNavigate();
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [success, setSuccess] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [uploadProgress, setUploadProgress] = useState(0);
  
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
    status: 'Pending',
    imageUrl: ''
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
    setForm(prev => ({ ...prev, reporterName: user.name || '' }));
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/fields`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFields(response.data.items || []);
    } catch (error) {
      console.error('Error fetching fields:', error);
    }
  };

  // Validation functions
  const validateForm = () => {
    const errors = {};
    const now = new Date();
    const selectedDate = new Date(form.date);
    const selectedDateTime = new Date(`${form.date}T${form.time}`);

    // Date validation - cannot be future date
    if (form.date && selectedDate > now) {
      errors.date = 'Date cannot be in the future';
    }

    // Time validation - if same date, time cannot be future
    if (form.date && form.time) {
      const isSameDate = selectedDate.toDateString() === now.toDateString();
      if (isSameDate && selectedDateTime > now) {
        errors.time = 'Time cannot be in the future for today';
      }
    }

    // Required field validations
    if (!form.title.trim()) errors.title = 'Title is required';
    if (!form.location) errors.location = 'Location is required';
    if (!form.date) errors.date = 'Date is required';
    if (!form.time) errors.time = 'Time is required';
    if (!form.type) errors.type = 'Incident type is required';
    if (!form.severity) errors.severity = 'Severity level is required';
    if (!form.description.trim()) errors.description = 'Description is required';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Please fix the errors in the form before submitting.',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    
    try {
      let imageUrl = '';
      
      // Upload image to Supabase if exists
      if (imageFile) {
        try {
          setUploadProgress(30);
          imageUrl = await uploadToSupabase(imageFile);
          setUploadProgress(100);
          console.log('Image uploaded successfully to Supabase:', imageUrl);
        } catch (uploadError) {
          console.error('Supabase upload failed:', uploadError);
          Swal.fire({
            icon: 'error',
            title: 'Image Upload Failed',
            text: uploadError.message || 'Failed to upload image. You can submit without image or try again.',
            confirmButtonColor: '#3b82f6'
          });
          setLoading(false);
          return;
        }
      }
      
      // Submit incidence data to your backend
      const token = localStorage.getItem('token');
      await axios.post(`${API}/api/incidences`, {
        ...form,
        imageUrl, // This will be the Supabase public URL
        reportedBy: currentUser._id
      }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/incidences', { state: { success: true } });
      }, 1500);
    } catch (error) {
      console.error('Error submitting incidence:', error);
      
      let errorMessage = 'Failed to submit incidence report. Please try again.';
      
      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
      } else if (error.request) {
        errorMessage = 'Network error: Could not connect to server. Please check your connection.';
      }
      
      Swal.fire({
        icon: 'error',
        title: 'Submission Failed',
        text: errorMessage,
        confirmButtonColor: '#3b82f6'
      });
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          icon: 'warning',
          title: 'File Too Large',
          text: 'Maximum file size is 5MB. Please choose a smaller file.',
          confirmButtonColor: '#3b82f6'
        });
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        Swal.fire({
          icon: 'warning',
          title: 'Invalid File Type',
          text: 'Please select an image file (JPEG, PNG, GIF, etc.).',
          confirmButtonColor: '#3b82f6'
        });
        return;
      }
      
      setImageFile(file);
      setValidationErrors(prev => ({ ...prev, image: undefined }));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  // Date and time handlers with validation
  const handleDateChange = (e) => {
    const value = e.target.value;
    setForm({ ...form, date: value });
    
    // Clear time if date is changed to future
    const selectedDate = new Date(value);
    const now = new Date();
    if (selectedDate > now) {
      setForm(prev => ({ ...prev, time: '' }));
    }
  };

  const handleTimeChange = (e) => {
    const value = e.target.value;
    setForm({ ...form, time: value });
  };

  // Get current date and time in required format for input fields
  const getCurrentDateTime = () => {
    const now = new Date();
    return {
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0, 5)
    };
  };

  const { date: currentDate, time: currentTime } = getCurrentDateTime();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Report New Incidence</h1>
          <p className="text-gray-600">Fill out all the details about the incident below</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-emerald-600 mr-2" />
            <span className="text-emerald-800 font-medium">Incidence submitted successfully! Redirecting...</span>
          </div>
        )}

        {/* Upload Progress */}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-800 font-medium">Uploading Image...</span>
              <span className="text-blue-600">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Main Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Reporter Name (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <User className="w-4 h-4 mr-2 text-blue-500" />
                Reporter Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-600"
                  value={form.reporterName}
                  readOnly
                  disabled
                />
                <Shield className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500 mt-1">Reporter name cannot be changed</p>
            </div>

            {/* Incidence Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Incidence Title *
              </label>
              <input
                type="text"
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  validationErrors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Brief title describing the incident"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              {validationErrors.title && (
                <p className="text-red-600 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {validationErrors.title}
                </p>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                Location *
              </label>
              <select
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  validationErrors.location ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              >
                <option value="">Select a location</option>
                <option value="full_estate">Full Estate</option>
                {fields.map(field => (
                  <option key={field._id} value={field.name}>{field.name}</option>
                ))}
              </select>
              {validationErrors.location && (
                <p className="text-red-600 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {validationErrors.location}
                </p>
              )}
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                  Date of Incident *
                </label>
                <input
                  type="date"
                  max={currentDate}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    validationErrors.date ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  value={form.date}
                  onChange={handleDateChange}
                />
                {validationErrors.date && (
                  <p className="text-red-600 text-sm mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {validationErrors.date}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-blue-500" />
                  Time of Incident *
                </label>
                <input
                  type="time"
                  max={form.date === currentDate ? currentTime : undefined}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    validationErrors.time ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  value={form.time}
                  onChange={handleTimeChange}
                  disabled={!form.date}
                />
                {validationErrors.time && (
                  <p className="text-red-600 text-sm mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {validationErrors.time}
                  </p>
                )}
              </div>
            </div>

            {/* Type and Severity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type of Incident *
                </label>
                <select
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    validationErrors.type ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="">Select type</option>
                  <option value="Injury">Injury</option>
                  <option value="Equipment Damage">Equipment Damage</option>
                  <option value="Environmental Hazard">Environmental Hazard</option>
                  <option value="Other">Other</option>
                </select>
                {validationErrors.type && (
                  <p className="text-red-600 text-sm mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {validationErrors.type}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Severity Level *
                </label>
                <select
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    validationErrors.severity ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  value={form.severity}
                  onChange={(e) => setForm({ ...form, severity: e.target.value })}
                >
                  <option value="">Select severity</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
                {validationErrors.severity && (
                  <p className="text-red-600 text-sm mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {validationErrors.severity}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <FileText className="w-4 h-4 mr-2 text-blue-500" />
                Description of Incident *
              </label>
              <textarea
                rows={4}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  validationErrors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Provide detailed information about what happened..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              {validationErrors.description && (
                <p className="text-red-600 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {validationErrors.description}
                </p>
              )}
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Evidence (Optional)
                <span className="text-green-600 ml-2 text-xs">✓ Supabase Storage</span>
              </label>
              <div className={`border-2 border-dashed rounded-xl transition-all duration-200 ${
                validationErrors.image ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}>
                <div className="p-6 text-center">
                  {imagePreview ? (
                    <div className="relative inline-block">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="max-w-full h-32 object-cover rounded-lg mx-auto" 
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Camera className="mx-auto w-12 h-12 text-gray-400 mb-3" />
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                        <label className="cursor-pointer bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center">
                          <Upload className="w-4 h-4 mr-2" />
                          Upload to Supabase
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageChange}
                          />
                        </label>
                        <span className="text-gray-500 text-sm">or drag and drop</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">PNG, JPG, GIF up to 5MB</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 text-blue-500" />
                Status
              </label>
              <select
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/incidences')}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                    {uploadProgress > 0 ? 'Uploading...' : 'Submitting...'}
                  </>
                ) : (
                  'Submit Report'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Form Tips */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-medium text-blue-900 mb-2 flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            Form Tips
          </h3>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• All fields marked with * are required</li>
            <li>• Date and time cannot be in the future</li>
            <li>• Images are securely stored in Supabase Cloud Storage</li>
            <li>• Provide detailed descriptions for better tracking</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AddIncidencePage;