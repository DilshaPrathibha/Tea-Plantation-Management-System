import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import { Sweet, Toast } from '@/utils/sweet';

const api = axios.create({
  baseURL: 'http://localhost:5001/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const CreatePage = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !content) {
      Toast.error('Both title and content are required');
      return;
    }

    try {
      await api.post('/notes', { title, content });
      Toast.success('Note created successfully');
      navigate('/');
    } catch (error) {
      console.error("Create failed:", error);
      Sweet.error({ title: 'Failed to create note', text: error?.response?.data?.message || 'Please try again.' });
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Create New Note</h1>

        <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
          <div>
            <label className="block mb-1 font-semibold">Title</label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter note title"
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold">Content</label>
            <textarea
              className="textarea textarea-bordered w-full h-40"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter note content"
            />
          </div>

          <button type="submit" className="btn btn-primary">
            Create Note
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreatePage;
