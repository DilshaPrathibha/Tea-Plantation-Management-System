// Copied from NEWPAGES
// ...existing code from NEWPAGES/FRONTEND/src/pages/ToolDetailPage.jsx...


import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5001/api",
  timeout: 5000,
  headers: { "Content-Type": "application/json" },
});

export default function ToolDetailPage() {
  const { id } = useParams();
  const [tool, setTool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchTool() {
      setLoading(true);
      try {
        const res = await api.get(`/tools/${id}`);
        setTool(res.data);
      } catch (err) {
        setError("Failed to load tool");
      } finally {
        setLoading(false);
      }
    }
    fetchTool();
  }, [id]);

  const handleChange = (e) => {
    setTool({ ...tool, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.put(`/tools/${id}`, {
        toolType: tool.toolType,
        condition: tool.condition,
        note: tool.note,
      });
      toast.success("Tool updated successfully");
      navigate("/tools");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update tool");
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
        <div className="mb-2 text-sm text-base-content/70">
          <Link to="/tools" className="link link-hover">← Tools</Link>
        </div>
        <h1 className="text-2xl font-bold mb-6">Tool Details</h1>
        <form className="space-y-6" onSubmit={handleSave}>
          <div>
            <label className="block mb-1 font-semibold">Tool ID</label>
            <input
              className="input input-bordered w-full"
              value={tool.toolId}
              readOnly
              disabled
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Tool Type</label>
            <select
              className="select select-bordered w-full"
              name="toolType"
              value={tool.toolType}
              onChange={handleChange}
              required
            >
              <option value="knife">Knife</option>
              <option value="sprayer">Sprayer</option>
              <option value="harvester">Harvester</option>
              <option value="hoe">Hoe</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block mb-1 font-semibold">Condition</label>
            <select
              className="select select-bordered w-full"
              name="condition"
              value={tool.condition}
              onChange={handleChange}
              required
            >
              <option value="new">New</option>
              <option value="good">Good</option>
              <option value="needs_repair">Needs Repair</option>
            </select>
          </div>
          <div>
            <label className="block mb-1 font-semibold">Note</label>
            <textarea
              className="textarea textarea-bordered w-full"
              name="note"
              rows={3}
              value={tool.note || ""}
              onChange={handleChange}
              placeholder="Optional notes about this tool..."
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
