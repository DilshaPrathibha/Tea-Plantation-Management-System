import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import ToolCard from '@/components/ToolCard';
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

const ToolsPage = () => {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const navigate = useNavigate();

  const fetchTools = async () => {
    try {
      const response = await api.get('/tools');
      setTools(response.data);
      setIsRateLimited(false);
    } catch (error) {
      console.error("Failed to fetch tools", error);
      if (error.response?.status === 429) {
        setIsRateLimited(true);
        toast.error("You are being rate-limited. Please try again shortly.");
      } else {
        toast.error("Could not load tools.");
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteTool = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this tool?");
    if (!confirmDelete) return;

    try {
      await api.delete(`/tools/${id}`);
      setTools(prev => prev.filter(t => t._id !== id));
      toast.success("Tool deleted");
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
    fetchTools();
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
            <ToolCard
              isNewTool
              onClick={() => navigate('/tools/create')}
            />
            {tools.map(tool => (
              <ToolCard
                key={tool._id}
                tool={tool}
                onDelete={deleteTool}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolsPage;
