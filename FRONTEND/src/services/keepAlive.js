import axios from 'axios';
import { API_BASE_URL } from '../config/api.js';

/**
 * Service to keep the backend alive by pinging it periodically
 * Helps prevent cold starts on Render/Vercel free tiers
 */
class KeepAliveService {
  constructor() {
    this.pingInterval = null;
    this.pingIntervalMs = 13 * 60 * 1000; // 13 minutes (Render sleeps after 15 mins of inactivity)
    this.isActive = false;
  }

  /**
   * Start pinging the backend
   */
  start() {
    if (this.isActive) {
      console.log('⚡ Keep-alive service already running');
      return;
    }

    console.log('⚡ Starting keep-alive service');
    this.isActive = true;

    // Do an initial ping
    this.ping();

    // Set up periodic pings
    this.pingInterval = setInterval(() => {
      this.ping();
    }, this.pingIntervalMs);
  }

  /**
   * Stop pinging the backend
   */
  stop() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
      this.isActive = false;
      console.log('⚡ Keep-alive service stopped');
    }
  }

  /**
   * Ping the backend health endpoint
   */
  async ping() {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`, {
        timeout: 5000
      });
      
      if (response.data.ok) {
        console.log('⚡ Keep-alive ping successful');
      }
    } catch (error) {
      console.warn('⚠️ Keep-alive ping failed:', error.message);
    }
  }
}

// Create a singleton instance
export const keepAliveService = new KeepAliveService();

// Auto-start when user is authenticated
export function startKeepAliveIfAuthenticated() {
  const token = localStorage.getItem('token');
  if (token && !keepAliveService.isActive) {
    keepAliveService.start();
  }
}

// Stop when user logs out
export function stopKeepAlive() {
  keepAliveService.stop();
}
