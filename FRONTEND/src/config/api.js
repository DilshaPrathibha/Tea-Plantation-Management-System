// API configuration that adapts to network access and production
export function getApiBaseUrl() {
  // First, check if we have a production API URL configured
  const productionApiUrl = import.meta.env.VITE_API_URL;
  
  // If in production or if VITE_API_URL is set, use it
  if (productionApiUrl && (import.meta.env.PROD || productionApiUrl.includes('onrender.com'))) {
    return productionApiUrl;
  }
  
  // Get current host information for development
  const { protocol, hostname } = window.location;
  
  // If accessing via localhost or 127.0.0.1, always use localhost for backend
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5001';
  }
  
  // Check if we have a configured API URL for network access
  if (productionApiUrl) {
    return productionApiUrl;
  }
  
  // If accessing via network IP, use the same IP for backend
  return `${protocol}//${hostname}:5001`;
}

// API base URL for axios instances
export const API_BASE_URL = getApiBaseUrl();

// Complete API URL (with /api prefix)
export const API_URL = getApiBaseUrl();