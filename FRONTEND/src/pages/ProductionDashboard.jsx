import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Factory, Truck, Package, BarChart3, Calendar, Users } from 'lucide-react';

const ProductionDashboard = () => {
  const navigate = useNavigate();

  const stats = [
    { label: 'Today\'s Batches', value: '12', icon: Factory, color: 'text-blue-500' },
    { label: 'Pending Transport', value: '5', icon: Truck, color: 'text-orange-500' },
    { label: 'Completed Today', value: '8', icon: Package, color: 'text-green-500' },
    { label: 'Total Workers', value: '45', icon: Users, color: 'text-purple-500' }
  ];

  const quickActions = [
    {
      title: 'Create Batch',
      desc: 'Add new production batch',
      icon: Factory,
      action: () => navigate('/create-production-batch'),
      color: 'bg-blue-100 text-blue-600'
    },
    {
      title: 'Manage Transport',
      desc: 'Schedule tea transport',
      icon: Truck,
      action: () => navigate('/transports'),
      color: 'bg-orange-100 text-orange-600'
    },
    {
      title: 'View Reports',
      desc: 'Production reports',
      icon: BarChart3,
      action: () => alert('Reports page coming soon'),
      color: 'bg-green-100 text-green-600'
    }
  ];

  return (
    <div className="min-h-screen bg-base-200 p-4">
      <div className="max-w-6xl mx-auto">

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Production Manager Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's today's overview.</p>
        </div>
        <button 
          onClick={() => navigate('/profile')} 
          className="btn btn-ghost flex items-center gap-2"
        >
          <Users className="w-5 h-5" />
          <span>MyProfile</span>
        </button>
      </div>


       
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
        </div>
        

        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg p-6 shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-gray-600">{stat.label}</p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </div>
          ))}
        </div>

      
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className="bg-white rounded-lg p-6 shadow border text-left hover:shadow-md transition"
            >
              <div className={`w-12 h-12 rounded-full ${action.color} flex items-center justify-center mb-4`}>
                <action.icon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{action.title}</h3>
              <p className="text-gray-600">{action.desc}</p>
            </button>
          ))}
        </div>

        
        <div className="bg-white rounded-lg p-6 shadow border">
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
              <Calendar className="w-5 h-5 text-blue-500" />
              <div>
                <p className="font-medium">New batch created</p>
                <p className="text-sm text-gray-600">Batch #PB123 - 2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
              <Truck className="w-5 h-5 text-green-500" />
              <div>
                <p className="font-medium">Transport scheduled</p>
                <p className="text-sm text-gray-600">Vehicle #VAN-001 - 4 hours ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductionDashboard;