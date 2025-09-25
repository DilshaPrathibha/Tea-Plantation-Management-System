// FRONTEND/src/pages/ProductionDashboard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Factory, Truck, Package, BarChart3, Calendar, Users, LogOut } from 'lucide-react';
import { Sweet } from '@/utils/sweet';

const ProductionDashboard = () => {
  const navigate = useNavigate();

  const logout = async () => {
    const ok = await Sweet.confirm('Log out from Production Manager?');
    if (!ok) return;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    await Sweet.success('Signed out');
    navigate('/login');
  };

  const stats = [
    { label: "Today's Batches", value: '12', icon: Factory, color: 'text-blue-400' },
    { label: 'Pending Transport', value: '5', icon: Truck, color: 'text-orange-400' },
    { label: 'Completed Today', value: '8', icon: Package, color: 'text-green-400' },
    { label: 'Total Workers', value: '45', icon: Users, color: 'text-purple-400' }
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
      icon: Truck,
      action: () => navigate('/vehicle-tracking'),
      color: 'bg-purple-900 text-purple-200'
    }
  ];

  return (
    <>
      {/* No local <Navbar /> — RootLayout already renders the global navbar */}
      <div className="min-h-screen bg-base-200 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-100">Production Manager Dashboard</h1>
              <p className="text-gray-400">Welcome back! Here's today's overview.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/profile')}
                className="btn btn-ghost flex items-center gap-2 text-gray-300"
              >
                <Users className="w-5 h-5" />
                <span>MyProfile</span>
              </button>
              <button
                className="btn btn-ghost text-red-400 hover:text-red-300 hover:bg-red-900/20"
                onClick={logout}
              >
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </button>
            </div>
          </div>

          {/* Quick links row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
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

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-base-100 p-4 rounded-lg shadow mb-4 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-gray-400">{stat.label}</p>
                  </div>
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className="bg-base-100 p-4 rounded-lg shadow mb-4 border border-gray-700 text-left hover:bg-gray-900 transition"
              >
                <div className={`w-12 h-12 rounded-full ${action.color} flex items-center justify-center mb-4`}>
                  <action.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-white">{action.title}</h3>
                <p className="text-gray-400">{action.desc}</p>
              </button>
            ))}
          </div>

          {/* Recent activity */}
          <div className="bg-base-300 p-4 rounded-lg shadow mb-4 border border-gray-700">
            <h2 className="text-xl font-bold mb-4 text-white">Recent Activity</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-base-100 rounded">
                <Calendar className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="font-medium text-white">New batch created</p>
                  <p className="text-sm text-gray-400">Batch #PB123 - 2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-base-100 rounded">
                <Truck className="w-5 h-5 text-green-400" />
                <div>
                  <p className="font-medium text-white">Transport scheduled</p>
                  <p className="text-sm text-gray-400">Vehicle #VAN-001 - 4 hours ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductionDashboard;
