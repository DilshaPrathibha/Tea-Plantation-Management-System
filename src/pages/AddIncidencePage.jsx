import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Camera, Upload, X, User, MapPin, Calendar, Clock, AlertCircle, FileText, CheckCircle, Loader } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const AddIncidencePage = () => {
  const navigate = useNavigate();
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [success, setSuccess] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Form state
  const [form, setForm] = useState({
    reporterName: '',
    title: '',
    location: '',
    date: '',
    time: '',
    type: 'Injury',
    severity: 'Low',
    description: '',
    status: 'Pending'
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/api/incidences`, {
        ...form,
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
      alert('Failed to submit incidence report. Please try again.');
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

  return (
    <div className="min-h-screen bg-base-200 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-base-100 rounded-xl shadow-md p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-base-content mb-2">Report New Incidence</h1>
          <p className="text-base-content/70">Fill out all the details about the incident below.</p>
        </div>
        {success && (
          <div className="mb-6 p-4 bg-success/20 text-success-content rounded-lg flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            Incidence submitted successfully!
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Reporter Name */}
          <div>
            <label className="block text-sm font-medium text-base-content mb-2 flex items-center">
              <User className="w-4 h-4 mr-1" />
              Reporter Name
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-base-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-base-200"
              value={form.reporterName}
              onChange={(e) => setForm({ ...form, reporterName: e.target.value })}
              required
            />
          </div>
          {/* Incidence Title */}
          <div>
            <label className="block text-sm font-medium text-base-content mb-2">
              Incidence Title
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-base-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-base-200"
              placeholder="Brief title describing the incident"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-base-content mb-2 flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              Location
            </label>
            <select
              className="w-full px-4 py-2 border border-base-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-base-200"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              required
            >
              <option value="">Select a location</option>
              <option value="full_estate">Full Estate</option>
              {fields.map(field => (
                <option key={field._id} value={field.name}>{field.name}</option>
              ))}
            </select>
          </div>
          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-base-content mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Date of Incident
              </label>
              <input
                type="date"
                className="w-full px-4 py-2 border border-base-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-base-200"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-base-content mb-2 flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                Time of Incident
              </label>
              <input
                type="time"
                className="w-full px-4 py-2 border border-base-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-base-200"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                required
              />
            </div>
          </div>
          {/* Type and Severity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-base-content mb-2">
                Type of Incident
              </label>
              <select
                className="w-full px-4 py-2 border border-base-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-base-200"
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
              <label className="block text-sm font-medium text-base-content mb-2">
                Severity Level
              </label>
              <select
                className="w-full px-4 py-2 border border-base-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-base-200"
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
            <label className="block text-sm font-medium text-base-content mb-2 flex items-center">
              <FileText className="w-4 h-4 mr-1" />
              Description of Incident
            </label>
            <textarea
              rows={4}
              className="w-full px-4 py-2 border border-base-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-base-200"
              placeholder="Provide detailed information about what happened..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
          </div>
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-base-content mb-2">
              Upload Evidence (Optional)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-base-300 border-dashed rounded-lg">
              <div className="space-y-1 text-center">
                {imagePreview ? (
                  <div className="relative">
                    <img src={imagePreview} alt="Preview" className="mx-auto h-32 w-auto object-contain" />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 bg-error text-error-content rounded-full p-1"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Camera className="mx-auto h-12 w-12 text-base-content/40" />
                    <div className="flex text-sm text-base-content/70">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-base-100 rounded-md font-medium text-primary hover:text-primary-focus"
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
                    <p className="text-xs text-base-content/50">PNG, JPG, GIF up to 10MB</p>
                  </>
                )}
              </div>
            </div>
          </div>
          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-base-content mb-2 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              Status
            </label>
            <select
              className="w-full px-4 py-2 border border-base-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-base-200"
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
              onClick={() => navigate('/incidences')}
              className="px-4 py-2 border border-base-300 rounded-lg text-base-content hover:bg-base-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary text-primary-content rounded-lg hover:bg-primary-focus disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin mr-2" />
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

export default AddIncidencePage;