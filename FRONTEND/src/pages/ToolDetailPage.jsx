import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

const ToolDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tool, setTool] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTool = async () => {
    try {
      const response = await api.get(`/tools/${id}`);
      setTool(response.data);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load tool");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      await api.put(`/tools/${id}`, {
        name: tool.name,
        quantity: tool.quantity,
        description: tool.description,
      });
      toast.success("Tool updated");
      navigate('/tools');
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update tool");
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/tools/${id}`);
      toast.success("Tool deleted");
      navigate('/tools');
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete tool");
    }
  };

  useEffect(() => {
    fetchTool();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 flex justify-center items-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!tool) {
    return <div className="p-4">Tool not found</div>;
  }

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />
      <div className="container mx-auto p-4 max-w-2xl">
        <h1 className="text-2xl font-bold mb-4">Edit Tool</h1>

        <div className="space-y-4">
          <div>
            <label className="block mb-1 font-semibold">Name</label>
            <input
              className="input input-bordered w-full"
              value={tool.name}
              onChange={(e) => setTool({ ...tool, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold">Quantity</label>
            <input
              type="number"
              className="input input-bordered w-full"
              value={tool.quantity}
              onChange={(e) => setTool({ ...tool, quantity: e.target.value })}
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold">Description</label>
            <textarea
              className="textarea textarea-bordered w-full h-32"
              value={tool.description || ''}
              onChange={(e) => setTool({ ...tool, description: e.target.value })}
            />
          </div>

          <div className="flex gap-4">
            <button className="btn btn-warning" onClick={handleUpdate}>
              Update
            </button>
            <button className="btn btn-error" onClick={handleDelete}>
              Delete
            </button>
            <button className="btn" onClick={() => navigate('/tools')}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolDetailPage;
