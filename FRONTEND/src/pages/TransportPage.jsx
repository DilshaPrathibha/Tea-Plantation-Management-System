import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import TransportCard from '../components/TransportCard';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TransportPage = () => {
  const navigate = useNavigate();
  const [transports, setTransports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredTransports = transports.filter(transport => {
  const matchesSearch = transport.vehicleId.toLowerCase().includes(searchText.toLowerCase()) || transport.driverName.toLowerCase().includes(searchText.toLowerCase());
  
  const matchesFilter = filterStatus === 'all' || transport.status === filterStatus;
  
  return matchesSearch && matchesFilter;

});


  const API_URL = 'http://localhost:5001';

  useEffect(() => {
    fetchTransports();
  }, []);

  const fetchTransports = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/transports`);
      setTransports(response.data);
    } catch (error) {
      console.error('Error fetching transports:', error);
      alert('Failed to load transports');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    navigate('/create-transport');
  };

 const handleEdit = (transport) => {
  navigate(`/edit-transport/${transport._id}`);
};

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this transport record?')) return;
    
    try {
      await axios.delete(`${API_URL}/api/transports/${id}`);
      fetchTransports();
      alert('Transport record deleted successfully');
    } catch (error) {
      console.error('Error deleting transport:', error);
      alert('Failed to delete transport record');
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-base-200">
        <Navbar />
        <div className="container mx-auto p-4 flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />
      
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Transport Management</h1>
          <button onClick={handleCreate} className="btn btn-primary">
            <Plus className="w-5 h-5 mr-2" />
            Add New Transport
          </button>
        </div>


        <div className="bg-base-300 p-4 rounded-lg shadow mb-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="label text-white">Search</label>
              <input
                type="text"
                placeholder="Search by vehicle or driver..."
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
                <option value="scheduled">Scheduled</option>
                <option value="in-transit">In Transit</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
          </div>
          
          <p className="text-sm text-gray-300 mt-2">
            Showing {filteredTransports.length} of {transports.length} records          </p>
        </div>

        

        {transports.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No transport records found.</p>
            <button onClick={handleCreate} className="btn btn-primary mt-4">
              Create Your First Transport Record
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTransports.map(transport => (
              <TransportCard
                key={transport._id}
                transport={transport}
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

export default TransportPage;