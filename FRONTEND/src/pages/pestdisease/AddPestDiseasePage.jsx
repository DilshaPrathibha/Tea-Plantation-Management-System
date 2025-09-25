import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Camera, Upload, X, User, MapPin, Calendar, AlertCircle, 
  FileText, CheckCircle, Map, Ruler, ArrowLeft, Loader
} from 'lucide-react';
import Swal from 'sweetalert2';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const AddPestDiseasePage = () => {
  const navigate = useNavigate();
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
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

  const handleBack = () => {
    navigate('/pestdisease');
  };

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
      await axios.post(`${API}/api/pestdisease`, form, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      await Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Pest/Disease report submitted successfully.',
        confirmButtonColor: '#059669',
        background: '#1f2937',
        color: '#fff'
      });
      
      navigate('/pestdisease', { state: { success: true } });
    } catch (error) {
      console.error('Error submitting report:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error?.response?.data?.message || 'Failed to submit pest/disease report. Please try again.',
        confirmButtonColor: '#059669',
        background: '#1f2937',
        color: '#fff'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      await Swal.fire({
        icon: 'error',
        title: 'File Too Large',
        text: 'Maximum file size is 10MB.',
        confirmButtonColor: '#059669',
        background: '#1f2937',
        color: '#fff'
      });
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      await Swal.fire({
        icon: 'error',
        title: 'Invalid File Type',
        text: 'Please upload a JPG, PNG, or GIF file.',
        confirmButtonColor: '#059669',
        background: '#1f2937',
        color: '#fff'
      });
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.onerror = async () => {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to read image file. Please try again.',
        confirmButtonColor: '#059669',
        background: '#1f2937',
        color: '#fff'
      });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => setImagePreview(null);

  const handleCheckboxChange = (action) => {
    setForm(prev => ({
      ...prev,
      requestedActions: prev.requestedActions.includes(action)
        ? prev.requestedActions.filter(a => a !== action)
        : [...prev.requestedActions, action]
    }));
  };

  return (
    <div className="min-h-screen bg-base-200 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <button
          type="button"
          onClick={handleBack}
          className="mb-6 flex items-center gap-2 text-primary hover:text-primary-focus font-medium"
        >
          <ArrowLeft className="w-5 h-5" /> Back to Reports
        </button>

        <div className="bg-base-100 rounded-xl shadow-md p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-base-content mb-2">Report New Pest/Disease</h1>
            <p className="text-base-content/70">Report agricultural threats to protect crop health</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Reporter Name */}
            <div>
              <label className="block text-sm font-medium text-base-content mb-2 flex items-center">
                <User className="w-4 h-4 mr-1" />
                Reporter Name
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-base-300 rounded-lg bg-base-200 text-base-content"
                value={JSON.parse(localStorage.getItem('user') || '{}').name || ''}
                disabled
              />
            </div>

            {/* Type of Issue */}
            <div>
              <label className="block text-sm font-medium text-base-content mb-2">
                Type of Issue
              </label>
              <select
                className="select select-bordered w-full bg-base-200 text-base-content"
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
              <label className="block text-sm font-medium text-base-content mb-2">
                Pest/Disease Name
              </label>
              <input
                type="text"
                className="input input-bordered w-full bg-base-200 text-base-content"
                placeholder="Enter the name of the pest or disease"
                value={form.pestDiseaseName}
                onChange={(e) => setForm({ ...form, pestDiseaseName: e.target.value })}
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
                className="select select-bordered w-full bg-base-200 text-base-content"
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

            {/* Date and Severity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-base-content mb-2 flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Date of Report
                </label>
                <input
                  type="date"
                  className="input input-bordered w-full bg-base-200 text-base-content"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-base-content mb-2">
                  Severity Level
                </label>
                <select
                  className="select select-bordered w-full bg-base-200 text-base-content"
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
              <label className="block text-sm font-medium text-base-content mb-2 flex items-center">
                <Ruler className="w-4 h-4 mr-1" />
                Estimated Affected Area (Acres)
              </label>
              <input
                type="number"
                min="1"
                max="5"
                className="input input-bordered w-full bg-base-200 text-base-content"
                value={form.affectedArea}
                onChange={(e) => setForm({ ...form, affectedArea: parseInt(e.target.value) })}
                required
              />
              <p className="text-xs text-base-content/50 mt-1">Must be between 1-5 acres</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-base-content mb-2 flex items-center">
                <FileText className="w-4 h-4 mr-1" />
                Description of Symptoms
              </label>
              <textarea
                rows={4}
                className="textarea textarea-bordered w-full bg-base-200 text-base-content"
                placeholder="Describe the symptoms, appearance, and any observations..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
            </div>

            {/* Requested Actions */}
            <div>
              <label className="block text-sm font-medium text-base-content mb-2">
                Requested Actions
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['Fertilizer', 'Insecticide', 'Fungicide', 'Manual Intervention', 'Other'].map(action => (
                  <label key={action} className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm mr-2"
                      checked={form.requestedActions.includes(action)}
                      onChange={() => handleCheckboxChange(action)}
                    />
                    <span className="text-sm text-base-content">{action}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-base-content mb-2">
                Upload Evidence Images (Optional)
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-base-300 border-dashed rounded-lg">
                <div className="space-y-1 text-center">
                  {imagePreview ? (
                    <div className="relative">
                      <img src={imagePreview} alt="Preview" className="mx-auto h-32 w-auto object-contain" />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 bg-error text-base-100 rounded-full p-1"
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
                          className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary-focus"
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

            {/* Buttons */}
            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={handleBack}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
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
    </div>
  );
};

export default AddPestDiseasePage;