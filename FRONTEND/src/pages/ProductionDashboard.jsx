// FRONTEND/src/pages/ProductionDashboard.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Factory,
  Truck,
  Package,
  BarChart3,
  Users,
  LogOut,
  Ticket,
  RefreshCw,
  ClipboardList,
  MapPin
} from 'lucide-react';
import { Sweet } from '@/utils/sweet';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const toDateLabel = (value) => {
  if (!value) return 'Unknown date';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

const toISODate = (value) => {
  if (!value) return '';
  try {
    return new Date(value).toISOString().slice(0, 10);
  } catch {
    return '';
  }
};

const ProductionDashboard = () => {
  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem('token'), []);

  const [loadingSummary, setLoadingSummary] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [stats, setStats] = useState({
    todayBatches: 0,
    pendingTransports: 0,
    deliveredToday: 0,
    activeDrivers: 0
  });
  const [recentBatches, setRecentBatches] = useState([]);
  const [recentTransports, setRecentTransports] = useState([]);
  const [activeDrivers, setActiveDrivers] = useState([]);

  const headers = useMemo(
    () =>
      token
        ? {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        : undefined,
    [token]
  );

  const logout = useCallback(async () => {
    const ok = await Sweet.confirm('Log out from Production Manager?');
    if (!ok) return;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    await Sweet.success('Signed out');
    navigate('/login');
  }, [navigate]);

  const fetchDashboard = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const config = headers ? { headers } : undefined;
      const [batchesRes, transportsRes] = await Promise.all([
        axios.get(`${API}/api/production-batches`, config),
        axios.get(`${API}/api/transports`, config)
      ]);

      const batches = batchesRes.data || [];
      const transports = transportsRes.data || [];
      const today = new Date().toISOString().slice(0, 10);

      const todayBatches = batches.filter(
        (batch) => toISODate(batch.pluckingDate || batch.createdAt) === today
      ).length;

      const pendingTransports = transports.filter((t) => t.status !== 'delivered').length;

      const deliveredToday = transports.filter((t) => {
        if (t.status !== 'delivered') return false;
        const arrivalDate = toISODate(t.actualArrival || t.updatedAt);
        return arrivalDate === today;
      }).length;

      const driversOnDuty = Array.from(
        new Set(
          transports
            .filter((t) => t.status !== 'delivered')
            .map((t) => t.driverName)
            .filter(Boolean)
        )
      );

      const latestBatches = [...batches]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 4);

      const latestTransports = [...transports]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 4);

      setStats({
        todayBatches,
        pendingTransports,
        deliveredToday,
        activeDrivers: driversOnDuty.length
      });
      setRecentBatches(latestBatches);
      setRecentTransports(latestTransports);
      setActiveDrivers(driversOnDuty);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('[ProductionDashboard] fetch failed', error);
      const message = error?.response?.data?.message || 'Failed to load dashboard data';
      Sweet.error(message);
    } finally {
      setLoadingSummary(false);
    }
  }, [headers]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const statCards = [
    { label: "Today's Batches", value: stats.todayBatches, icon: Factory, color: 'text-blue-400' },
    { label: 'Active Transports', value: stats.pendingTransports, icon: Truck, color: 'text-orange-400' },
    { label: 'Delivered Today', value: stats.deliveredToday, icon: Package, color: 'text-green-400' },
    { label: 'Drivers on Duty', value: stats.activeDrivers, icon: Users, color: 'text-purple-400' }
  ];

  const quickActions = [
    {
      title: 'Create Batch',
      desc: 'Add new production batch',
      icon: Factory,
      action: () => navigate('/create-production-batch'),
      color: 'bg-blue-900 text-blue-200'
    },
    {
      title: 'Manage Transport',
      desc: 'Schedule tea transport',
      icon: Truck,
      action: () => navigate('/transports'),
      color: 'bg-orange-900 text-orange-200'
    },
    {
      title: 'View Reports',
      desc: 'Generate and view reports',
      icon: BarChart3,
      action: () => navigate('/reports'),
      color: 'bg-green-900 text-green-200'
    },
    {
      title: 'Vehicle Tracking',
      desc: 'Live GPS tracking & map',
      icon: MapPin,
      action: () => navigate('/vehicle-tracking'),
      color: 'bg-purple-900 text-purple-200'
    },
    {
      title: 'Support Tickets',
      desc: 'Raise or follow up on support tickets',
      icon: Ticket,
      action: () => navigate('/production/tickets'),
      color: 'bg-amber-900 text-amber-200'
    }
  ];

  return (
    <div className="min-h-screen bg-base-200 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-base-content">Production Manager Dashboard</h1>
            <p className="text-base-content/60">Welcome back! Here's the latest status across production and transport.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={fetchDashboard}
              className={`btn btn-outline btn-sm ${loadingSummary ? 'loading' : ''}`}
              disabled={loadingSummary}
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </button>
            <button
              className="btn btn-ghost btn-sm text-red-400 hover:text-red-300 hover:bg-red-900/20"
              onClick={logout}
            >
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          <button onClick={() => navigate('/production-batches')} className="btn btn-outline btn-sm">
            View Batches
          </button>
          <button onClick={() => navigate('/transports')} className="btn btn-outline btn-sm">
            View Transport
          </button>
          <button onClick={() => navigate('/create-production-batch')} className="btn btn-primary btn-sm">
            New Batch
          </button>
          <button onClick={() => navigate('/create-transport')} className="btn btn-primary btn-sm">
            New Transport
          </button>
          <button
            onClick={() => navigate('/vehicle-tracking')}
            className="btn btn-primary btn-sm"
            title="Open integrated vehicle tracking page"
          >
            Vehicle Map
          </button>
        </div>

        {lastUpdated && (
          <p className="text-xs text-gray-500 mb-3">
            Last updated {lastUpdated.toLocaleTimeString()} ({lastUpdated.toLocaleDateString()})
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat) => (
            <div key={stat.label} className="bg-base-100 p-4 rounded-lg shadow border border-base-content/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-base-content">{loadingSummary ? '—' : stat.value}</p>
                  <p className="text-base-content/60">{stat.label}</p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {quickActions.map((action) => (
            <button
              key={action.title}
              onClick={action.action}
              className="bg-base-100 p-4 rounded-lg shadow border border-base-content/10 text-left hover:bg-base-200 transition"
            >
              <div className={`w-12 h-12 rounded-full ${action.color} flex items-center justify-center mb-4`}>
                <action.icon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-base-content">{action.title}</h3>
              <p className="text-base-content/60 text-sm">{action.desc}</p>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-base-300 p-4 rounded-lg shadow border border-base-content/10">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList className="w-5 h-5 text-blue-300" />
              <h2 className="text-xl font-bold text-base-content">Recent Batches</h2>
            </div>
            <div className="space-y-3">
              {recentBatches.length === 0 && (
                <p className="text-sm text-base-content/60">No batches recorded yet.</p>
              )}
              {recentBatches.map((batch) => (
                <div key={batch._id} className="bg-base-100 rounded p-3 flex flex-col gap-1">
                  <div className="flex justify-between text-sm text-base-content/70">
                    <span className="font-semibold text-base-content">{batch.batchId}</span>
                    <span className="badge badge-sm capitalize">{batch.status || 'pending'}</span>
                  </div>
                  <div className="text-xs text-base-content/60">
                    <span>{batch.teaWeight} kg</span> • <span>{batch.qualityGrade}</span> •{' '}
                    <span>{batch.supervisor || 'Supervisor n/a'}</span>
                  </div>
                  <div className="text-xs text-base-content/50">{toDateLabel(batch.createdAt)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-base-300 p-4 rounded-lg shadow border border-base-content/10">
            <div className="flex items-center gap-2 mb-3">
              <Truck className="w-5 h-5 text-orange-300" />
              <h2 className="text-xl font-bold text-base-content">Transport Status</h2>
            </div>
            <div className="space-y-3">
              {recentTransports.length === 0 && (
                <p className="text-sm text-base-content/60">No transport records available.</p>
              )}
              {recentTransports.map((transport) => (
                <div key={transport._id} className="bg-base-100 rounded p-3 flex flex-col gap-1">
                  <div className="flex justify-between text-sm text-base-content/70">
                    <span className="font-semibold text-base-content">{transport.vehicleId}</span>
                    <span className={`badge badge-sm capitalize ${transport.status === 'delivered' ? 'badge-success' : 'badge-warning'}`}>
                      {transport.status}
                    </span>
                  </div>
                  <div className="text-xs text-base-content/60">
                    Driver: {transport.driverName || 'N/A'} • Batch: {transport.batchId || 'N/A'}
                  </div>
                  <div className="text-xs text-base-content/50">Updated {toDateLabel(transport.updatedAt)}</div>
                </div>
              ))}
            </div>
            {activeDrivers.length > 0 && (
              <div className="mt-4 pt-3 border-t border-base-200">
                <p className="text-sm font-semibold text-base-content">Drivers currently on duty</p>
                <p className="text-xs text-base-content/60">{activeDrivers.join(', ')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductionDashboard;
