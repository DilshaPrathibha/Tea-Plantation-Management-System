import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { Sweet, Toast } from '@/utils/sweet';
import { API_URL } from '../config/api.js';

const api = axios.create({
  baseURL: API_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const NoteDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchNote = async () => {
    try {
      const response = await api.get(`/notes/${id}`);
      setNote(response.data);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load note");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      await api.put(`/notes/${id}`, {
        title: note.title,
        content: note.content
      });
      toast.success("Note updated");
      navigate('/');
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update note");
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/notes/${id}`);
      toast.success("Note deleted");
      navigate('/');
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete note");
    }
  };

  useEffect(() => {
    fetchNote();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 flex justify-center items-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!note) {
    return <div className="p-4">Note not found</div>;
  }

  return (
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto p-4 max-w-2xl">
        <h1 className="text-2xl font-bold mb-4">Edit Note</h1>

        <div className="space-y-4">
          <div>
            <label className="block mb-1 font-semibold">Title</label>
            <input
              className="input input-bordered w-full"
              value={note.title}
              onChange={(e) => setNote({ ...note, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold">Content</label>
            <textarea
              className="textarea textarea-bordered w-full h-40"
              value={note.content}
              onChange={(e) => setNote({ ...note, content: e.target.value })}
            />
          </div>

          <div className="flex gap-4">
            <button className="btn btn-warning" onClick={handleUpdate}>
              Update
            </button>
            <button className="btn btn-error" onClick={handleDelete}>
              Delete
            </button>
            <button className="btn" onClick={() => navigate('/')}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteDetailPage;
