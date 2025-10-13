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

const useSupplierStats = () => {
  const [stats, setStats] = useState(initialStats);
  const [suppliers, setSuppliers] = useState([]);

  const fetchSuppliers = useCallback(async () => {
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
      console.error('Failed to fetch suppliers:', error);
      setStats(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to fetch suppliers data'
      }));
    }
  }, []);

  useEffect(() => {
    fetchSuppliers();
    const interval = setInterval(fetchSuppliers, 30000);
    return () => clearInterval(interval);
  }, [fetchSuppliers]);

  return {
    ...stats,
    suppliers,
    refreshStats: fetchSuppliers
  };
};

export default useSupplierStats;
