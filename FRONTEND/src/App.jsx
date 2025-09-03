import React from "react";
import { Routes, Route } from "react-router-dom";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RequireAuth from "./components/RequireAuth";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import UsersPage from "./pages/admin/UsersPage";
import FieldsPage from "./pages/admin/FieldsPage";

// Field-Supervisor pages
import FieldDashboard from "./pages/field_supervisor/FieldDashboard";
import AssignTask from "./pages/field_supervisor/AssignTask";
import WeatherAlerts from "./pages/field_supervisor/WeatherAlerts";
import AssignedTasks from "./pages/field_supervisor/AssignedTasks";

// Simple placeholders (keep or replace later)
const WorkerDashboard = () => <div className="p-8 text-2xl">Worker Dashboard</div>;
const ProductionDashboard = () => <div className="p-8 text-2xl">Production Manager Dashboard</div>;
const InventoryDashboard = () => <div className="p-8 text-2xl">Inventory Manager Dashboard</div>;
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
        {/* Field Supervisor */}
        <Route
          path="/field-dashboard"
          element={
            <RequireAuth role="field_supervisor">
              <FieldDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/field/assign-task"
          element={
            <RequireAuth role="field_supervisor">
              <AssignTask />
            </RequireAuth>
          }
        />
        <Route
          path="/field/weather"
          element={
            <RequireAuth roles="field_supervisor">
              <WeatherAlerts />
            </RequireAuth>
          }
        />

        <Route
          path="/field/tasks"
          element={
            <RequireAuth role="field_supervisor">
              <AssignedTasks />
            </RequireAuth>
          }
        />


        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
};

export default App;
