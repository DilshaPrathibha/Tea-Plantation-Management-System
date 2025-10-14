import axios from 'axios';
import { API_URL } from '../config/api.js';

const api = axios.create({
  baseURL: `${API_URL}/suppliers`,
  timeout: 15000, // Increased from 5s to 15s for slow connections
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function listSuppliers(params) {
  return api.get('/', { params });
}

export function getSupplier(id) {
  return api.get(`/${id}`);
}

export function createSupplier(data) {
  return api.post('/', data);
}

export function updateSupplier(id, data) {
  return api.put(`/${id}`, data);
}

export function deleteSupplier(id) {
  return api.delete(`/${id}`);
}

export function suspendSupplier(id) {
  return api.post(`/${id}/suspend`);
}

export function activateSupplier(id) {
  return api.post(`/${id}/activate`);
}
