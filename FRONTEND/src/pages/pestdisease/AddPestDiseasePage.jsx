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
  AlertCircle, 
  FileText, 
  CheckCircle, 
  Loader,
  Shield,
  Map,
  Ruler,
  Navigation,
  Bug,
  Leaf,
  Maximize2,
  ArrowLeft
} from 'lucide-react';
import Swal from 'sweetalert2';
import { uploadToSupabase } from '../../utils/supabaseUpload';

// Leaflet imports for real map
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix default icon paths for Leaflet (Vite/webpack friendly)
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const AddPestDiseasePage = () => {
  const navigate = useNavigate();
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [userLocation, setUserLocation] = useState(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [showOtherAction, setShowOtherAction] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const [form, setForm] = useState({
    reporterName: '',
    title: '',
    location: '',
    date: '',
    type: 'Pest Infestation',
    urgency: 'Medium (Schedule treatment)',
    economicImpact: 'Moderate (5-20% loss)',
    description: '',
    affectedArea: 0.5,
    requestedActions: [],
    otherAction: '',
    mapCoordinates: { lat: null, lng: null },
    status: 'Pending',
    imageUrl: ''
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
    setForm(prev => ({ ...prev, reporterName: user.name || '' }));
    fetchFields();
    setCurrentDate();
  }, []);

  useEffect(() => {
    // Keep selectedLocation in sync with form.mapCoordinates (in case form is prefilled)
    if (form.mapCoordinates && form.mapCoordinates.lat && form.mapCoordinates.lng) {
      setSelectedLocation(form.mapCoordinates);
    }
  }, []);

  const setCurrentDate = () => {
    const now = new Date();
    const today = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    setForm(prev => ({
      ...prev,
      date: today
    }));
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
    }
  };

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      Swal.fire({
        icon: 'error',
        title: 'Geolocation not supported',
        text: 'Your browser does not support geolocation.',
        confirmButtonColor: '#10b981'
      });
      return;
    }

    setMapLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newLocation = { lat: latitude, lng: longitude };
        setUserLocation(newLocation);
        setSelectedLocation(newLocation);
        setForm(prev => ({
          ...prev,
          mapCoordinates: newLocation
        }));
        setMapLoading(false);
        
        Swal.fire({
          icon: 'success',
          title: 'Location captured!',
          text: `Latitude: ${latitude.toFixed(6)}, Longitude: ${longitude.toFixed(6)}`,
          confirmButtonColor: '#10b981'
        });
      },
      (error) => {
        console.error('Error getting location:', error);
        setMapLoading(false);
        Swal.fire({
          icon: 'error',
          title: 'Location error',
          text: 'Unable to retrieve your location. Please ensure location services are enabled.',
          confirmButtonColor: '#10b981'
        });
      },
      { timeout: 10000 }
    );
  };

  // Click handler removed (used only for placeholder). We now use real Leaflet map click events.
  const handleMapClick = (event) => {
    // kept for backward compatibility but not used by the real map
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const lat = 6.9271 + (y / rect.height - 0.5) * 0.1;
    const lng = 79.8612 + (x / rect.width - 0.5) * 0.1;
    const newLocation = { lat, lng };
    setSelectedLocation(newLocation);
    setForm(prev => ({
      ...prev,
      mapCoordinates: newLocation
    }));
  };

  const handleActionChange = (action) => {
    setForm(prev => {
      const newActions = prev.requestedActions.includes(action)
        ? prev.requestedActions.filter(a => a !== action)
        : [...prev.requestedActions, action];
      
      setShowOtherAction(newActions.includes('Other'));
      
      return { ...prev, requestedActions: newActions };
    });
  };

  const validateForm = () => {
    const errors = {};
    const now = new Date();
    const selectedDate = new Date(form.date);

    // Reset time part for date comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    if (form.date && selectedDate > today) {
      errors.date = 'Date cannot be in the future';
    }

    if (!form.title.trim()) errors.title = 'Title is required';
    if (!form.location) errors.location = 'Location is required';
    if (!form.date) errors.date = 'Date is required';
    if (!form.type) errors.type = 'Issue type is required';
    if (!form.urgency) errors.urgency = 'Urgency level is required';
    if (!form.economicImpact) errors.economicImpact = 'Economic impact level is required';
    if (!form.description.trim()) errors.description = 'Description is required';
    
    if (!form.affectedArea || form.affectedArea < 0.5) {
      errors.affectedArea = 'Affected area must be at least 0.5 perch';
    } else if (form.affectedArea > 2000) {
      errors.affectedArea = 'Affected area cannot exceed 2000 perch';
    }

    if (form.requestedActions.includes('Other') && !form.otherAction.trim()) {
      errors.otherAction = 'Please specify the other action required';
    }

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
      confirmButtonColor: '#10b981'
    });
    return;
  }

  setLoading(true);
  setUploadProgress(0);
  
  try {
    let imageUrl = '';
    
    if (imageFile) {
      try {
        setUploadProgress(30);
        imageUrl = await uploadToSupabase(imageFile);
        setUploadProgress(100);
      } catch (uploadError) {
        console.error('Supabase upload failed:', uploadError);
        Swal.fire({
          icon: 'error',
          title: 'Image Upload Failed',
          text: uploadError.message || 'Failed to upload image. You can submit without image or try again.',
          confirmButtonColor: '#10b981'
        });
        setLoading(false);
        return;
      }
    }
    
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Prepare the data exactly as backend expects
    const submitData = {
      reporterName: form.reporterName,
      title: form.title,
      location: form.location,
      date: form.date,
      type: form.type,
      urgency: form.urgency,
      economicImpact: form.economicImpact,
      description: form.description,
      affectedArea: parseFloat(form.affectedArea),
      requestedActions: form.requestedActions,
      otherAction: form.otherAction,
      mapCoordinates: form.mapCoordinates,
      status: form.status,
      imageUrl: imageUrl
      // reportedBy is handled by backend from the token
    };

    console.log('Submitting data:', submitData);
    console.log('User from localStorage:', user);
    
    const response = await axios.post(`${API}/api/pest-diseases`, submitData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    await Swal.fire({
      icon: 'success',
      title: 'Report Submitted!',
      text: 'Pest/Disease report has been created successfully.',
      confirmButtonColor: '#10b981'
    });
    
    navigate('/supervisor/pest-disease', { state: { success: true } });
  } catch (error) {
    console.error('Error submitting pest/disease report:', error);
    
    let errorMessage = 'Failed to submit pest/disease report. Please try again.';
    
    if (error.response) {
      errorMessage = error.response.data.message || errorMessage;
      console.error('Backend error details:', error.response.data);
      console.error('Backend error status:', error.response.status);
      
      // Show more detailed error information
      if (error.response.data.error) {
        errorMessage += `\n\nTechnical details: ${error.response.data.error}`;
      }
    } else if (error.request) {
      errorMessage = 'Network error: Could not connect to server. Please check your connection.';
    }
    
    Swal.fire({
      icon: 'error',
      title: 'Submission Failed',
      text: errorMessage,
      confirmButtonColor: '#10b981'
    });
  } finally {
    setLoading(false);
    setUploadProgress(0);
  }
};

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          icon: 'warning',
          title: 'File Too Large',
          text: 'Maximum file size is 5MB. Please choose a smaller file.',
          confirmButtonColor: '#10b981'
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        Swal.fire({
          icon: 'warning',
          title: 'Invalid File Type',
          text: 'Please select an image file (JPEG, PNG, GIF, etc.).',
          confirmButtonColor: '#10b981'
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

  const handleAffectedAreaChange = (value) => {
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue) && numericValue >= 0.5 && numericValue <= 2000) {
      setForm(prev => ({ ...prev, affectedArea: numericValue }));
    }
  };

  const quickAreaSelect = (area) => {
    setForm(prev => ({ ...prev, affectedArea: area }));
  };

  const getMaxDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Component to handle map clicks and update form state
  const LocationSelector = ({ center }) => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        const newLocation = { lat, lng };
        setSelectedLocation(newLocation);
        setForm(prev => ({ ...prev, mapCoordinates: newLocation }));
      }
    });
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header with Back Button */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/supervisor/pest-disease')}
            className="flex items-center text-gray-700 hover:text-gray-900 transition-colors mr-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">New Pest/Disease Report</h1>
            <p className="text-gray-700">Report agricultural threats to protect crop health</p>
          </div>
        </div>

        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-800 font-medium">Uploading Image...</span>
              <span className="text-green-700">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-green-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Reporter Name */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2 flex items-center">
                <User className="w-4 h-4 mr-2 text-green-600" />
                Reporter Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  value={form.reporterName}
                  readOnly
                />
                <Shield className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              </div>
            </div>

            {/* Report Title */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Report Title *
              </label>
              <input
                type="text"
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 ${
                  validationErrors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Brief title describing the pest/disease issue"
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
              <label className="block text-sm font-medium text-gray-900 mb-2 flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-green-600" />
                Location *
              </label>
              <select
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 ${
                  validationErrors.location ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              >
                <option value="" className="text-gray-500">Select a location</option>
                <option value="full_estate" className="text-gray-900">Full Estate</option>
                {fields.map(field => (
                  <option key={field._id} value={field.name} className="text-gray-900">{field.name}</option>
                ))}
              </select>
              {validationErrors.location && (
                <p className="text-red-600 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {validationErrors.location}
                </p>
              )}
            </div>

            {/* Map Location */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2 flex items-center">
                <Map className="w-4 h-4 mr-2 text-green-600" />
                Map Location
              </label>
              <div className="space-y-3">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 bg-white">
                  {selectedLocation ? (
                    <div className="text-center">
                      <div className="bg-green-50 rounded-lg p-3 mb-3">
                        <p className="text-sm font-medium text-green-900">Location Set</p>
                        <p className="text-xs text-green-800">
                          Lat: {selectedLocation.lat?.toFixed(6)}, Lng: {selectedLocation.lng?.toFixed(6)}
                        </p>
                      </div>
                      <div className="flex gap-2 justify-center">
                        <button
                          type="button"
                          onClick={() => setShowMapModal(true)}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm"
                        >
                          <Maximize2 className="w-4 h-4 mr-1" />
                          Change on Map
                        </button>
                        <button
                          type="button"
                          onClick={getUserLocation}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm"
                        >
                          <Navigation className="w-4 h-4 mr-1" />
                          Use Current
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Map className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                      <div className="flex gap-2 justify-center">
                        <button
                          type="button"
                          onClick={() => setShowMapModal(true)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                        >
                          <Map className="w-4 h-4 mr-2" />
                          Select on Map
                        </button>
                        <button
                          type="button"
                          onClick={getUserLocation}
                          disabled={mapLoading}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center"
                        >
                          {mapLoading ? (
                            <Loader className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Navigation className="w-4 h-4 mr-2" />
                          )}
                          {mapLoading ? 'Getting...' : 'Use Current'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Date of Observation */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-green-600" />
                Date of Observation *
              </label>
              <input
                type="date"
                max={getMaxDate()}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 ${
                  validationErrors.date ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
              {validationErrors.date && (
                <p className="text-red-600 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {validationErrors.date}
                </p>
              )}
            </div>

            {/* Issue Type and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Issue Type *
                </label>
                <select
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 ${
                    validationErrors.type ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="Pest Infestation" className="text-gray-900">Pest Infestation</option>
                  <option value="Disease" className="text-gray-900">Disease</option>
                  <option value="Both" className="text-gray-900">Both</option>
                  <option value="Other" className="text-gray-900">Other</option>
                </select>
                {validationErrors.type && (
                  <p className="text-red-600 text-sm mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {validationErrors.type}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Status
                </label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="Pending" className="text-gray-900">Pending</option>
                  <option value="Monitoring" className="text-gray-900">Monitoring</option>
                  <option value="Treatment Ongoing" className="text-gray-900">Treatment Ongoing</option>
                </select>
                <p className="text-xs text-gray-700 mt-1">Initial status when creating report</p>
              </div>
            </div>

            {/* Urgency and Economic Impact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Urgency Level *
                </label>
                <select
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 ${
                    validationErrors.urgency ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  value={form.urgency}
                  onChange={(e) => setForm({ ...form, urgency: e.target.value })}
                >
                  <option value="Low (Routine monitoring)" className="text-gray-900">Low (Routine monitoring)</option>
                  <option value="Medium (Schedule treatment)" className="text-gray-900">Medium (Schedule treatment)</option>
                  <option value="High (Immediate action needed)" className="text-gray-900">High (Immediate action needed)</option>
                  <option value="Emergency (Critical threat)" className="text-gray-900">Emergency (Critical threat)</option>
                </select>
                {validationErrors.urgency && (
                  <p className="text-red-600 text-sm mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {validationErrors.urgency}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Economic Impact Level *
                </label>
                <select
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 ${
                    validationErrors.economicImpact ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  value={form.economicImpact}
                  onChange={(e) => setForm({ ...form, economicImpact: e.target.value })}
                >
                  <option value="Minimal (<5% loss)" className="text-gray-900">Minimal (&lt;5% loss)</option>
                  <option value="Moderate (5-20% loss)" className="text-gray-900">Moderate (5-20% loss)</option>
                  <option value="Significant (20-50% loss)" className="text-gray-900">Significant (20-50% loss)</option>
                  <option value="Severe (>50% loss)" className="text-gray-900">Severe (&gt;50% loss)</option>
                </select>
                {validationErrors.economicImpact && (
                  <p className="text-red-600 text-sm mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {validationErrors.economicImpact}
                  </p>
                )}
              </div>
            </div>

            {/* Affected Area */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2 flex items-center">
                <Ruler className="w-4 h-4 mr-2 text-green-600" />
                Affected Area (Perch) *
                <span className="ml-2 text-xs text-gray-700">0.5 - 2000 perch</span>
              </label>
              
              {/* Quick selection buttons */}
              <div className="flex flex-wrap gap-2 mb-3">
                {[0.5, 5, 10, 25, 50, 100, 500, 1000].map(area => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => quickAreaSelect(area)}
                    className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
                      form.affectedArea === area 
                        ? 'bg-green-600 text-white border-green-600' 
                        : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {area} P
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => handleAffectedAreaChange(Math.max(0.5, form.affectedArea - 0.5))}
                  disabled={form.affectedArea <= 0.5}
                  className="px-4 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold text-lg text-gray-900"
                >
                  -
                </button>
                <div className="flex-1">
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="2000"
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-center bg-white text-gray-900 ${
                      validationErrors.affectedArea ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    value={form.affectedArea}
                    onChange={(e) => handleAffectedAreaChange(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleAffectedAreaChange(Math.min(2000, form.affectedArea + 0.5))}
                  disabled={form.affectedArea >= 2000}
                  className="px-4 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold text-lg text-gray-900"
                >
                  +
                </button>
              </div>
              <div className="flex justify-between text-xs text-gray-700 mt-1">
                <span>Min: 0.5 perch</span>
                <span>Max: 2000 perch</span>
              </div>
              {validationErrors.affectedArea && (
                <p className="text-red-600 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {validationErrors.affectedArea}
                </p>
              )}
            </div>

            {/* Requested Actions */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2 flex items-center">
                <Leaf className="w-4 h-4 mr-2 text-green-600" />
                Requested Actions
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {['Fertilizer', 'Insecticide', 'Fungicide', 'Manual Intervention', 'Other'].map((action) => (
                  <label key={action} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.requestedActions.includes(action)}
                      onChange={() => handleActionChange(action)}
                      className="w-4 h-4 text-green-600 rounded focus:ring-green-500 bg-white border-gray-300"
                    />
                    <span className="text-sm text-gray-900">{action}</span>
                  </label>
                ))}
              </div>
              
              {showOtherAction && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Specify Other Action *
                  </label>
                  <input
                    type="text"
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900 ${
                      validationErrors.otherAction ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Please specify the required action..."
                    value={form.otherAction}
                    onChange={(e) => setForm({ ...form, otherAction: e.target.value })}
                  />
                  {validationErrors.otherAction && (
                    <p className="text-red-600 text-sm mt-1 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {validationErrors.otherAction}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2 flex items-center">
                <FileText className="w-4 h-4 mr-2 text-green-600" />
                Description & Symptoms *
              </label>
              <textarea
                rows={4}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 ${
                  validationErrors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Describe the symptoms, appearance, damage observed, and any other relevant details..."
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
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Upload Evidence (Optional)
                <span className="text-green-600 ml-2 text-xs">✓ Supabase Storage</span>
              </label>
              <div className={`border-2 border-dashed rounded-xl transition-all duration-200 bg-white ${
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
                      <Camera className="mx-auto w-12 h-12 text-gray-500 mb-3" />
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
                        <span className="text-gray-700 text-sm">or drag and drop</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">PNG, JPG, GIF up to 5MB</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/supervisor/pest-disease')}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-900 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium bg-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center justify-center"
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
        <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4">
          <h3 className="font-medium text-green-900 mb-2 flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            Form Tips
          </h3>
          <ul className="text-green-900 text-sm space-y-1">
            <li>• All fields marked with * are required</li>
            <li>• Use map or current location for precise GPS coordinates</li>
            <li>• Provide detailed descriptions for accurate diagnosis</li>
            <li>• Select appropriate urgency and economic impact levels</li>
            <li>• Request actions needed to resolve the issue</li>
          </ul>
        </div>
      </div>

      {/* Map Modal */}
      {showMapModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Select Location on Map</h3>
                <button
                  onClick={() => setShowMapModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {/* Real interactive Leaflet map */}
              <div className="w-full h-96 rounded-lg relative border-2 border-gray-300 overflow-hidden">
                <MapContainer
                  center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : [6.9271, 79.8612]}
                  zoom={selectedLocation ? 13 : 8}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  <LocationSelector />

                  {selectedLocation && (
                    <Marker position={[selectedLocation.lat, selectedLocation.lng]} />
                  )}
                </MapContainer>
              </div>

              {selectedLocation && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-900">Selected Coordinates</p>
                  <p className="text-xs text-green-800 font-mono">
                    Latitude: {selectedLocation.lat?.toFixed(6)}, Longitude: {selectedLocation.lng?.toFixed(6)}
                  </p>
                </div>
              )}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowMapModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setShowMapModal(false)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Confirm Location
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddPestDiseasePage;
