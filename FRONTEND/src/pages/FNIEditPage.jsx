import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Sweet, Toast } from "../utils/sweet";
import { getItem, updateItem } from "../api/fni";

export default function FNIEditPage() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchItem() {
      setLoading(true);
      try {
        const res = await getItem(id);
        setItem(res.data);
      } catch (err) {
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

  const handleChange = (e) => {
    setItem({ ...item, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateItem(id, {
        name: item.name,
        unit: item.unit,
        minQty: item.minQty,
        note: item.note,
      });
      Toast.success("Item updated successfully");
      navigate("/inventory/fni");
    } catch (err) {
      Toast.error(err.response?.data?.message || "Failed to update item");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
            />
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
              step="0.01"
              className="input input-bordered w-full"
              name="minQty"
              value={item.minQty}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Note</label>
            <textarea
              className="textarea textarea-bordered w-full"
              name="note"
              rows={3}
              value={item.note || ""}
              onChange={handleChange}
              placeholder="Optional notes about this item..."
            />
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
