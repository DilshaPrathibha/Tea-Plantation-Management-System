import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Sweet, Toast } from '../../utils/sweet';
import { getSupplier, updateSupplier } from '../../api/suppliers';

export default function SupplierEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    contactNumber: '',
    email: '',
    address: '',
    status: 'active',
    notes: '',
    contactPerson: '',
    emergencyContact: ''
  });

  useEffect(() => {
    const fetchSupplier = async () => {
      setLoading(true);
      try {
        const res = await getSupplier(id);
        setSupplier(res.data);
        setFormData({
          name: res.data.name || '',
          type: res.data.type || '',
          contactNumber: res.data.contactNumber || '',
          email: res.data.email || '',
          address: res.data.address || '',
          status: res.data.status || 'active',
          notes: res.data.notes || '',
          contactPerson: res.data.contactPerson || '',
          emergencyContact: res.data.emergencyContact || ''
        });
      } catch (err) {
        console.error('Failed to load supplier', err);
        Sweet.fire({
          icon: 'error',
          title: 'Failed to Load Supplier',
          text: 'The supplier could not be loaded. It may have been deleted or you may not have permission to access it.',
          showCancelButton: true,
          confirmButtonText: 'Try Again',
          cancelButtonText: 'Back to Suppliers',
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#6c757d'
        }).then((result) => {
          if (result.isConfirmed) {
            window.location.reload();
          } else {
            navigate('/inventory/suppliers');
          }
        });
      } finally {
        setLoading(false);
      }
    };
    fetchSupplier();
  }, [id, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Phone number validation - only allow digits
    if (name === 'contactNumber' || name === 'emergencyContact') {
      const cleaned = value.replace(/\D/g, '');
      setFormData(prev => ({ ...prev, [name]: cleaned }));
      return;
    }
    
    // Name validation - limit to 100 characters
    if (name === 'name') {
      if (value.length > 100) return;
      setFormData(prev => ({ ...prev, [name]: value }));
      return;
    }
    
    // Contact Person validation - limit to 100 characters
    if (name === 'contactPerson') {
      if (value.length > 100) return;
      setFormData(prev => ({ ...prev, [name]: value }));
      return;
    }
    
    // Address validation - limit to 300 characters
    if (name === 'address') {
      if (value.length > 300) return;
      setFormData(prev => ({ ...prev, [name]: value }));
      return;
    }
    
    // Notes validation - limit to 500 characters
    if (name === 'notes') {
      if (value.length > 500) return;
      setFormData(prev => ({ ...prev, [name]: value }));
      return;
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validatePhoneNumber = (phone) => {
    if (!phone) return { valid: false, message: '' };
    if (phone.length !== 10) {
      return { valid: false, message: 'Phone number must be exactly 10 digits' };
    }
    if (!/^\d{10}$/.test(phone)) {
      return { valid: false, message: 'Phone number must contain only digits' };
    }
    return { valid: true, message: '' };
  };

  const validateEmail = (email) => {
    if (!email) return { valid: true, message: '' };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, message: 'Please enter a valid email address' };
    }
    return { valid: true, message: '' };
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Toast.error('Supplier name is required');
      return false;
    }
    
    if (formData.name.trim().length < 2) {
      Toast.error('Supplier name must be at least 2 characters');
      return false;
    }
    
    if (formData.name.trim().length > 100) {
      Toast.error('Supplier name must not exceed 100 characters');
      return false;
    }
    
    if (!formData.type) {
      Toast.error('Supplier type is required');
      return false;
    }
    
    if (!formData.contactNumber) {
      Toast.error('Contact number is required');
      return false;
    }
    
    const phoneValidation = validatePhoneNumber(formData.contactNumber);
    if (!phoneValidation.valid) {
      Toast.error(phoneValidation.message);
      return false;
    }
    
    if (formData.email) {
      const emailValidation = validateEmail(formData.email);
      if (!emailValidation.valid) {
        Toast.error(emailValidation.message);
        return false;
      }
    }
    
    if (formData.emergencyContact) {
      const emergencyValidation = validatePhoneNumber(formData.emergencyContact);
      if (!emergencyValidation.valid) {
        Toast.error('Emergency contact: ' + emergencyValidation.message);
        return false;
      }
    }
    
    if (formData.contactPerson && formData.contactPerson.trim().length < 2) {
      Toast.error('Contact person name must be at least 2 characters');
      return false;
    }
    
    if (formData.contactPerson && formData.contactPerson.trim().length > 100) {
      Toast.error('Contact person name must not exceed 100 characters');
      return false;
    }
    
    if (formData.address && formData.address.length > 300) {
      Toast.error('Address must not exceed 300 characters');
      return false;
    }
    
    if (formData.notes && formData.notes.length > 500) {
      Toast.error('Notes must not exceed 500 characters');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    try {
      await updateSupplier(id, formData);
      Toast.success('Supplier updated successfully');
      navigate('/inventory/suppliers');
    } catch (err) {
      Toast.error(err.response?.data?.message || 'Failed to update supplier');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !supplier) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto p-4 sm:p-6 max-w-5xl">
        <button 
          className="btn btn-ghost btn-sm mb-4 gap-2" 
          onClick={() => navigate('/inventory/suppliers')}
        >
          <ArrowLeft size={16} />
          Back to Suppliers
        </button>

        <h1 className="text-2xl font-bold mb-6">Edit Supplier</h1>
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="bg-base-100 rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  <span className="label-text">Name <span className="text-error">*</span></span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="input input-bordered w-full"
                  placeholder="Supplier name (2-100 characters)"
                  minLength={2}
                  maxLength={100}
                  required
                />
                <label className="label">
                  <span className="label-text-alt text-base-content/60">{formData.name.length}/100 characters</span>
                </label>
              </div>
              
              <div>
                <label className="label">
                  <span className="label-text">Type <span className="text-error">*</span></span>
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="select select-bordered w-full"
                  required
                >
                  <option value="">Select type</option>
                  <option value="fertilizer">Fertilizer</option>
                  <option value="insecticide">Insecticide</option>
                  <option value="tools">Tools</option>
                  <option value="equipment">Equipment</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="label">
                  <span className="label-text">Status</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="select select-bordered w-full"
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-base-100 rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  <span className="label-text">Contact Number <span className="text-error">*</span></span>
                </label>
                <input
                  type="text"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleInputChange}
                  className="input input-bordered w-full"
                  placeholder="0771234567"
                  maxLength={10}
                  pattern="[0-9]{10}"
                  required
                />
                <label className="label">
                  <span className="label-text-alt text-base-content/60">Must be exactly 10 digits</span>
                </label>
              </div>
              
              <div>
                <label className="label">
                  <span className="label-text">Email</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input input-bordered w-full"
                  placeholder="supplier@example.com"
                />
                <label className="label">
                  <span className="label-text-alt text-base-content/60">Optional - valid email format</span>
                </label>
              </div>
              
              <div>
                <label className="label">
                  <span className="label-text">Contact Person</span>
                </label>
                <input
                  type="text"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleInputChange}
                  className="input input-bordered w-full"
                  placeholder="Contact person name (2-100 characters)"
                  minLength={2}
                  maxLength={100}
                />
                <label className="label">
                  <span className="label-text-alt text-base-content/60">{formData.contactPerson.length}/100 characters</span>
                </label>
              </div>
              
              <div>
                <label className="label">
                  <span className="label-text">Emergency Contact</span>
                </label>
                <input
                  type="text"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleInputChange}
                  className="input input-bordered w-full"
                  placeholder="0777654321"
                  maxLength={10}
                  pattern="[0-9]{10}"
                />
                <label className="label">
                  <span className="label-text-alt text-base-content/60">Optional - must be 10 digits if provided</span>
                </label>
              </div>
            </div>
          </div>

          <div className="bg-base-100 rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-4">Additional Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  <span className="label-text">Address</span>
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="textarea textarea-bordered w-full"
                  placeholder="Full address (max 300 characters)"
                  rows={3}
                  maxLength={300}
                ></textarea>
                <label className="label">
                  <span className="label-text-alt text-base-content/60">{formData.address.length}/300 characters</span>
                </label>
              </div>
              
              <div>
                <label className="label">
                  <span className="label-text">Notes</span>
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="textarea textarea-bordered w-full"
                  placeholder="Additional notes (max 500 characters)"
                  rows={4}
                  maxLength={500}
                ></textarea>
                <label className="label">
                  <span className="label-text-alt text-base-content/60">{formData.notes.length}/500 characters</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button 
              type="button"
              className="btn btn-ghost" 
              onClick={() => navigate('/inventory/suppliers')}
              disabled={saving}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className={`btn btn-primary ${saving ? 'btn-disabled' : ''}`}
              disabled={saving}
            >
              {saving ? <span className="loading loading-spinner loading-sm mr-2" /> : null}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
