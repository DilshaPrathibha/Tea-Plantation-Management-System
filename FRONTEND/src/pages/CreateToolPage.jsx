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

const CreateToolPage = () => {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [description, setDescription] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !quantity) {
      toast.error('Name and quantity are required');
      return;
    }

    try {
      await api.post('/tools', { name, quantity, description });
      toast.success('Tool created successfully');
      navigate('/tools');
    } catch (error) {
      console.error("Create failed:", error);
      toast.error('Failed to create tool');
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Add New Tool</h1>

        <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
          <div>
            <label className="block mb-1 font-semibold">Name</label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter tool name"
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold">Quantity</label>
            <input
              type="number"
              className="input input-bordered w-full"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold">Description</label>
            <textarea
              className="textarea textarea-bordered w-full h-32"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
            />
          </div>

          <button type="submit" className="btn btn-primary">
            Add Tool
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateToolPage;
