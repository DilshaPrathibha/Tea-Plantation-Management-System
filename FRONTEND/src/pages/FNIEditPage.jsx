import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Sweet, Toast } from "../utils/sweet";
import { getItem, updateItem } from "../api/fni";
import { listSuppliers } from "../api/suppliers";

export default function FNIEditPage() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [supplierFetchError, setSupplierFetchError] = useState('');
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
        setSupplierFetchError('Failed to load suppliers. Existing assignments will remain unchanged.');
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

  useEffect(() => {
    async function fetchItem() {
      setLoading(true);
      try {
        const res = await getItem(id);
        setItem(res.data);
        const supplierIds = Array.isArray(res.data?.suppliers)
          ? res.data.suppliers.map(s => s._id?.toString()).filter(Boolean)
          : [];
        setSelectedSuppliers(supplierIds);
      } catch (err) {
        console.error('Failed to load FNI item', err);
        setLoading(false);
        Sweet.fire({
          icon: 'error',
          title: 'Failed to Load Item',
          text: 'The FNI item could not be loaded. It may have been deleted or you may not have permission to access it.',
          showCancelButton: true,
          confirmButtonText: 'Try Again',
          cancelButtonText: 'Back to FNI',
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#6c757d'
        }).then((result) => {
          if (result.isConfirmed) {
            window.location.reload();
          } else {
            navigate('/inventory/fni');
          }
        });
        return;
      } finally {
        setLoading(false);
      }
    }
    fetchItem();
  }, [id, navigate]);

  useEffect(() => {
    if (!item?.category || supplierOptions.length === 0) return;
    setSelectedSuppliers((current) => {
      const allowedIds = new Set(
        supplierOptions
          .filter(s => s.type === item.category || s.type === 'other')
          .map(s => s._id?.toString())
          .filter(Boolean)
      );
      const filtered = current.filter(id => allowedIds.has(id));
      return filtered.length === current.length ? current : filtered;
    });
  }, [item?.category, supplierOptions]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle minQty with validation
    if (name === 'minQty') {
      // Prevent negative numbers
      if (value < 0) return;
      
      // Limit to 2 decimal places
      if (value.includes('.')) {
        const parts = value.split('.');
        if (parts[1] && parts[1].length > 2) return;
      }
      
      // Max value check
      if (value && Number(value) > 999999) return;
      
      setItem({ ...item, [name]: value });
      return;
    }
    
    // Handle name field - limit to 100 characters
    if (name === 'name') {
      if (value.length > 100) return;
      setItem({ ...item, [name]: value });
      return;
    }
    
    // Handle note field - limit to 500 characters
    if (name === 'note') {
      if (value.length > 500) return;
      setItem({ ...item, [name]: value });
      return;
    }
    
    setItem({ ...item, [name]: value });
  };

  const handleSupplierToggle = (supplierId) => {
    const idStr = supplierId?.toString();
    if (!idStr) return;
    setSelectedSuppliers((current) => {
      if (current.includes(idStr)) {
        return current.filter(id => id !== idStr);
      }
      return [...current, idStr];
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!item.name || item.name.trim().length < 2) {
      Toast.error('Name must be at least 2 characters');
      return;
    }
    if (item.name.trim().length > 100) {
      Toast.error('Name must not exceed 100 characters');
      return;
    }
    if (item.minQty !== '' && Number(item.minQty) < 0) {
      Toast.error('Min Qty must be ≥ 0');
      return;
    }
    if (item.minQty && Number(item.minQty) > 999999) {
      Toast.error('Min Qty must not exceed 999,999');
      return;
    }
    if (item.note && item.note.length > 500) {
      Toast.error('Note must not exceed 500 characters');
      return;
    }
    
    setSaving(true);
    try {
      await updateItem(id, {
        name: item.name.trim(),
        unit: item.unit,
        minQty: Number(item.minQty ?? 0),
        note: item.note?.trim() || '',
        suppliers: selectedSuppliers
      });
      Toast.success("Item updated successfully");
      navigate("/inventory/fni");
    } catch (err) {
      Toast.error(err.response?.data?.message || "Failed to update item");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !item) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Edit FNI Item</h1>
        <form className="space-y-6" onSubmit={handleSave}>
          <div>
            <label className="block mb-1 font-semibold">Name</label>
            <input
              className="input input-bordered w-full"
              name="name"
              value={item.name}
              onChange={handleChange}
              required
              minLength={2}
              maxLength={100}
            />
            <label className="label">
              <span className="label-text-alt text-base-content/60">{item.name.length}/100 characters</span>
            </label>
          </div>
          <div>
            <label className="block mb-1 font-semibold">Unit</label>
            <select
              className="select select-bordered w-full"
              name="unit"
              value={item.unit}
              onChange={handleChange}
              required
            >
              <option value="kg">kg</option>
              <option value="L">L</option>
            </select>
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
              value={item.minQty}
              onChange={handleChange}
              placeholder="0.00"
            />
            <label className="label">
              <span className="label-text-alt text-base-content/60">Maximum 2 decimal places, max value 999,999</span>
            </label>
          </div>
          <div>
            <label className="block mb-1 font-semibold">Suppliers</label>
            <p className="text-xs text-base-content/60 mb-2">Category: {item.category}</p>
            {supplierFetchError ? (
              <div className="alert alert-warning mb-3 text-sm">
                {supplierFetchError}
              </div>
            ) : null}
            {loadingSuppliers ? (
              <div className="flex items-center gap-2 text-sm text-base-content/60">
                <span className="loading loading-spinner loading-sm" />
                Loading suppliers...
              </div>
            ) : (
              (() => {
                const compatibleSuppliers = supplierOptions.filter(
                  (s) => s.type === item.category || s.type === 'other'
                );
                if (compatibleSuppliers.length === 0) {
                  return (
                    <p className="text-sm text-base-content/60">
                      No compatible suppliers found. You can assign suppliers once they are added.
                    </p>
                  );
                }
                return (
                  <div className="space-y-2 max-h-40 overflow-y-auto border border-base-300 rounded-lg p-3 bg-base-100">
                    {compatibleSuppliers.map((supplier) => {
                      const supplierId = supplier._id?.toString();
                      const checked = selectedSuppliers.includes(supplierId);
                      const statusNote = supplier.status && supplier.status !== 'active'
                        ? ` (${supplier.status})`
                        : '';
                      return (
                        <label
                          key={supplier._id}
                          className="flex items-start gap-3 p-2 rounded-lg hover:bg-base-200 transition-colors cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            className="checkbox checkbox-sm mt-1"
                            checked={checked}
                            onChange={() => handleSupplierToggle(supplierId)}
                          />
                          <div className="text-sm leading-tight">
                            <div className="font-semibold text-base-content">{supplier.name}</div>
                            <div className="text-xs text-base-content/60">
                              {supplier.supplierId} - {supplier.contactPerson || supplier.contactNumber || 'No contact'}
                              {statusNote}
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
            <label className="block mb-1 font-semibold">Note</label>
            <textarea
              className="textarea textarea-bordered w-full"
              name="note"
              rows={3}
              value={item.note || ""}
              onChange={handleChange}
              placeholder="Optional notes (max 500 characters)"
              maxLength={500}
            />
            <label className="label">
              <span className="label-text-alt text-base-content/60">{(item.note || '').length}/500 characters</span>
            </label>
          </div>
          <button
            type="submit"
            className={`btn btn-primary w-full ${saving ? "btn-disabled" : ""}`}
            disabled={saving}
          >
            {saving ? <span className="loading loading-spinner loading-sm mr-2" /> : null}
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}
