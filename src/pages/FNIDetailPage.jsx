import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../config/api.js';

const api = axios.create({
  baseURL: API_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const FNIDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pestNutrient, setPestNutrient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPestNutrient = async () => {
      try {
        const response = await api.get(`/pestnutrients/${id}`);
        setPestNutrient(response.data);
      } catch (error) {
        toast.error('Failed to load pest/nutrient');
      } finally {
        setLoading(false);
      }
    };
    fetchPestNutrient();
  }, [id]);

  const handleUpdate = async () => {
    try {
      await api.put(`/pestnutrients/${id}`, {
        title: pestNutrient.title,
        content: pestNutrient.content,
      });
      toast.success('Pest/Nutrient updated');
      navigate('/inventory/fni');
    } catch (error) {
      toast.error('Failed to update pest/nutrient');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/pestnutrients/${id}`);
      toast.success('Pest/Nutrient deleted');
      navigate('/inventory/fni');
    } catch (error) {
      toast.error('Failed to delete pest/nutrient');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 flex justify-center items-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!pestNutrient) {
    return <div className="p-4">Pest/Nutrient not found</div>;
  }

  return (
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto p-4 max-w-2xl">
        <h1 className="text-2xl font-bold mb-4">Edit Pest/Nutrient</h1>
        <div className="space-y-4">
          <div>
            <label className="block mb-1 font-semibold">Title</label>
            <input
              className="input input-bordered w-full"
              value={pestNutrient.title}
              onChange={(e) => setPestNutrient({ ...pestNutrient, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Content</label>
            <textarea
              className="textarea textarea-bordered w-full h-32"
              value={pestNutrient.content || ''}
              onChange={(e) => setPestNutrient({ ...pestNutrient, content: e.target.value })}
            />
          </div>
          <div className="flex gap-4">
            <button className="btn btn-warning" onClick={handleUpdate}>
              Update
            </button>
            <button className="btn btn-error" onClick={handleDelete}>
              Delete
            </button>
            <button className="btn btn-ghost flex items-center gap-1" onClick={() => navigate('/inventory/fni')}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FNIDetailPage;
