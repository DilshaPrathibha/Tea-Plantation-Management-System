// Copied from NEWPAGES
// ...existing code from NEWPAGES/FRONTEND/src/pages/FNIPage.jsx...


import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { listItems, deleteItem } from '@/api/fni';
import FNIAdjustModal from '@/components/FNIAdjustModal';

export default function FNIPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustItem, setAdjustItem] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const navigate = useNavigate();

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = {};
      if (category) params.category = category;
      if (search) params.q = search;
      const res = await listItems(params);
      setItems(res.data);
    } catch (err) {
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [category, search]);

  const handleDelete = async (item) => {
    if (item.qtyOnHand > 0) {
      return toast.error('Cannot delete: qtyOnHand > 0');
    }
    if (!window.confirm('Delete this item?')) return;
    try {
      await deleteItem(item._id);
      toast.success('Item deleted');
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />
      <div className="container mx-auto p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
          <input
            className="input input-bordered w-full md:w-64"
            placeholder="Search FNI items..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="select select-bordered w-full md:w-40" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">All Categories</option>
            <option value="fertilizer">Fertilizer</option>
            <option value="insecticide">Insecticide</option>
          </select>
          <button className="btn btn-primary ml-auto" onClick={() => navigate('/fni/create')}>+ New</button>
        </div>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(item => (
              <div key={item._id} className="card bg-base-100 shadow-md p-4">
                <div className="font-bold text-lg mb-1">{item.name}</div>
                <div className="mb-1 text-base-content/70">{item.category} &bull; {item.unit}</div>
                <div className="mb-1">Qty on hand: <span className="font-semibold">{item.qtyOnHand}</span></div>
                {item.minQty > 0 && (
                  <div className="mb-1">Min Qty: <span className="font-semibold">{item.minQty}</span></div>
                )}
                <div className="mb-2 text-sm text-base-content/70">{item.note}</div>
                <div className="flex gap-2">
                  <button className="btn btn-sm btn-neutral" onClick={() => { setAdjustItem(item); setAdjustOpen(true); }}>Adjust</button>
                  <button className="btn btn-sm btn-warning" onClick={() => navigate(`/fni/${item._id}/edit`)}>Edit</button>
                  <button className="btn btn-sm btn-error" onClick={() => handleDelete(item)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
        <FNIAdjustModal
          open={adjustOpen}
          onClose={() => setAdjustOpen(false)}
          item={adjustItem}
          onDone={fetchItems}
        />
      </div>
    </div>
  );
}
