import { useState, useEffect, useCallback } from 'react';
import { listItems } from '../api/fni';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5001/api',
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

const useDashboardStats = () => {
  const [stats, setStats] = useState({
    totalStockItems: 0,
    lowStockAlerts: 0,
    availableItems: 0,
    recentActivities: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fniResponse, toolsResponse] = await Promise.all([
        listItems(),
        api.get('/tools')
      ]);

      let adjustments = [];
      try {
        const adjustmentsResponse = await api.get('/fni/adjustments');
        adjustments = adjustmentsResponse.data || [];
      } catch (adjError) {
        console.warn('FNI adjustments endpoint not available:', adjError.message);
      }

      const fniItems = fniResponse.data || [];
      const toolsItems = toolsResponse.data || [];

      const totalStockItems = fniItems.length + toolsItems.length;
      
      const fniLowStock = fniItems.filter(item => 
        Number(item.qtyOnHand) <= Number(item.minQty) && Number(item.minQty) > 0
      ).length;
      
      const toolsNeedRepair = toolsItems.filter(tool => 
        String(tool.condition).toLowerCase() === 'needs_repair'
      ).length;
      
      const lowStockAlerts = fniLowStock + toolsNeedRepair;
      
      const fniAvailable = fniItems.filter(item => Number(item.qtyOnHand) > 0).length;
      const toolsAvailable = toolsItems.filter(tool => tool.status === 'available').length;
      const availableItems = fniAvailable + toolsAvailable;

      const recentActivities = generateRecentActivities(fniItems, toolsItems, adjustments);

      setStats({
        totalStockItems,
        lowStockAlerts,
        availableItems,
        recentActivities
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard statistics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateRecentActivities = (fniItems, toolsItems, adjustments) => {
    const activities = [];

    const lowStockFNI = fniItems.filter(item => 
      Number(item.qtyOnHand) <= Number(item.minQty) && Number(item.minQty) > 0
    );
    
    if (lowStockFNI.length > 0) {
      const item = lowStockFNI[0];
      activities.push({
        type: 'low_stock',
        icon: 'AlertTriangle',
        color: 'text-red-400',
        title: 'Low stock alert',
        description: `${item.name} (${item.category}) - Current: ${item.qtyOnHand} ${item.unit}`,
        time: 'Live update'
      });
    }

    const needsRepairTools = toolsItems.filter(tool => 
      String(tool.condition).toLowerCase() === 'needs_repair'
    );
    
    if (needsRepairTools.length > 0) {
      activities.push({
        type: 'repair_needed',
        icon: 'Wrench',
        color: 'text-red-400',
        title: 'Tools need attention',
        description: `${needsRepairTools.length} tool${needsRepairTools.length !== 1 ? 's' : ''} require${needsRepairTools.length === 1 ? 's' : ''} repair`,
        time: 'Live update'
      });
    }

    const assignedTools = toolsItems.filter(tool => tool.status === 'assigned');
    if (assignedTools.length > 0) {
      activities.push({
        type: 'tools_in_use',
        icon: 'Wrench',
        color: 'text-warning',
        title: 'Tools currently in use',
        description: `${assignedTools.length} tool${assignedTools.length !== 1 ? 's' : ''} assigned to workers`,
        time: 'Live update'
      });
    }

    const recentAdjustments = adjustments
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 2);

    recentAdjustments.forEach(adjustment => {
      const timeAgo = getTimeAgo(new Date(adjustment.createdAt));
      activities.push({
        type: 'stock_update',
        icon: 'Package',
        color: adjustment.delta > 0 ? 'text-green-400' : 'text-blue-400',
        title: adjustment.delta > 0 ? 'Stock added' : 'Stock adjusted',
        description: `${adjustment.itemName}: ${adjustment.delta > 0 ? '+' : ''}${adjustment.delta} ${adjustment.unit}`,
        time: timeAgo
      });
    });

    return activities.slice(0, 5);
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    
    const interval = setInterval(fetchDashboardStats, 30000);
    
    return () => clearInterval(interval);
  }, [fetchDashboardStats]);

  const refreshStats = () => {
    fetchDashboardStats();
  };

  return {
    ...stats,
    isLoading,
    error,
    refreshStats
  };
};

export default useDashboardStats;