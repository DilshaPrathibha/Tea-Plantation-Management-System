import React from 'react';
import { Link } from 'react-router-dom';
// Removed: InventoryManagerNavbar and global Navbar (provided by RootLayout)
import { Truck, BarChart2, AlertTriangle, Clock, TrendingUp, Wrench, FlaskConical, Download, Printer, RefreshCw } from 'lucide-react';
import useToolsStats from '../../hooks/useToolsStats';
import useFNIStats from '../../hooks/useFNIStats';
import useDashboardStats from '../../hooks/useDashboardStats';

const InventoryManagerDashboard = () => {
  const {
    totalTools,
    availableTools,
    assignedTools,
    needsRepairTools,
    uniqueTypes,
    isLoading: toolsLoading,
    error: toolsError,
    refreshStats,
    exportCSV,
    exportPDF
  } = useToolsStats();

  const {
    totalItems: fniTotalItems,
    lowStockItems: fniLowStockItems,
    fertilizers,
    insecticides,
    totalInventoryValue,
    isLoading: fniLoading,
    error: fniError,
    refreshStats: refreshFNIStats,
    exportCSV: exportFNICSV,
    exportPDF: exportFNIPDF
  } = useFNIStats();

  const {
    lowStockAlerts,
    recentActivities,
    isLoading: dashboardLoading,
    error: dashboardError,
    refreshStats: refreshDashboardStats
  } = useDashboardStats();

  const quickActions = [
    {
      title: 'Inventory Reports',
      desc: 'Generate and view inventory reports',
      icon: BarChart2,
      link: '/inventory-reports',
      color: 'bg-purple-900 text-purple-200'
    }
  ];

  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-6xl mx-auto p-2 sm:p-4">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">Inventory Manager Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-400">Welcome back! Here's your inventory overview.</p>
        </div>

        {/* Tools Management Section */}
        <div className="bg-base-100 p-4 sm:p-6 rounded-lg shadow mb-6 sm:mb-8 border border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3 sm:gap-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-900 text-orange-200 flex items-center justify-center">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  Tools Management
                  {toolsLoading && (
                    <span className="loading loading-spinner loading-sm text-primary"></span>
                  )}
                </h2>
                <p className="text-sm text-gray-400">
                  Live tools statistics and quick actions
                  {!toolsLoading && (
                    <span className="text-green-400 ml-2">• Updated</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={refreshStats}
                className="btn btn-ghost btn-sm text-gray-400 hover:text-white"
                disabled={toolsLoading}
              >
                <RefreshCw className={`w-4 h-4 ${toolsLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline ml-1">Refresh</span>
              </button>
              <button
                onClick={exportCSV}
                className="btn btn-outline btn-sm gap-2"
                disabled={toolsLoading || totalTools === 0}
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">CSV</span>
              </button>
              <button
                onClick={exportPDF}
                className="btn btn-outline btn-sm gap-2"
                disabled={toolsLoading || totalTools === 0}
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Export PDF</span>
                <span className="sm:hidden">PDF</span>
              </button>
              <Link to="/tools" className="btn btn-primary btn-sm">
                <span className="hidden sm:inline">View All Tools</span>
                <span className="sm:hidden">Tools</span>
              </Link>
            </div>
          </div>

          {toolsError ? (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 text-red-200">
              <p>Error loading tools data: {toolsError}</p>
              <button onClick={refreshStats} className="btn btn-sm btn-outline btn-error mt-2">
                Retry
              </button>
            </div>
          ) : toolsLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
              <div className="text-center p-2 sm:p-4 bg-base-200 rounded-lg">
                <div className="text-xs text-base-content/60 mb-1">Total Tools</div>
                <div className="font-bold text-lg sm:text-2xl text-white">{totalTools}</div>
              </div>
              <div className="text-center p-2 sm:p-4 bg-base-200 rounded-lg">
                <div className="text-xs text-base-content/60 mb-1">Available</div>
                <div className="font-bold text-lg sm:text-2xl text-success">{availableTools}</div>
              </div>
              <div className="text-center p-2 sm:p-4 bg-base-200 rounded-lg">
                <div className="text-xs text-base-content/60 mb-1">Assigned</div>
                <div className="font-bold text-lg sm:text-2xl text-warning">{assignedTools}</div>
              </div>
              <div className="text-center p-2 sm:p-4 bg-base-200 rounded-lg">
                <div className="text-xs text-base-content/60 mb-1">Needs Repair</div>
                <div className="font-bold text-lg sm:text-2xl text-error">{needsRepairTools}</div>
              </div>
              <div className="text-center p-2 sm:p-4 bg-base-200 rounded-lg col-span-2 sm:col-span-1">
                <div className="text-xs text-base-content/60 mb-1">Tool Types</div>
                <div className="font-bold text-lg sm:text-2xl text-info">{uniqueTypes}</div>
              </div>
            </div>
          )}
        </div>

        {/* FNI Management Section */}
        <div className="bg-base-100 p-4 sm:p-6 rounded-lg shadow mb-6 sm:mb-8 border border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3 sm:gap-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-900 text-teal-200 flex items-center justify-center">
                <FlaskConical className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  FNI Management
                  {fniLoading && (
                    <span className="loading loading-spinner loading-sm text-primary"></span>
                  )}
                </h2>
                <p className="text-sm text-gray-400">
                  Fertilizers, Nutrients & Inputs statistics
                  {!fniLoading && (
                    <span className="text-green-400 ml-2">• Updated</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={refreshFNIStats}
                className="btn btn-ghost btn-sm text-gray-400 hover:text-white"
                disabled={fniLoading}
              >
                <RefreshCw className={`w-4 h-4 ${fniLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline ml-1">Refresh</span>
              </button>
              <button
                onClick={exportFNICSV}
                className="btn btn-outline btn-sm gap-2"
                disabled={fniLoading || fniTotalItems === 0}
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">CSV</span>
              </button>
              <button
                onClick={exportFNIPDF}
                className="btn btn-outline btn-sm gap-2"
                disabled={fniLoading || fniTotalItems === 0}
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Export PDF</span>
                <span className="sm:hidden">PDF</span>
              </button>
              <Link to="/fni" className="btn btn-primary btn-sm">
                <span className="hidden sm:inline">Manage FNI</span>
                <span className="sm:hidden">FNI</span>
              </Link>
            </div>
          </div>

          {fniError ? (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 text-red-200">
              <p>Error loading FNI data: {fniError}</p>
              <button onClick={refreshFNIStats} className="btn btn-sm btn-outline btn-error mt-2">
                Retry
              </button>
            </div>
          ) : fniLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-base-200 rounded-lg">
                <div className="text-xs text-base-content/60 mb-1">Total Items</div>
                <div className="font-bold text-2xl text-white">{fniTotalItems}</div>
              </div>
              <div className="text-center p-4 bg-base-200 rounded-lg">
                <div className="text-xs text-base-content/60 mb-1">Low Stock</div>
                <div className="font-bold text-2xl text-warning">{fniLowStockItems}</div>
              </div>
              <div className="text-center p-4 bg-base-200 rounded-lg">
                <div className="text-xs text-base-content/60 mb-1">Fertilizer Items</div>
                <div className="font-bold text-2xl text-success">{fertilizers}</div>
              </div>
              <div className="text-center p-4 bg-base-200 rounded-lg">
                <div className="text-xs text-base-content/60 mb-1">Insecticide Items</div>
                <div className="font-bold text-2xl text-info">{insecticides}</div>
              </div>
              <div className="text-center p-4 bg-base-200 rounded-lg">
                <div className="text-xs text-base-content/60 mb-1">Total Inventory Value</div>
                <div className="font-bold text-2xl text-accent">LKR {totalInventoryValue.toFixed(2)}</div>
              </div>
            </div>
          )}
        </div>

        {/* Low Stock Alerts and Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 sm:mb-8 max-w-4xl mx-auto">
          {/* Low Stock Alerts Card */}
          <div className="bg-base-100 p-4 sm:p-6 rounded-lg shadow border border-gray-700 text-left hover:bg-gray-900 transition">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-900 text-red-200 flex items-center justify-center mb-3 sm:mb-4">
              <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h3 className="font-semibold text-base sm:text-lg mb-2 text-white">Low Stock Alerts</h3>
            <p className="text-sm sm:text-base text-gray-400">Monitor and manage low stock items</p>
            <div className="mt-2 sm:mt-3">
              <span className="text-xl sm:text-2xl font-bold text-red-400">{fniLowStockItems}</span>
              <span className="text-sm sm:text-base text-gray-400 ml-2">items need attention</span>
            </div>
          </div>

          {/* Inventory Reports Card */}
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.link}
              className="bg-base-100 p-4 sm:p-6 rounded-lg shadow border border-gray-700 text-left hover:bg-gray-900 transition block"
            >
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${action.color} flex items-center justify-center mb-3 sm:mb-4`}>
                <action.icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="font-semibold text-base sm:text-lg mb-2 text-white">{action.title}</h3>
              <p className="text-sm sm:text-base text-gray-400">{action.desc}</p>
            </Link>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="bg-base-300 p-4 sm:p-6 rounded-lg shadow mb-4 border border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2 sm:gap-0">
            <h2 className="text-lg sm:text-xl font-bold text-white">Recent Activity</h2>
            <button
              onClick={refreshDashboardStats}
              className="btn btn-ghost btn-sm text-gray-400 hover:text-white"
              disabled={dashboardLoading}
            >
              <RefreshCw className={`w-4 h-4 ${dashboardLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline ml-1">Refresh</span>
            </button>
          </div>
          {dashboardError ? (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 text-red-200">
              <p>Error loading activities: {dashboardError}</p>
            </div>
          ) : dashboardLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : recentActivities.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No recent activities</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start sm:items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-base-100 rounded">
                  <div className="flex-shrink-0 mt-1 sm:mt-0">
                    {activity.icon === 'Package' && <Package className={`w-4 h-4 sm:w-5 sm:h-5 ${activity.color}`} />}
                    {activity.icon === 'AlertTriangle' && <AlertTriangle className={`w-4 h-4 sm:w-5 sm:h-5 ${activity.color}`} />}
                    {activity.icon === 'Wrench' && <Wrench className={`w-4 h-4 sm:w-5 sm:h-5 ${activity.color}`} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm sm:text-base text-white">{activity.title}</p>
                    <p className="text-xs sm:text-sm text-gray-400 break-words">
                      {activity.description} - {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryManagerDashboard;
