import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import NoteCard from '@/components/NoteCard';
import RateLimitedUI from '@/components/RateLimitedUI';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const api = axios.create({
  baseURL: 'http://localhost:5001/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  }
});

const FNIPage = () => {
  const [pestNutrients, setPestNutrients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const navigate = useNavigate();

  const fetchPestNutrients = async () => {
    try {
      const response = await api.get('/pestnutrients');
      setPestNutrients(response.data);
      setIsRateLimited(false);
    } catch (error) {
      console.error("Failed to fetch pest/nutrients", error);
      if (error.response?.status === 429) {
        setIsRateLimited(true);
        toast.error("You are being rate-limited. Please try again shortly.");
      } else {
        toast.error("Could not load pest/nutrients.");
      }
    } finally {
      setLoading(false);
    }
  };

  const deletePestNutrient = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this pest/nutrient?");
    if (!confirmDelete) return;

    try {
      await api.delete(`/pestnutrients/${id}`);
      setPestNutrients(prev => prev.filter(n => n._id !== id));
      toast.success("Pest/Nutrient deleted");
    } catch (err) {
      console.error("Delete failed", err);
      if (err.response?.status === 429) {
        toast.error("Rate limit reached. Try again later.");
        setIsRateLimited(true);
      } else {
        toast.error("Delete failed");
      }
    }
  };

  useEffect(() => {
    fetchPestNutrients();
  }, []);

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />

      <div className="container mx-auto p-4">
        {isRateLimited && <RateLimitedUI />}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <NoteCard
              isNewNote
              onClick={() => navigate('/FNI/create')}
            />
            {pestNutrients.map(pestNutrient => (
              <NoteCard
                key={pestNutrient._id}
                pestNutrient={pestNutrient}
                onDelete={deletePestNutrient}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FNIPage;
