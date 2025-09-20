// FRONTEND/src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RequireAuth from "./components/RequireAuth";

// Admin pages
import AdminDashboard from "./pages/AdminDashboard";
import UsersPage from "./pages/admin/UsersPage";
import FieldsPage from "./pages/admin/FieldsPage";

// FNI pages
import FNIPage from "./pages/FNIPage";
import ToolsPage from "./pages/ToolsPage.jsx";
import CreateToolPage from "./pages/CreateToolPage.jsx";
import ToolDetailPage from "./pages/ToolDetailPage.jsx";
import FNIEditPage from "./pages/FNIEditPage.jsx";
import FNICreate from "./pages/FNICreate.jsx";
import VehicleMapPage from "./pages/VehicleMapPage.jsx";
import InventoryManagerDashboard from "./pages/InventoryManagerDashboard.jsx";

// Simple placeholders (keep or replace later)
const WorkerDashboard = () => <div className="p-8 text-2xl">Worker Dashboard</div>;
const ProductionDashboard = () => <div className="p-8 text-2xl">Production Manager Dashboard</div>;
// Removed placeholder InventoryDashboard; now using InventoryManagerDashboard.jsx
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
        <Route
          path="/admin/fni"
          element={
            <RequireAuth role="admin">
              <FNIPage />
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
              <InventoryManagerDashboard />
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


    {/* FNI routes */}
    <Route path="/fni" element={<FNIPage />} />
    <Route path="/tools" element={<ToolsPage />} />
    <Route path="/tools/create" element={<CreateToolPage />} />
    <Route path="/tools/:id" element={<ToolDetailPage />} />
    <Route path="/FNI" element={<Navigate to="/fni" replace />} />
    <Route path="/fni/create" element={<FNICreate />} />
    <Route path="/fni/:id/edit" element={<FNIEditPage />} />
    <Route path="/vehicle-map" element={<VehicleMapPage />} />

        {/* 404 (keep last) */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
};

export default App;
