import axios from 'axios';

const base = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001') + '/api/fni';

export function createItem(data) {
  return axios.post(`${base}/items`, data);
}

export function listItems(params) {
  return axios.get(`${base}/items`, { params });
}

export function getItem(id) {
  return axios.get(`${base}/items/${id}`);
}

export function updateItem(id, data) {
  return axios.patch(`${base}/items/${id}`, data);
}

export function deleteItem(id) {
  return axios.delete(`${base}/items/${id}`);
}

export function adjustStock(id, { delta, reason, note, cost }) {
  const payload = { delta, reason, note };
  if (cost !== undefined) payload.cost = cost;
  return axios.post(`${base}/items/${id}/adjust`, payload);
}
