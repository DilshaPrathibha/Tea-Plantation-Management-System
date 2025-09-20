import AddIncidencePage from "./pages/AddIncidencePage";
import React from "react";
import { Routes, Route } from "react-router-dom";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RequireAuth from "./components/RequireAuth";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import UsersPage from "./pages/admin/UsersPage";
import FieldsPage from "./pages/admin/FieldsPage";

import SupervisorDashboard from "./pages/SupervisorDashboard";
import IncidencePage from "./pages/IncidencePage";

// Incidence pages
import IncidenceDetailPage from "./pages/IncidenceDetailPage";
import UpdateIncidencePage from "./pages/UpdateIncidencePage";

//Pest and Diseases pages
import PestDiseasePage from "./pages/pestdisease/PestDiseasePage";
import AddPestDiseasePage from "./pages/pestdisease/AddPestDiseasePage";
import PestDiseaseDetailPage from "./pages/pestdisease/PestDiseaseDetailPage";
import UpdatePestDiseasePage from "./pages/pestdisease/UpdatePestDiseasePage";

// Plucking Record pages
import PluckingRecordPage from './pages/PluckingRecordPage';
import AddPluckingRecordPage from './pages/AddPluckingRecordPage';
import ViewPluckingRecordPage from './pages/ViewPluckingRecordPage';
import EditPluckingRecordPage from './pages/EditPluckingRecordPage';


// Simple placeholders (keep or replace later)
const WorkerDashboard = () => <div className="p-8 text-2xl">Worker Dashboard</div>;
const ProductionDashboard = () => <div className="p-8 text-2xl">Production Manager Dashboard</div>;
const InventoryDashboard = () => <div className="p-8 text-2xl">Inventory Manager Dashboard</div>;
const NotFound = () => <div className="p-8 text-2xl">Page not found</div>;

const App = () => {
  return (
    <div data-theme="forest">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Incidence Routes */}
        <Route
          path="/incidence"
          element={
            <RequireAuth role="field_supervisor">
              <IncidencePage />
            </RequireAuth>
          }
        />
        <Route
          path="/incidence/new"
          element={
            <RequireAuth role="field_supervisor">
              <AddIncidencePage />
            </RequireAuth>
          }
        />
        <Route
          path="/incidence/:id"
          element={
            <RequireAuth role="field_supervisor">
              <IncidenceDetailPage />
            </RequireAuth>
          }
        />
        <Route
          path="/incidence/edit/:id"
          element={
            <RequireAuth role="field_supervisor">
              <UpdateIncidencePage />
            </RequireAuth>
          }
        />

      {/* pest Routes */}
        <Route
          path="/pest-diseases"
          element={
            <RequireAuth role="field_supervisor">
              <PestDiseasePage />
            </RequireAuth>
          }
        />
        <Route
          path="/pest-diseases/new"
          element={
            <RequireAuth role="field_supervisor">
              <AddPestDiseasePage />
            </RequireAuth>
          }
        />
        <Route
          path="/pest-diseases/:id"
          element={
            <RequireAuth role="field_supervisor">
              <PestDiseaseDetailPage />
            </RequireAuth>
          }
        />
        <Route
          path="/pest-diseases/edit/:id"
          element={
            <RequireAuth role="field_supervisor">
              <UpdatePestDiseasePage />
            </RequireAuth>
          }
        />
        
        {/* plucking Routes */}
        <Route 
        path="/plucking-records" element={<PluckingRecordPage />} />
        <Route 
        path="/plucking-records/new" element={<AddPluckingRecordPage />} />
        <Route 
        path="/plucking-records/:id" element={<ViewPluckingRecordPage />} />
        <Route 
        path="/plucking-records/edit/:id" element={<EditPluckingRecordPage />} />


        {/* Admin Routes */}
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

        {/* Other Role Routes */}
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
              <SupervisorDashboard />
            </RequireAuth>
          }
        />

        {/* 404 Route - Must be last */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
};

export default App;