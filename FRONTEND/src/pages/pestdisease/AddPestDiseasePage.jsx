import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Camera, Upload, X, User, MapPin, Calendar, AlertCircle, 
  FileText, CheckCircle, Map, Ruler 
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const AddPestDiseasePage = () => {
  const navigate = useNavigate();
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Form state
  const [form, setForm] = useState({
    issueType: 'Pest Infestation',
    pestDiseaseName: '',
    location: '',
    mapCoordinates: { lat: null, lng: null },
    date: new Date().toISOString().split('T')[0],
    severity: 'Medium',
    description: '',
    affectedArea: 1,
    requestedActions: [],
    status: 'Pending'
  });

  // Fetch fields from the system
  useEffect(() => {
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
    
    fetchFields();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/api/pest-diseases`, form, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/pest-diseases', { state: { success: true } });
      }, 2000);
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit pest/disease report. Please try again.');
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

  return (
    <div className="min-h-screen bg-green-50 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-green-800 mb-2">New Pest/Disease Report</h1>
          <p className="text-gray-600">Report agricultural threats to protect crop health</p>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-lg flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            Report submitted successfully! Redirecting...
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

          {/* Date and Severity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Date of Report
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
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                'Submit Report'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPestDiseasePage;