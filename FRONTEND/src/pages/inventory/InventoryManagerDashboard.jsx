import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
// Removed: InventoryManagerNavbar and global Navbar (provided by RootLayout)
import { Truck, BarChart2, AlertTriangle, Clock, TrendingUp, Wrench, FlaskConical, Download, Printer, RefreshCw, Ticket, Users, Bug } from 'lucide-react';
import useToolsStats from '../../hooks/useToolsStats';
import useFNIStats from '../../hooks/useFNIStats';
import useDashboardStats from '../../hooks/useDashboardStats';
import { useTheme } from '../../context/ThemeContext';
import useSupplierStats from '../../hooks/useSupplierStats';

const InventoryManagerDashboard = () => {
  const { theme } = useTheme();
  const isLightTheme = theme === 'tea-light';
  
  // Staggered loading state to prevent all API calls at once
  const [loadingStage, setLoadingStage] = React.useState(0);
  
  const {
    totalTools,
    availableTools,
    assignedTools,
    needsRepairTools,
    retiredTools,
    isLoading: toolsLoading,
    error: toolsError,
    refreshStats,
    exportCSV,
    exportPDF
  } = useToolsStats(true); // Always load tools (they load first)

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
  } = useFNIStats(loadingStage >= 1); // Only load FNI after stage 1

  const {
    recentActivities,
    isLoading: dashboardLoading,
    error: dashboardError,
    refreshStats: refreshDashboardStats
  } = useDashboardStats();

  const {
    totalSuppliers,
    activeSuppliers,
    pendingSuppliers,
    suspendedSuppliers,
    uniqueTypes: supplierTypes,
    isLoading: suppliersLoading,
    error: suppliersError,
    refreshStats: refreshSupplierStats
  } = useSupplierStats(loadingStage >= 2); // Only load suppliers after stage 2
  
  // Implement staggered loading on mount
  React.useEffect(() => {
    // Stage 0: Tools load immediately (default)
    // Stage 1: FNI loads after 500ms
    const timer1 = setTimeout(() => setLoadingStage(1), 500);
    // Stage 2: Suppliers load after 1000ms
    const timer2 = setTimeout(() => setLoadingStage(2), 1000);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const quickActions = useMemo(() => [
    {
      title: 'Inventory Reports',
      desc: 'Generate and view inventory reports',
      icon: BarChart2,
      link: '/inventory/reports',
      color: isLightTheme ? 'bg-purple-100 text-purple-700' : 'bg-purple-900 text-purple-200'
    },
    {
      title: 'Pest & Disease Reports',
      desc: 'Monitor field pest and disease reports',
      icon: Bug,
      link: '/inventory/pest-disease',
      color: isLightTheme ? 'bg-red-100 text-red-700' : 'bg-red-900 text-red-200'
    },
    {
      title: 'Support Tickets',
      desc: 'Submit or monitor support tickets',
      icon: Ticket,
      link: '/inventory/tickets',
      color: isLightTheme ? 'bg-amber-100 text-amber-700' : 'bg-amber-900 text-amber-200'
    }
  ], [isLightTheme]);

  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-6xl mx-auto p-2 sm:p-4">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-base-content">Inventory Manager Dashboard</h1>
          <p className="text-sm sm:text-base text-base-content/70">Welcome back! Here's your inventory overview.</p>
        </div>

        {/* Tools Management Section */}
        <div className={`p-4 sm:p-6 rounded-lg shadow mb-6 sm:mb-8 ${isLightTheme ? 'bg-white border border-slate-200' : 'bg-base-100 border border-base-content/10'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3 sm:gap-0">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isLightTheme ? 'bg-orange-100 text-orange-600' : 'bg-orange-900 text-orange-200'}`}>
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-base-content flex items-center gap-2">
                  Tools Management
                  {toolsLoading && (
                    <span className="loading loading-spinner loading-sm text-primary"></span>
                  )}
                </h2>
                <p className="text-sm text-base-content/70">
                  Live tools statistics and quick actions
                  {!toolsLoading && (
                    <span className={`${isLightTheme ? 'text-emerald-600' : 'text-emerald-300'} ml-2`}>Updated</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={refreshStats}
                className="btn btn-ghost btn-sm text-base-content/70 hover:text-primary"
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
              <Link to="/inventory/tools" className="btn btn-primary btn-sm">
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
                  <div className={`font-bold text-lg sm:text-2xl ${isLightTheme ? 'text-base-content' : 'text-base-content'}`}>{totalTools}</div>
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
                <div className="text-xs text-base-content/60 mb-1">Retired Tools</div>
                <div className="font-bold text-lg sm:text-2xl text-neutral">{retiredTools}</div>
              </div>
            </div>
          )}
        </div>

        {/* FNI Management Section */}
        <div className={`p-4 sm:p-6 rounded-lg shadow mb-6 sm:mb-8 ${isLightTheme ? 'bg-white border border-slate-200' : 'bg-base-100 border border-base-content/10'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3 sm:gap-0">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isLightTheme ? 'bg-teal-100 text-teal-600' : 'bg-teal-900 text-teal-200'}`}>
                <FlaskConical className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-base-content flex items-center gap-2">
                  FNI Management
                  {fniLoading && (
                    <span className="loading loading-spinner loading-sm text-primary"></span>
                  )}
                </h2>
                <p className="text-sm text-base-content/70">
                  Fertilizers & Insecticides statistics
                  {!fniLoading && (
                    <span className={`${isLightTheme ? 'text-emerald-600' : 'text-green-300'} ml-2`}>Updated</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={refreshFNIStats}
                className="btn btn-ghost btn-sm text-base-content/70 hover:text-primary"
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
              <Link to="/inventory/fni" className="btn btn-primary btn-sm">
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
                <div className="font-bold text-2xl text-base-content">{fniTotalItems}</div>
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

        {/* Suppliers Management Section */}
        <div className={`p-4 sm:p-6 rounded-lg shadow mb-6 sm:mb-8 ${isLightTheme ? 'bg-white border border-slate-200' : 'bg-base-100 border border-base-content/10'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3 sm:gap-0">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isLightTheme ? 'bg-indigo-100 text-indigo-600' : 'bg-indigo-900 text-indigo-200'}`}>
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-base-content flex items-center gap-2">
                  Suppliers Management
                  {suppliersLoading && (
                    <span className="loading loading-spinner loading-sm text-primary" />
                  )}
                </h2>
                <p className="text-sm text-base-content/70">
                  Manage supplier relationships and contacts
                  {!suppliersLoading && !suppliersError && (
                    <span className={`${isLightTheme ? 'text-emerald-600' : 'text-emerald-300'} ml-2`}>Updated</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={refreshSupplierStats}
                className="btn btn-ghost btn-sm text-base-content/70 hover:text-primary"
                disabled={suppliersLoading}
              >
                <RefreshCw className={`w-4 h-4 ${suppliersLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline ml-1">Refresh</span>
              </button>
              <Link to="/inventory/suppliers" className="btn btn-primary btn-sm">
                <span className="hidden sm:inline">Manage Suppliers</span>
                <span className="sm:hidden">Suppliers</span>
              </Link>
            </div>
          </div>

          {suppliersError ? (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 text-red-200">
              <p>Error loading suppliers data: {suppliersError}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-base-200 rounded-lg">
                  <div className="text-xs text-base-content/60 mb-1">Total Suppliers</div>
                  <div className="font-bold text-2xl text-base-content">
                    {suppliersLoading ? '...' : (totalSuppliers ?? 0)}
                  </div>
                </div>
                <div className="text-center p-4 bg-base-200 rounded-lg">
                  <div className="text-xs text-base-content/60 mb-1">Active</div>
                  <div className="font-bold text-2xl text-success">
                    {suppliersLoading ? '...' : (activeSuppliers ?? 0)}
                  </div>
                </div>
                <div className="text-center p-4 bg-base-200 rounded-lg">
                  <div className="text-xs text-base-content/60 mb-1">Pending</div>
                  <div className="font-bold text-2xl text-warning">
                    {suppliersLoading ? '...' : (pendingSuppliers ?? 0)}
                  </div>
                </div>
                <div className="text-center p-4 bg-base-200 rounded-lg">
                  <div className="text-xs text-base-content/60 mb-1">Suspended</div>
                  <div className="font-bold text-2xl text-error">
                    {suppliersLoading ? '...' : (suspendedSuppliers ?? 0)}
                  </div>
                </div>
              </div>
              {!suppliersLoading && (
                <p className="text-xs text-base-content/60 mt-3 text-center sm:text-left">
                  Unique supplier types: {supplierTypes}
                </p>
              )}
            </>
          )}
        </div>

        {/* Low Stock Alerts and Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 sm:mb-8 max-w-4xl mx-auto">
          {/* Low Stock Alerts Card */}
          <div className={`p-4 sm:p-6 rounded-lg shadow text-left transition ${isLightTheme ? 'bg-white border border-slate-200 hover:bg-rose-50' : 'bg-base-100 border border-base-content/10 hover:bg-base-content/5'}`}>
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-3 sm:mb-4 ${isLightTheme ? 'bg-rose-100 text-rose-600' : 'bg-red-900 text-red-200'}`}>
              <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h3 className="font-semibold text-base sm:text-lg mb-2 text-base-content">Low Stock Alerts</h3>
            <p className="text-sm sm:text-base text-base-content/70">Monitor and manage low stock items</p>
            <div className="mt-2 sm:mt-3">
              <span className={`text-xl sm:text-2xl font-bold ${isLightTheme ? 'text-rose-600' : 'text-red-400'}`}>{fniLowStockItems}</span>
              <span className="text-sm sm:text-base text-base-content/70 ml-2">items need attention</span>
            </div>
          </div>

          {/* Inventory Reports Card */}
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.link}
                className={`p-4 sm:p-6 rounded-lg shadow text-left transition block ${isLightTheme ? 'bg-white border border-slate-200 hover:bg-emerald-50' : 'bg-base-100 border border-base-content/10 hover:bg-base-content/5'}`}
              >
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${action.color} flex items-center justify-center mb-3 sm:mb-4`}>
                <action.icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="font-semibold text-base sm:text-lg mb-2 text-base-content">{action.title}</h3>
              <p className="text-sm sm:text-base text-base-content/70">{action.desc}</p>
            </Link>
          ))}
        </div>

        {/* Recent Activity */}
        <div className={`p-4 sm:p-6 rounded-lg shadow mb-4 ${isLightTheme ? 'bg-emerald-50 border border-slate-200' : 'bg-base-300 border border-base-content/10'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2 sm:gap-0">
            <h2 className="text-lg sm:text-xl font-bold text-base-content">Recent Activity</h2>
            <button
              onClick={refreshDashboardStats}
              className="btn btn-ghost btn-sm text-base-content/70 hover:text-primary"
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
            <div className="text-center py-8 text-base-content/70">
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
                    <p className="font-medium text-sm sm:text-base text-base-content">{activity.title}</p>
                    <p className="text-xs sm:text-sm text-base-content/70 break-words">
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







