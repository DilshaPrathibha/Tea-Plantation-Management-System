import axios from 'axios';
import Swal from 'sweetalert2';

const API = import.meta.env?.VITE_API_URL || 'http://localhost:5001';

// Create an Axios instance
const api = axios.create({
  baseURL: API,
});

// Exponential backoff utility
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Rate limit handler
api.interceptors.response.use(
  response => response,
  async error => {
    const config = error.config;
    if (!config) return Promise.reject(error);

    // Track retry count on the config
    config.__retryCount = config.__retryCount || 0;
    const maxRetries = 3;
    const status = error.response?.status;
    if (status === 429 && config.__retryCount < maxRetries) {
      config.__retryCount += 1;
      // Use Retry-After header if available, else exponential backoff
      const retryAfter =
        parseInt(error.response.headers['retry-after']) || Math.pow(2, config.__retryCount) * 1000;
      // Optionally show a UI message here
      await sleep(retryAfter);
      return api(config);
    }
    if (status === 429) {
      Swal.fire({
        title: 'Rate Limited',
        text: 'Too many requests. Please try again later.',
        icon: 'warning',
        confirmButtonText: 'OK',
        confirmButtonColor: '#059669',
      });
    }
    return Promise.reject(error);
  }
);

export default api;
