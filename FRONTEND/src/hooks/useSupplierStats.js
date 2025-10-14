import { useState, useEffect, useCallback } from 'react';
import { listSuppliers } from '../api/suppliers';

const initialStats = {
  totalSuppliers: 0,
  activeSuppliers: 0,
  pendingSuppliers: 0,
  suspendedSuppliers: 0,
  uniqueTypes: 0,
  isLoading: true,
  error: null,
  lastUpdated: null
};

const useSupplierStats = (shouldLoad = true) => {
  const [stats, setStats] = useState(initialStats);
  const [suppliers, setSuppliers] = useState([]);

  const fetchSuppliers = useCallback(async (retryCount = 0) => {
    const MAX_RETRIES = 2;
    
    try {
      setStats(prev => ({ ...prev, isLoading: true, error: null }));
      const response = await listSuppliers();
      const data = Array.isArray(response.data) ? response.data : [];
      setSuppliers(data);

      const totals = data.reduce(
        (acc, supplier) => {
          const status = (supplier.status || '').toLowerCase();
          if (status === 'active') acc.active += 1;
          else if (status === 'pending') acc.pending += 1;
          else if (status === 'suspended') acc.suspended += 1;
          return acc;
        },
        { active: 0, pending: 0, suspended: 0 }
      );

      const typeSet = new Set(
        data
          .map(s => s.type)
          .filter(Boolean)
      );

      setStats({
        totalSuppliers: data.length,
        activeSuppliers: totals.active,
        pendingSuppliers: totals.pending,
        suspendedSuppliers: totals.suspended,
        uniqueTypes: typeSet.size,
        isLoading: false,
        error: null,
        lastUpdated: new Date()
      });
    } catch (error) {
      // Determine if error is retryable
      const isNetworkError = !error.response || error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK';
      const shouldRetry = isNetworkError && retryCount < MAX_RETRIES;
      
      if (shouldRetry) {
        console.log(`Retrying suppliers fetch... (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return fetchSuppliers(retryCount + 1);
      }
      
      let errorMessage = 'Failed to fetch suppliers data';
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout - server may be slow';
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Network error - check connection';
      }
      
      console.error('Failed to fetch suppliers:', error);
      setStats(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
    }
  }, []);

  useEffect(() => {
    if (!shouldLoad) {
      setStats(prev => ({ ...prev, isLoading: true }));
      return;
    }
    
    fetchSuppliers();
    // Temporarily disabled auto-refresh
    // const interval = setInterval(fetchSuppliers, 30000);
    // return () => clearInterval(interval);
  }, [fetchSuppliers, shouldLoad]);

  return {
    ...stats,
    suppliers,
    refreshStats: fetchSuppliers
  };
};

export default useSupplierStats;
