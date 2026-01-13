import axios from 'axios';
import { API_BASE_URL } from '../config/api.js';

/**
 * Warms up the backend by pinging the warmup endpoint
 * This ensures the backend is ready before making actual API calls
 * Handles cold starts on Render/Vercel
 */
export async function warmupBackend() {
  const maxRetries = 5;
  const retryDelay = 2000; // 2 seconds
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔥 Warming up backend... (attempt ${attempt}/${maxRetries})`);
      
      const response = await axios.get(`${API_BASE_URL}/api/warmup`, {
        timeout: 10000 // 10 second timeout
      });
      
      if (response.data.status === 'ready') {
        console.log('✅ Backend is ready!');
        return { ready: true, attempts: attempt };
      } else if (response.data.status === 'warming') {
        console.log('⏳ Backend is warming up...');
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    } catch (error) {
      console.warn(`⚠️ Warmup attempt ${attempt} failed:`, error.message);
      
      // If this is the last attempt, return false
      if (attempt === maxRetries) {
        console.error('❌ Backend warmup failed after all retries');
        return { ready: false, attempts: attempt };
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  return { ready: false, attempts: maxRetries };
}

/**
 * Wrapper for API calls that automatically warms up the backend on first failure
 */
export async function makeApiCallWithWarmup(apiCallFn, options = {}) {
  const { maxRetries = 2, retryDelay = 3000 } = options;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCallFn();
    } catch (error) {
      // Check if it's a timeout or connection error (cold start symptom)
      const isColdStartError = 
        error.code === 'ECONNABORTED' || 
        error.code === 'ECONNREFUSED' ||
        error.code === 'ERR_NETWORK' ||
        !error.response;
      
      if (isColdStartError && attempt < maxRetries) {
        console.log(`🔥 Cold start detected, warming up backend...`);
        await warmupBackend();
        
        // Wait a bit more before retrying the actual call
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        console.log(`🔄 Retrying API call (attempt ${attempt + 1}/${maxRetries})...`);
      } else {
        throw error; // Re-throw if not a cold start or last attempt
      }
    }
  }
}
