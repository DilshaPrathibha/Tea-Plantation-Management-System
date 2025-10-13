import axios from 'axios';
import { API_URL } from '../config/api.js';

const api = axios.create({
  baseURL: `${API_URL}/suppliers`,
  timeout: 5000,
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
