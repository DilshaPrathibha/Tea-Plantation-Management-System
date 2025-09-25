import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { 
  Camera, Upload, X, User, MapPin, Calendar, AlertCircle, 
  FileText, CheckCircle, Map, Ruler, Loader, ArrowLeft
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const UpdatePestDiseasePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [imagePreview, setImagePreview] = useState(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
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

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [reportResponse, fieldsResponse] = await Promise.all([
        axios.get(`${API}/api/pestdisease/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/api/fields`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      const reportData = reportResponse.data.pestDisease;
      const formattedDate = reportData.date 
        ? new Date(reportData.date).toISOString().split('T')[0]
        : '';
      
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
      
      setFields(fieldsResponse.data.items || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load report data. Please try again.');
    } finally {
      setFetching(false);
    }
  };

  // Modified: Anyone can edit if status is not Resolved
  const canEdit = () => {
    return form.status !== 'Resolved';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!canEdit()) {
      setError('You cannot edit resolved reports.');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/api/pestdisease/${id}`, form, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/pestdisease');
      }, 2000);
    } catch (error) {
      console.error('Error updating report:', error);
      setError('Failed to update report. Please try again.');
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
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
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

  if (fetching) {
    return (
      <div className="min-h-screen bg-base-200 py-10 px-4 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader className="w-8 h-8 animate-spin text-primary mb-4" />
          <div className="text-lg text-base-content">Loading report data...</div>
        </div>
      </div>
    );
  }

  if (!canEdit()) {
    return (
      <div className="min-h-screen bg-base-200 py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => navigate('/pestdisease')}
            className="btn btn-ghost mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reports
          </button>
          <div className="bg-base-100 rounded-xl shadow p-6 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-warning mb-4" />
            <h2 className="text-xl font-bold text-base-content mb-2">Cannot Edit</h2>
            <p className="text-base-content/70 mb-4">
              You cannot edit resolved reports.
            </p>
            <button
              onClick={() => navigate('/pestdisease')}
              className="btn btn-primary"
            >
              Return to Reports
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate('/pestdisease')}
          className="btn btn-ghost mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Reports
        </button>

        <div className="bg-base-100 rounded-xl shadow-md p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-base-content mb-2">Update Pest/Disease Report</h1>
            <p className="text-base-content/70">Update the details about this agricultural threat</p>
          </div>
          
          {error && (
            <div className="alert alert-error mb-6">
              {error}
            </div>
          )}
          
          {success && (
            <div className="alert alert-success mb-6">
              <CheckCircle className="w-5 h-5 mr-2" />
              Report updated successfully! Redirecting...
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Reporter Name (disabled) */}
            <div>
              <label className="block text-sm font-medium text-base-content mb-2 flex items-center">
                <User className="w-4 h-4 mr-1" />
                Reporter Name
              </label>
              <input
                type="text"
                className="input input-bordered w-full bg-base-200 text-base-content"
                value={form.reporterName || ''}
                disabled
              />
            </div>

            {/* Date of Report (disabled) */}
            <div>
              <label className="block text-sm font-medium text-base-content mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Date of Report
              </label>
              <input
                type="date"
                className="input input-bordered w-full bg-base-200 text-base-content"
                value={form.date}
                disabled
              />
              <p className="text-xs text-base-content/50 mt-1">Report date cannot be changed</p>
            </div>

            {/* Issue Type */}
            <div>
              <label className="block text-sm font-medium text-base-content mb-2 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                Issue Type
              </label>
              <select
                className="select select-bordered w-full bg-base-200 text-base-content"
                value={form.issueType}
                onChange={e => setForm({ ...form, issueType: e.target.value })}
                required
              >
                <option value="">Select type</option>
                <option value="Pest Infestation">Pest Infestation</option>
                <option value="Disease">Disease</option>
                <option value="Both">Both</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Pest/Disease Name */}
            <div>
              <label className="block text-sm font-medium text-base-content mb-2 flex items-center">
                <FileText className="w-4 h-4 mr-1" />
                Name of Pest/Disease
              </label>
              <input
                type="text"
                className="input input-bordered w-full bg-base-200 text-base-content"
                placeholder="e.g. Red Spider Mite, Blight"
                value={form.pestDiseaseName}
                onChange={e => setForm({ ...form, pestDiseaseName: e.target.value })}
                required
              />
            </div>

            {/* Location (Field) */}
            <div>
              <label className="block text-sm font-medium text-base-content mb-2 flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                Field Location
              </label>
              <select
                className="select select-bordered w-full bg-base-200 text-base-content"
                value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
                required
              >
                <option value="">Select field</option>
                {fields.map(field => (
                  <option key={field._id} value={field.name}>{field.name}</option>
                ))}
              </select>
            </div>

            {/* Severity */}
            <div>
              <label className="block text-sm font-medium text-base-content mb-2 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                Severity
              </label>
              <select
                className="select select-bordered w-full bg-base-200 text-base-content"
                value={form.severity}
                onChange={e => setForm({ ...form, severity: e.target.value })}
                required
              >
                <option value="">Select severity</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            {/* Affected Area */}
            <div>
              <label className="block text-sm font-medium text-base-content mb-2 flex items-center">
                <Ruler className="w-4 h-4 mr-1" />
                Affected Area (perches, 1-5)
              </label>
              <input
                type="number"
                min={1}
                max={5}
                className="input input-bordered w-full bg-base-200 text-base-content"
                value={form.affectedArea}
                onChange={e => {
                  let val = Number(e.target.value);
                  if (val < 1) val = 1;
                  if (val > 5) val = 5;
                  setForm({ ...form, affectedArea: val });
                }}
                required
              />
            </div>

            {/* Description of Symptoms */}
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
                onChange={e => setForm({ ...form, description: e.target.value })}
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

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-base-content mb-2 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                Status
              </label>
              <select
                className="select select-bordered w-full bg-base-200 text-base-content"
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
              >
                <option value="Pending">Pending</option>
                <option value="Monitoring">Monitoring</option>
                <option value="Treatment Ongoing">Treatment Ongoing</option>
                <option value="Resolved">Resolved</option>
              </select>
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
                onClick={() => navigate('/pestdisease')}
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
  );
};

export default UpdatePestDiseasePage;