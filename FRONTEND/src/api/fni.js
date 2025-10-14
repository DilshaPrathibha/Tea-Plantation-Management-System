import axios from 'axios';
import { API_URL } from '../config/api.js';

const api = axios.create({
  baseURL: `${API_URL}/fni`,
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function createItem(data) {
  return api.post('/items', data);
}

export function listItems(params) {
  return api.get('/items', { params });
}

export function getItem(id) {
  return api.get(`/items/${id}`);
}

export function updateItem(id, data) {
  return api.patch(`/items/${id}`, data);
}

export function deleteItem(id) {
  return api.delete(`/items/${id}`);
}

export function adjustStock(id, { delta, reason, note, cost }) {
  const payload = { delta, reason, note };
  if (cost !== undefined) payload.cost = cost;
  return api.post(`/items/${id}/adjust`, payload);
}
