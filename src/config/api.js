// API configuration that adapts to network access
export function getApiBaseUrl() {
  // Get current host information
  const { protocol, hostname } = window.location;
  
  // If accessing via localhost or 127.0.0.1, always use localhost for backend
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5001';
  }
  
  // Check if we have a configured API URL for network access
  const configuredUrl = import.meta.env.VITE_API_URL;
  if (configuredUrl) {
    return configuredUrl;
  }
  
  // If accessing via network IP, use the same IP for backend
  return `${protocol}//${hostname}:5001`;
}

// API base URL for axios instances
export const API_BASE_URL = getApiBaseUrl();

// Complete API URL (with /api prefix)
export const API_URL = `${API_BASE_URL}/api`;