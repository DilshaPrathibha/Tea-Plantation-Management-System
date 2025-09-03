import React from "react";
import { Routes, Route } from "react-router-dom";


import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RequireAuth from "./components/RequireAuth";

// Admin pages
import AdminDashboard from "./pages/AdminDashboard";
import UsersPage from "./pages/admin/UsersPage";
import FieldsPage from "./pages/admin/FieldsPage";

// New pages
import ToolsPage from "./pages/ToolsPage";
import ToolDetailPage from "./pages/ToolDetailPage";
import FNIPage from "./pages/FNIPage";
import CreateToolPage from "./pages/CreateToolPage";
import CreatePage from "./pages/CreatePage";
import NoteDetailPage from "./pages/NoteDetailPage";
import FNIDetailPage from "./pages/FNIDetailPage";


import ProductionBatchPage from './pages/ProductionBatchPage';
import TransportPage from './pages/TransportPage';

import CreateProductionBatch from './pages/CreateProductionBatch';
import CreateTransport from './pages/CreateTransport';

import EditProductionBatch from './pages/EditProductionBatch';
import EditTransport from './pages/EditTransport';

import ProductionDashboard from './pages/ProductionDashboard';
import ProfilePage from './pages/ProfilePage';


const WorkerDashboard = () => <div className="p-8 text-2xl">Worker Dashboard</div>;
//const ProductionDashboard = () => <div className="p-8 text-2xl">Production Manager Dashboard</div>;
const InventoryDashboard = () => <div className="p-8 text-2xl">Inventory Manager Dashboard</div>;
const FieldDashboard = () => <div className="p-8 text-2xl">Field Supervisor Dashboard</div>;
const NotFound = () => <div className="p-8 text-2xl">Page not found</div>;

const App = () => {
  return (
    <div data-theme="forest">
      <Routes>
        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Admin only */}
        <Route
          path="/admin-dashboard"
          element={
            <RequireAuth role="admin">
              <AdminDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/users"
          element={
            <RequireAuth role="admin">
              <UsersPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/fields"
          element={
            <RequireAuth role="admin">
              <FieldsPage />
            </RequireAuth>
          }
        />

        {/* Other roles */}
        <Route
          path="/worker-dashboard"
          element={
            <RequireAuth role="worker">
              <WorkerDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/production-dashboard"
          element={
            <RequireAuth role="production_manager">
              <ProductionDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/inventory-dashboard"
          element={
            <RequireAuth role="inventory_manager">
              <InventoryDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/field-dashboard"
          element={
            <RequireAuth role="field_supervisor">
              <FieldDashboard />
            </RequireAuth>
          }
        />

       
        <Route path="/production-batches" element={
          <RequireAuth role="production_manager">
            <ProductionBatchPage />
          </RequireAuth>
        } />
        <Route path="/transports" element={
         <RequireAuth role="production_manager">
            <TransportPage />
          </RequireAuth>
        } />

          
        <Route path="/create-production-batch" element={<CreateProductionBatch />} />
        <Route path="/create-transport" element={<CreateTransport />} />

       
        <Route path="/edit-production-batch/:id" element={<EditProductionBatch />} />
        <Route path="/edit-transport/:id" element={<EditTransport />} />

    
        <Route path="/profile" element={<ProfilePage />} />
    
        

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
    {/* New pages */}
    <Route path="/tools" element={<ToolsPage />} />
    <Route path="/tool/:id" element={<ToolDetailPage />} />
    <Route path="/tools/create" element={<CreateToolPage />} />
    <Route path="/FNI" element={<FNIPage />} />
    <Route path="/FNI/create" element={<CreatePage />} />
    <Route path="/note/:id" element={<NoteDetailPage />} />
    <Route path="/FNI/:id" element={<FNIDetailPage />} />
    </Routes>
    </div>
    
  );

  
};

export default App;
