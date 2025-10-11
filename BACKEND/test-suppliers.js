// Test script to add sample suppliers
const axios = require('axios');

const API_URL = 'http://localhost:5001/api';

const sampleSuppliers = [
  {
    name: 'Green Valley Fertilizers Ltd',
    type: 'fertilizer',
    contactNumber: '+94 11 234 5678',
    email: 'sales@greenvalley.lk',
    address: 'No. 45, Industrial Zone, Colombo 10',
    status: 'active',
    notes: 'Primary fertilizer supplier for organic products',
    contactPerson: 'Mr. Samantha Perera',
    emergencyContact: '+94 77 123 4567'
  },
  {
    name: 'AgriProtect Solutions',
    type: 'insecticide',
    contactNumber: '+94 11 987 6543',
    email: 'info@agriprotect.lk',
    address: 'No. 123, Galle Road, Ratmalana',
    status: 'active',
    notes: 'Specialized in eco-friendly pest control solutions',
    contactPerson: 'Dr. Nimal Fernando',
    emergencyContact: '+94 70 987 6543'
  },
  {
    name: 'Tea Tools & Equipment Co.',
    type: 'tools',
    contactNumber: '+94 81 222 3333',
    email: 'orders@teatools.lk',
    address: 'Kandy Industrial Estate, Kandy',
    status: 'pending',
    notes: 'New supplier under evaluation for tool quality',
    contactPerson: 'Ms. Kavitha Silva',
    emergencyContact: '+94 71 222 3333'
  }
];

async function addSampleSuppliers() {
  try {
    for (const supplier of sampleSuppliers) {
      const response = await axios.post(`${API_URL}/suppliers`, supplier);
      console.log(`Added supplier: ${supplier.name} - ${response.data.supplier.supplierId}`);
    }
    console.log('All sample suppliers added successfully!');
  } catch (error) {
    console.error('Error adding suppliers:', error.response?.data?.message || error.message);
  }
}

addSampleSuppliers();