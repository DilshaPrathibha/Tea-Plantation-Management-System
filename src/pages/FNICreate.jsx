import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toast } from '../utils/sweet';
import { createItem } from '../api/fni';

export default function FNICreate() {
  const [form, setForm] = useState({
    name: '',
    category: '',
    unit: '',
    openingQty: '',
    minQty: '',
    note: '',
    cost: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const validate = () => {
    if (!form.name.trim()) return 'Name is required';
    if (!form.category) return 'Category is required';
    if (!form.unit) return 'Unit is required';
    if (form.openingQty === '' || Number(form.openingQty) < 0) return 'Opening Qty must be ≥ 0';
    if (form.minQty !== '' && Number(form.minQty) < 0) return 'Min Qty must be ≥ 0';
    if (form.openingQty > 0 && (form.cost === '' || Number(form.cost) < 0)) return 'Cost is required for opening stock';
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
        cost: form.openingQty > 0 ? Number(form.cost) : 0
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
            />
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
              step="0.01"
              className="input input-bordered w-full"
              name="openingQty"
              value={form.openingQty}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Min Qty</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="input input-bordered w-full"
              name="minQty"
              value={form.minQty}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Cost per Unit {form.openingQty > 0 ? <span className="text-error">*</span> : null}</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="input input-bordered w-full"
              name="cost"
              value={form.cost}
              onChange={handleChange}
              required={form.openingQty > 0}
              placeholder="Enter cost for opening stock"
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Note</label>
            <textarea
              className="textarea textarea-bordered w-full"
              name="note"
              rows={3}
              value={form.note}
              onChange={handleChange}
              placeholder="Optional notes..."
            />
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
