import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { uploadToSupabase, deleteFromSupabase } from '../../utils/supabaseUpload';

// Leaflet imports for real map
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix default icon paths
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const UpdatePestDiseasePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [originalImageUrl, setOriginalImageUrl] = useState('');
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
    type: '',
    urgency: '',
    economicImpact: '',
    description: '',
    affectedArea: 0.5,
    requestedActions: [],
    otherAction: '',
    mapCoordinates: { lat: null, lng: null },
    status: 'Pending',
    imageUrl: ''
  });

  useEffect(() => {
    fetchCurrentUser();
    fetchFields();
    fetchReportData();
  }, [id]);

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

  const fetchFields = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/fields`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFields(response.data.items || []);
    } catch (error) {
      console.error('Error fetching fields:', error);
      setFields([]);
    }
  };

  const fetchReportData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const reportResponse = await axios.get(`${API}/api/pest-diseases/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const reportData = reportResponse.data.pestDisease;
      
      if (currentUser && currentUser._id !== reportData.reportedBy) {
        await Swal.fire({
          icon: 'warning',
          title: 'Access Denied',
          text: 'Only the reporter can edit this pest/disease report.',
          confirmButtonColor: '#10b981',
          background: '#ffffff',
          customClass: { popup: 'rounded-2xl shadow-2xl' }
        });
        navigate('/supervisor/pest-disease');
        return;
      }
      
      if (reportData.status === 'Resolved') {
        await Swal.fire({
          icon: 'warning',
          title: 'Cannot Edit',
          text: 'Resolved pest/disease reports cannot be edited.',
          confirmButtonColor: '#10b981',
          background: '#ffffff',
          customClass: { popup: 'rounded-2xl shadow-2xl' }
        });
        navigate(`/supervisor/pest-disease/${id}`);
        return;
      }
      
      const formattedDate = reportData.date 
        ? new Date(reportData.date).toISOString().split('T')[0]
        : '';
      
      setOriginalImageUrl(reportData.imageUrl || '');
      setUserLocation(reportData.mapCoordinates || null);
      setSelectedLocation(reportData.mapCoordinates || null);
      setShowOtherAction(reportData.requestedActions?.includes('Other') || false);
      
      setForm({
        reporterName: reportData.reporterName || '',
        title: reportData.title || '',
        location: reportData.location || '',
        date: formattedDate,
        type: reportData.type || '',
        urgency: reportData.urgency || '',
        economicImpact: reportData.economicImpact || '',
        description: reportData.description || '',
        affectedArea: reportData.affectedArea || 0.5,
        requestedActions: reportData.requestedActions || [],
        otherAction: reportData.otherAction || '',
        mapCoordinates: reportData.mapCoordinates || { lat: null, lng: null },
        status: reportData.status || 'Pending',
        imageUrl: reportData.imageUrl || ''
      });

      if (reportData.imageUrl) {
        setImagePreview(reportData.imageUrl);
      }
    } catch (error) {
      console.error('Error fetching pest/disease data:', error);
      setError('Failed to load report data. Please try again.');
    } finally {
      setFetching(false);
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
          title: 'Location Updated!',
          text: `New coordinates captured.`,
          confirmButtonColor: '#10b981'
        });
      },
      (error) => {
        console.error('Error getting location:', error);
        setMapLoading(false);
        Swal.fire({
          icon: 'error',
          title: 'Location error',
          text: 'Unable to retrieve your location.',
          confirmButtonColor: '#10b981'
        });
      }
    );
  };

  const handleMapClick = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Simulate coordinates (in real implementation, use actual map coordinates)
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
      await Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Please fix the errors in the form before submitting.',
        confirmButtonColor: '#10b981'
      });
      return;
    }

    if (form.status === 'Resolved') {
      const result = await Swal.fire({
        title: 'Confirm Resolution',
        text: 'Are you sure this issue has been completely resolved?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#DC2626',
        confirmButtonText: 'Yes, mark as resolved',
        cancelButtonText: 'Cancel'
      });
      
      if (!result.isConfirmed) {
        return;
      }
    }

    setLoading(true);
    setUploadProgress(0);
    setError('');
    
    try {
      let finalImageUrl = form.imageUrl;

      if (imageFile) {
        try {
          setUploadProgress(30);
          finalImageUrl = await uploadToSupabase(imageFile);
          setUploadProgress(100);
          
          if (originalImageUrl && originalImageUrl !== finalImageUrl) {
            try {
              await deleteFromSupabase(originalImageUrl);
            } catch (deleteError) {
              console.warn('Could not delete old image:', deleteError);
            }
          }
        } catch (uploadError) {
          console.error('Supabase upload failed:', uploadError);
          await Swal.fire({
            icon: 'error',
            title: 'Image Upload Failed',
            text: uploadError.message || 'Failed to upload image.',
            confirmButtonColor: '#10b981'
          });
          setLoading(false);
          return;
        }
      }

      const token = localStorage.getItem('token');
      
      const updateData = {
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
        imageUrl: finalImageUrl
      };

      console.log('Updating data:', updateData);
      
      await axios.patch(`${API}/api/pest-diseases/${id}`, updateData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      await Swal.fire({
        icon: 'success',
        title: 'Report Updated!',
        text: 'Pest/Disease report has been updated successfully.',
        confirmButtonColor: '#10b981'
      });
      
      navigate('/supervisor/pest-disease', { state: { success: true } });
    } catch (error) {
      console.error('Error updating pest/disease report:', error);
      
      let errorMessage = 'Failed to update pest/disease report. Please try again.';
      
      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
        console.error('Backend error details:', error.response.data);
      } else if (error.request) {
        errorMessage = 'Network error: Could not connect to server.';
      }
      
      setError(errorMessage);
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
    if (imageFile) {
      setImageFile(null);
      setImagePreview(originalImageUrl || null);
      setForm(prev => ({ ...prev, imageUrl: originalImageUrl || '' }));
    } else if (originalImageUrl) {
      Swal.fire({
        title: 'Image Options',
        text: 'What would you like to do with the current image?',
        icon: 'question',
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: 'Remove completely',
        denyButtonText: 'Replace with new image',
        cancelButtonText: 'Keep current image',
        confirmButtonColor: '#ef4444',
        denyButtonColor: '#10b981',
        cancelButtonColor: '#6b7280',
        background: '#ffffff',
        customClass: { popup: 'rounded-2xl shadow-2xl' }
      }).then((result) => {
        if (result.isConfirmed) {
          deleteFromSupabase(originalImageUrl).then(success => {
            if (success) {
              setForm(prev => ({ ...prev, imageUrl: '' }));
              setOriginalImageUrl('');
              setImagePreview(null);
              Swal.fire({
                icon: 'success',
                title: 'Image Removed',
                text: 'The evidence image has been removed.',
                confirmButtonColor: '#10b981'
              });
            }
          });
        } else if (result.isDenied) {
          setImagePreview(null);
          setForm(prev => ({ ...prev, imageUrl: '' }));
          setOriginalImageUrl('');
        }
      });
    } else {
      setImagePreview(null);
      setForm(prev => ({ ...prev, imageUrl: '' }));
    }
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

  const incrementAffectedArea = () => {
    if (form.affectedArea < 2000) {
      setForm(prev => ({ ...prev, affectedArea: Math.min(2000, prev.affectedArea + 0.5) }));
    }
  };

  const decrementAffectedArea = () => {
    if (form.affectedArea > 0.5) {
      setForm(prev => ({ ...prev, affectedArea: Math.max(0.5, prev.affectedArea - 0.5) }));
    }
  };

  const getMaxDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

   // Leaflet click component
  const LocationSelector = () => {
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

  if (fetching) {
    return (
      <div className="min-h-screen bg-base-100 py-8 px-4 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-4" />
          <div className="text-lg text-emerald-900">Loading report data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header with Back Button */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate(`/supervisor/pest-disease/${id}`)}
            className="flex items-center text-emerald-900 hover:text-emerald-900 transition-colors mr-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Details
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-3xl font-bold text-emerald-900 mb-2">Update Pest/Disease Report</h1>
            <p className="text-emerald-900">Update the details about this agricultural threat</p>
          </div>
        </div>

        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-emerald-900 font-medium">Uploading Image...</span>
              <span className="text-emerald-800">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-emerald-200 rounded-full h-2">
              <div 
                className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
            <span className="text-red-900">{error}</span>
          </div>
        )}

        <div className="bg-emerald-50 rounded-2xl shadow-sm border border-emerald-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Reporter Name */}
            <div>
              <label className="block text-sm font-medium text-emerald-900 mb-2 flex items-center">
                <User className="w-4 h-4 mr-2 text-emerald-600" />
                Reporter Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-emerald-200 rounded-xl bg-emerald-50/70 text-emerald-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  value={form.reporterName}
                  readOnly
                />
                <Shield className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-emerald-800/70" />
              </div>
            </div>

            {/* Report Title */}
            <div>
              <label className="block text-sm font-medium text-emerald-900 mb-2">
                Report Title *
              </label>
              <input
                type="text"
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white text-emerald-900 ${
                  validationErrors.title ? 'border-red-300 bg-red-50' : 'border-emerald-200'
                }`}
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
              <label className="block text-sm font-medium text-emerald-900 mb-2 flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-emerald-600" />
                Location *
              </label>
              <select
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white text-emerald-900 ${
                  validationErrors.location ? 'border-red-300 bg-red-50' : 'border-emerald-200'
                }`}
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              >
                <option value="" className="text-emerald-800/70">Select a location</option>
                <option value="full_estate" className="text-emerald-900">Full Estate</option>
                {fields.map(field => (
                  <option key={field._id} value={field.name} className="text-emerald-900">{field.name}</option>
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
              <label className="block text-sm font-medium text-emerald-900 mb-2 flex items-center">
                <Map className="w-4 h-4 mr-2 text-emerald-600" />
                Map Location
              </label>
              <div className="space-y-3">
                <div className="border-2 border-dashed border-emerald-200 rounded-xl p-4 bg-emerald-50">
                  {selectedLocation ? (
                    <div className="text-center">
                      <div className="bg-emerald-50 rounded-lg p-3 mb-3">
                        <p className="text-sm font-medium text-emerald-900">Location Set</p>
                        <p className="text-xs text-emerald-800">
                          Lat: {selectedLocation.lat?.toFixed(6)}, Lng: {selectedLocation.lng?.toFixed(6)}
                        </p>
                      </div>
                      <div className="flex gap-2 justify-center">
                        <button
                          type="button"
                          onClick={() => setShowMapModal(true)}
                          className="px-3 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center text-sm"
                        >
                          <Maximize2 className="w-4 h-4 mr-1" />
                          Change on Map
                        </button>
                        <button
                          type="button"
                          onClick={getUserLocation}
                          className="px-3 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center text-sm"
                        >
                          <Navigation className="w-4 h-4 mr-1" />
                          Use Current
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Map className="w-8 h-8 text-emerald-800/70 mx-auto mb-2" />
                      <div className="flex gap-2 justify-center">
                        <button
                          type="button"
                          onClick={() => setShowMapModal(true)}
                          className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center"
                        >
                          <Map className="w-4 h-4 mr-2" />
                          Select on Map
                        </button>
                        <button
                          type="button"
                          onClick={getUserLocation}
                          disabled={mapLoading}
                          className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors flex items-center"
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

            {/* Map Modal with Leaflet */}
            {showMapModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-emerald-50 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                  <div className="p-6 border-b border-emerald-100">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-emerald-900">Select Location on Map</h3>
                      <button
                        onClick={() => setShowMapModal(false)}
                        className="p-2 hover:bg-emerald-100/70 rounded-lg text-emerald-900"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <MapContainer
                      center={selectedLocation || { lat: 7.8731, lng: 80.7718 }} // Default: Sri Lanka
                      zoom={8}
                      style={{ height: "400px", width: "100%" }}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
                      />
                      <LocationSelector />
                      {selectedLocation && <Marker position={selectedLocation} />}
                    </MapContainer>

                    {selectedLocation && (
                      <div className="mt-4 p-3 bg-emerald-50 rounded-lg">
                        <p className="text-sm font-medium text-emerald-900">Selected Coordinates</p>
                        <p className="text-xs text-emerald-800 font-mono">
                          Latitude: {selectedLocation.lat?.toFixed(6)}, Longitude: {selectedLocation.lng?.toFixed(6)}
                        </p>
                      </div>
                    )}

                    <div className="flex justify-end gap-3 mt-6">
                      <button
                        type="button"
                        onClick={() => setShowMapModal(false)}
                        className="px-4 py-2 border border-emerald-200 text-emerald-900 rounded-lg hover:bg-emerald-50/70"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowMapModal(false)}
                        className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                      >
                        Confirm Location
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}


            {/* Date of Observation */}
            <div>
              <label className="block text-sm font-medium text-emerald-900 mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-emerald-600" />
                Date of Observation *
              </label>
              <input
                type="date"
                max={getMaxDate()}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white text-emerald-900 ${
                  validationErrors.date ? 'border-red-300 bg-red-50' : 'border-emerald-200'
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
                <label className="block text-sm font-medium text-emerald-900 mb-2">
                  Issue Type *
                </label>
                <select
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white text-emerald-900 ${
                    validationErrors.type ? 'border-red-300 bg-red-50' : 'border-emerald-200'
                  }`}
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="Pest Infestation" className="text-emerald-900">Pest Infestation</option>
                  <option value="Disease" className="text-emerald-900">Disease</option>
                  <option value="Both" className="text-emerald-900">Both</option>
                  <option value="Other" className="text-emerald-900">Other</option>
                </select>
                {validationErrors.type && (
                  <p className="text-red-600 text-sm mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {validationErrors.type}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-emerald-900 mb-2">
                  Status
                </label>
                <select
                  className="w-full px-4 py-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white text-emerald-900"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="Pending" className="text-emerald-900">Pending</option>
                  <option value="Monitoring" className="text-emerald-900">Monitoring</option>
                  <option value="Treatment Ongoing" className="text-emerald-900">Treatment Ongoing</option>
                  <option value="Resolved" className="text-emerald-900">Resolved</option>
                </select>
              </div>
            </div>

            {/* Urgency and Economic Impact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-emerald-900 mb-2">
                  Urgency Level *
                </label>
                <select
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white text-emerald-900 ${
                    validationErrors.urgency ? 'border-red-300 bg-red-50' : 'border-emerald-200'
                  }`}
                  value={form.urgency}
                  onChange={(e) => setForm({ ...form, urgency: e.target.value })}
                >
                  <option value="Low (Routine monitoring)" className="text-emerald-900">Low (Routine monitoring)</option>
                  <option value="Medium (Schedule treatment)" className="text-emerald-900">Medium (Schedule treatment)</option>
                  <option value="High (Immediate action needed)" className="text-emerald-900">High (Immediate action needed)</option>
                  <option value="Emergency (Critical threat)" className="text-emerald-900">Emergency (Critical threat)</option>
                </select>
                {validationErrors.urgency && (
                  <p className="text-red-600 text-sm mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {validationErrors.urgency}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-emerald-900 mb-2">
                  Economic Impact Level *
                </label>
                <select
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white text-emerald-900 ${
                    validationErrors.economicImpact ? 'border-red-300 bg-red-50' : 'border-emerald-200'
                  }`}
                  value={form.economicImpact}
                  onChange={(e) => setForm({ ...form, economicImpact: e.target.value })}
                >
                  <option value="Minimal (<5% loss)" className="text-emerald-900">Minimal (&lt;5% loss)</option>
                  <option value="Moderate (5-20% loss)" className="text-emerald-900">Moderate (5-20% loss)</option>
                  <option value="Significant (20-50% loss)" className="text-emerald-900">Significant (20-50% loss)</option>
                  <option value="Severe (>50% loss)" className="text-emerald-900">Severe (&gt;50% loss)</option>
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
              <label className="block text-sm font-medium text-emerald-900 mb-2 flex items-center">
                <Ruler className="w-4 h-4 mr-2 text-emerald-600" />
                Affected Area (Perch) *
                <span className="ml-2 text-xs text-emerald-900">0.5 - 2000 perch</span>
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
                        ? 'bg-emerald-500 text-white border-green-600' 
                        : 'bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-50/70'
                    }`}
                  >
                    {area} P
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={decrementAffectedArea}
                  disabled={form.affectedArea <= 0.5}
                  className="px-4 py-3 bg-gray-100 rounded-xl hover:bg-emerald-100/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold text-lg text-emerald-900"
                >
                  -
                </button>
                <div className="flex-1">
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="2000"
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-center bg-white text-emerald-900 ${
                      validationErrors.affectedArea ? 'border-red-300 bg-red-50' : 'border-emerald-200'
                    }`}
                    value={form.affectedArea}
                    onChange={(e) => handleAffectedAreaChange(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={incrementAffectedArea}
                  disabled={form.affectedArea >= 2000}
                  className="px-4 py-3 bg-gray-100 rounded-xl hover:bg-emerald-100/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold text-lg text-emerald-900"
                >
                  +
                </button>
              </div>
              <div className="flex justify-between text-xs text-emerald-900 mt-1">
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
              <label className="block text-sm font-medium text-emerald-900 mb-2 flex items-center">
                <Leaf className="w-4 h-4 mr-2 text-emerald-600" />
                Requested Actions
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {['Fertilizer', 'Insecticide', 'Fungicide', 'Manual Intervention', 'Other'].map((action) => (
                  <label key={action} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.requestedActions.includes(action)}
                      onChange={() => handleActionChange(action)}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 bg-white border-emerald-200"
                    />
                    <span className="text-sm text-emerald-900">{action}</span>
                  </label>
                ))}
              </div>
              
              {showOtherAction && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-emerald-900 mb-2">
                    Specify Other Action {form.requestedActions.includes('Other') && '*'}
                  </label>
                  <input
                    type="text"
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-emerald-900 ${
                      validationErrors.otherAction ? 'border-red-300 bg-red-50' : 'border-emerald-200'
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
              <label className="block text-sm font-medium text-emerald-900 mb-2 flex items-center">
                <FileText className="w-4 h-4 mr-2 text-emerald-600" />
                Description & Symptoms *
              </label>
              <textarea
                rows={4}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white text-emerald-900 ${
                  validationErrors.description ? 'border-red-300 bg-red-50' : 'border-emerald-200'
                }`}
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
              <label className="block text-sm font-medium text-emerald-900 mb-2">
                Update Evidence
                <span className="text-emerald-600 ml-2 text-xs">✓ Supabase Storage</span>
              </label>
              <div className={`border-2 border-dashed rounded-xl transition-all duration-200 bg-white ${
                validationErrors.image ? 'border-red-300 bg-red-50' : 'border-emerald-200'
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
                        title="Remove image"
                      >
                        <X size={16} />
                      </button>
                      <div className="text-xs text-emerald-900 mt-2">
                        {imageFile ? 'New image ready to upload' : 'Current evidence image'}
                      </div>
                    </div>
                  ) : originalImageUrl ? (
                    <div className="relative inline-block">
                      <img 
                        src={originalImageUrl} 
                        alt="Current evidence" 
                        className="max-w-full h-32 object-cover rounded-lg mx-auto" 
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                      <div className="text-center text-emerald-900 p-4 hidden">
                        <Camera className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>Image unavailable</p>
                      </div>
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        title="Remove current image"
                      >
                        <X size={16} />
                      </button>
                      <div className="text-xs text-emerald-900 mt-2">Current evidence image</div>
                    </div>
                  ) : (
                    <>
                      <Camera className="mx-auto w-12 h-12 text-emerald-800/70 mb-3" />
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                        <label className="cursor-pointer bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors flex items-center">
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Image
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageChange}
                          />
                        </label>
                        <span className="text-emerald-900 text-sm">or drag and drop</span>
                      </div>
                      <p className="text-xs text-emerald-800/80 mt-2">PNG, JPG, GIF up to 5MB</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-emerald-100">
              <button
                type="button"
                onClick={() => navigate(`/supervisor/pest-disease/${id}`)}
                className="flex-1 px-6 py-3 border border-emerald-200 text-emerald-900 rounded-xl hover:bg-emerald-50/70 transition-all duration-200 font-medium flex items-center justify-center bg-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Details
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                    {uploadProgress > 0 ? 'Uploading...' : 'Updating...'}
                  </>
                ) : (
                  'Update Report'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Update Guidelines */}
        <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <h3 className="font-medium text-emerald-900 mb-2 flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            Update Guidelines
          </h3>
          <ul className="text-emerald-900 text-sm space-y-1">
            <li>• All fields marked with * are required</li>
            <li>• Date cannot be set to future dates</li>
            <li>• Mark as resolved only when issue is completely fixed</li>
            <li>• New images will replace existing evidence</li>
            <li>• GPS coordinates help in precise location tracking</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UpdatePestDiseasePage;