// Copied from NEWPAGES
// ...existing code from NEWPAGES/FRONTEND/src/pages/CreateToolPage.jsx...

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import Navbar from '@/components/Navbar';

const api = axios.create({
  baseURL: 'http://localhost:5001/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default function CreateToolPage() {
  const [toolType, setToolType] = useState("");
  const [condition, setCondition] = useState("good");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/tools", { toolType, condition, note });
      const created = res.data;
      toast.success(`Tool created: ${created.toolId}`);
      navigate("/tools");
    } catch (err) {
      if (err.response?.status === 409) {
        setError("Tool ID already exists. Please try again.");
      } else {
        setError(err.response?.data?.message || "Failed to create tool");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />
      <div className="max-w-xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Create New Tool</h1>
        {error && <div className="alert alert-error mb-4">{error}</div>}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block mb-1 font-semibold">Tool Type <span className="text-error">*</span></label>
            <select
              className="select select-bordered w-full"
              value={toolType}
              onChange={e => setToolType(e.target.value)}
              required
            >
              <option value="">Select type...</option>
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
              value={condition}
              onChange={e => setCondition(e.target.value)}
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
              rows={3}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Optional notes about this tool..."
            />
          </div>
          <button
            type="submit"
            className={`btn btn-primary w-full ${loading ? "btn-disabled" : ""}`}
            disabled={loading}
          >
            {loading ? <span className="loading loading-spinner loading-sm mr-2" /> : null}
            Create Tool
          </button>
        </form>
      </div>
    </div>
  );
}

