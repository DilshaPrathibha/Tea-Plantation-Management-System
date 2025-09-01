import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import { getItem, updateItem } from "@/api/fni";

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
        setError("Failed to load item");
      } finally {
        setLoading(false);
      }
    }
    fetchItem();
  }, [id]);

  const handleChange = (e) => {
    setItem({ ...item, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await updateItem(id, {
        name: item.name,
        unit: item.unit,
        minQty: item.minQty,
        note: item.note,
      });
      toast.success("Item updated successfully");
      navigate("/fni");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update item");
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

  if (error) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />
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
