import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toast } from '../utils/sweet';
import { createItem } from '../api/fni';
import { listSuppliers } from '../api/suppliers';

export default function FNICreate() {
  const [form, setForm] = useState({
    name: '',
    category: '',
    unit: '',
    openingQty: '',
    minQty: '',
    note: '',
    cost: '',
    suppliers: []
  });
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [supplierFetchError, setSupplierFetchError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    async function fetchSuppliers() {
      setLoadingSuppliers(true);
      setSupplierFetchError('');
      try {
        const res = await listSuppliers();
        if (!isMounted) return;
        const data = Array.isArray(res.data) ? res.data : [];
        const filtered = data.filter(s => s.status !== 'suspended');
        setSupplierOptions(filtered);
      } catch (err) {
        console.error('Failed to load suppliers', err);
        if (!isMounted) return;
        setSupplierFetchError('Failed to load suppliers. You can still create the item and assign suppliers later.');
        Toast.error('Failed to load suppliers');
      } finally {
        if (isMounted) setLoadingSuppliers(false);
      }
    }
    fetchSuppliers();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    
    // Handle numeric fields with validation
    if (name === 'openingQty' || name === 'minQty' || name === 'cost') {
      // Prevent negative numbers
      if (value < 0) return;
      
      // Limit to 2 decimal places
      if (value.includes('.')) {
        const parts = value.split('.');
        if (parts[1] && parts[1].length > 2) return;
      }
      
      setForm(f => ({ ...f, [name]: value }));
      return;
    }
    
    // Handle name field - limit to 100 characters
    if (name === 'name') {
      if (value.length > 100) return;
      setForm(f => ({ ...f, [name]: value }));
      return;
    }
    
    // Handle note field - limit to 500 characters
    if (name === 'note') {
      if (value.length > 500) return;
      setForm(f => ({ ...f, [name]: value }));
      return;
    }
    
    setForm(f => {
      if (name === 'category') {
        const allowedIds = new Set(
          supplierOptions
            .filter(s => s.status !== 'suspended' && (s.type === value || s.type === 'other'))
            .map(s => s._id?.toString())
        );
        const nextSuppliers = f.suppliers.filter(id => allowedIds.has(id));
        return { ...f, category: value, suppliers: nextSuppliers };
      }
      return { ...f, [name]: value };
    });
  };

  const handleSupplierToggle = (supplierId) => {
    const id = supplierId?.toString();
    if (!id) return;
    setForm(f => {
      const hasId = f.suppliers.includes(id);
      const nextSuppliers = hasId
        ? f.suppliers.filter(existingId => existingId !== id)
        : [...f.suppliers, id];
      return { ...f, suppliers: nextSuppliers };
    });
  };

  const validate = () => {
    if (!form.name.trim()) return 'Name is required';
    if (form.name.trim().length < 2) return 'Name must be at least 2 characters';
    if (form.name.trim().length > 100) return 'Name must not exceed 100 characters';
    if (!form.category) return 'Category is required';
    if (!form.unit) return 'Unit is required';
    if (form.openingQty === '' || Number(form.openingQty) < 0) return 'Opening Qty must be ≥ 0';
    if (form.openingQty && Number(form.openingQty) > 999999) return 'Opening Qty must not exceed 999,999';
    if (form.minQty !== '' && Number(form.minQty) < 0) return 'Min Qty must be ≥ 0';
    if (form.minQty && Number(form.minQty) > 999999) return 'Min Qty must not exceed 999,999';
    if (form.cost && Number(form.cost) < 0) return 'Cost must be ≥ 0';
    if (form.cost && Number(form.cost) > 999999) return 'Cost must not exceed 999,999';
    if (form.openingQty > 0 && (form.cost === '' || Number(form.cost) < 0)) return 'Cost is required for opening stock';
    if (form.note && form.note.length > 500) return 'Note must not exceed 500 characters';
    return null;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    const errMsg = validate();
    if (errMsg) return setError(errMsg);
    setLoading(true);
    try {
      const data = {
        name: form.name.trim(),
        category: form.category,
        unit: form.unit,
        openingQty: Number(form.openingQty),
        minQty: form.minQty === '' ? 0 : Number(form.minQty),
        note: form.note?.trim() || '',
        cost: form.openingQty > 0 ? Number(form.cost) : 0,
        suppliers: form.suppliers
      };
      await createItem(data);
      Toast.success('Item created');
      navigate('/inventory/fni');
    } catch (err) {
      const rawMsg = err.response?.data?.message || '';
      if (rawMsg.includes('E11000') && rawMsg.includes('name_1_category_1')) {
        setError(`${form.category} "${form.name}" already exists.`);
      } else {
        setError(rawMsg || 'Failed to create item');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Create FNI Item</h1>
        {error && <div className="alert alert-error mb-4">{error}</div>}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block mb-1 font-semibold">Name <span className="text-error">*</span></label>
            <input
              className="input input-bordered w-full"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              minLength={2}
              maxLength={100}
              placeholder="Enter item name (2-100 characters)"
            />
            <label className="label">
              <span className="label-text-alt text-base-content/60">{form.name.length}/100 characters</span>
            </label>
          </div>
          <div>
            <label className="block mb-1 font-semibold">Category <span className="text-error">*</span></label>
            <select
              className="select select-bordered w-full"
              name="category"
              value={form.category}
              onChange={handleChange}
              required
            >
              <option value="">Select category...</option>
              <option value="fertilizer">Fertilizer</option>
              <option value="insecticide">Insecticide</option>
            </select>
          </div>
          <div>
            <label className="block mb-1 font-semibold">Suppliers</label>
            {supplierFetchError ? (
              <div className="alert alert-warning mb-3 text-sm">
                {supplierFetchError}
              </div>
            ) : null}
            {!form.category ? (
              <p className="text-sm text-base-content/60">Select a category to view compatible suppliers.</p>
            ) : loadingSuppliers ? (
              <div className="flex items-center gap-2 text-sm text-base-content/60">
                <span className="loading loading-spinner loading-sm" />
                Loading suppliers...
              </div>
            ) : (
              (() => {
                const compatibleSuppliers = supplierOptions.filter(
                  s => s.type === form.category || s.type === 'other'
                );
                if (compatibleSuppliers.length === 0) {
                  return (
                    <p className="text-sm text-base-content/60">
                      No suppliers found for the selected category. You can add suppliers later.
                    </p>
                  );
                }
                return (
                  <div className="space-y-2 max-h-40 overflow-y-auto border border-base-300 rounded-lg p-3 bg-base-100">
                    {compatibleSuppliers.map((supplier) => {
                      const supplierId = supplier._id?.toString();
                      return (
                        <label
                          key={supplier._id}
                          className="flex items-start gap-3 p-2 rounded-lg hover:bg-base-200 transition-colors cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            className="checkbox checkbox-sm mt-1"
                            checked={form.suppliers.includes(supplierId)}
                            onChange={() => handleSupplierToggle(supplierId)}
                          />
                          <div className="text-sm leading-tight">
                            <div className="font-semibold text-base-content">{supplier.name}</div>
                            <div className="text-xs text-base-content/60">
                              {supplier.supplierId} - {supplier.contactPerson || supplier.contactNumber || 'No contact'}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                );
              })()
            )}
          </div>
          <div>
            <label className="block mb-1 font-semibold">Unit <span className="text-error">*</span></label>
            <select
              className="select select-bordered w-full"
              name="unit"
              value={form.unit}
              onChange={handleChange}
              required
            >
              <option value="">Select unit...</option>
              <option value="kg">kg</option>
              <option value="L">L</option>
            </select>
          </div>
          <div>
            <label className="block mb-1 font-semibold">Opening Qty <span className="text-error">*</span></label>
            <input
              type="number"
              min="0"
              max="999999"
              step="0.01"
              className="input input-bordered w-full"
              name="openingQty"
              value={form.openingQty}
              onChange={handleChange}
              required
              placeholder="0.00"
            />
            <label className="label">
              <span className="label-text-alt text-base-content/60">Maximum 2 decimal places, max value 999,999</span>
            </label>
          </div>
          <div>
            <label className="block mb-1 font-semibold">Min Qty</label>
            <input
              type="number"
              min="0"
              max="999999"
              step="0.01"
              className="input input-bordered w-full"
              name="minQty"
              value={form.minQty}
              onChange={handleChange}
              placeholder="0.00"
            />
            <label className="label">
              <span className="label-text-alt text-base-content/60">Optional, maximum 2 decimal places</span>
            </label>
          </div>
          <div>
            <label className="block mb-1 font-semibold">Cost per Unit {form.openingQty > 0 ? <span className="text-error">*</span> : null}</label>
            <input
              type="number"
              min="0"
              max="999999"
              step="0.01"
              className="input input-bordered w-full"
              name="cost"
              value={form.cost}
              onChange={handleChange}
              required={form.openingQty > 0}
              placeholder="0.00"
            />
            <label className="label">
              <span className="label-text-alt text-base-content/60">Maximum 2 decimal places, required if opening qty &gt; 0</span>
            </label>
          </div>
          <div>
            <label className="block mb-1 font-semibold">Note</label>
            <textarea
              className="textarea textarea-bordered w-full"
              name="note"
              rows={3}
              value={form.note}
              onChange={handleChange}
              placeholder="Optional notes (max 500 characters)"
              maxLength={500}
            />
            <label className="label">
              <span className="label-text-alt text-base-content/60">{form.note.length}/500 characters</span>
            </label>
          </div>
          <button
            type="submit"
            className={`btn btn-primary w-full ${loading ? 'btn-disabled' : ''}`}
            disabled={loading}
          >
            {loading ? <span className="loading loading-spinner loading-sm mr-2" /> : null}
            Create Item
          </button>
        </form>
      </div>
    </div>
  );
}
