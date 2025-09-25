// FRONTEND/src/pages/ProductionBatchPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
// NOTE: Navbar removed – RootLayout provides the global navbar
import ProductionBatchCard from '../components/ProductionBatchCard';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const ProductionBatchPage = () => {
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  useEffect(() => {
    fetchBatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBatches = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/production-batches`);
      setBatches(response.data || []);
    } catch (error) {
      console.error('Error fetching batches:', error);
      Swal.fire('Error', 'Failed to load batches', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredBatches = batches.filter((batch) => {
    const id = (batch?.batchId || '').toLowerCase();
    const matchesSearch = id.includes(searchText.toLowerCase());
    const matchesFilter = filterStatus === 'all' || batch.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleCreate = () => {
    navigate('/create-production-batch');
  };

  const handleEdit = (batch) => {
    navigate(`/edit-production-batch/${batch._id}`);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`${API_URL}/api/production-batches/${id}`);
      await fetchBatches();
      Swal.fire('Deleted!', 'Batch deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting batch:', error);
      Swal.fire('Error', 'Failed to delete batch', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200">
        <div className="container mx-auto p-4 flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Production Batches</h1>
          <button onClick={handleCreate} className="btn btn-primary">
            <Plus className="w-5 h-5 mr-2" />
            Add New Batch
          </button>
        </div>

        <div className="bg-base-300 p-4 rounded-lg shadow mb-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="label text-white">Search</label>
              <input
                type="text"
                placeholder="Search by field or batch ID..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="input input-bordered w-full bg-base-200 text-white"
              />
            </div>

            <div className="flex-1">
              <label className="label text-white">Filter by Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="select select-bordered w-full bg-base-200 text-white"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <p className="text-sm text-gray-300 mt-2">
            Showing {filteredBatches.length} of {batches.length} records
          </p>
        </div>

        {batches.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No production batches found.</p>
            <button onClick={handleCreate} className="btn btn-primary mt-4">
              Create Your First Batch
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBatches.map((batch) => (
              <ProductionBatchCard
                key={batch._id}
                batch={batch}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductionBatchPage;
