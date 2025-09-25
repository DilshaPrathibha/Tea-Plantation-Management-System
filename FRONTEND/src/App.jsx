// FRONTEND/src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import RootLayout from './layouts/RootLayout.jsx';
import SupervisorLayout from './layouts/SupervisorLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import InventoryLayout from './layouts/InventoryLayout.jsx';

import RequireAuth from './components/RequireAuth.jsx';

// Public
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';

// Notes (practice)
import CreatePage from './pages/CreatePage.jsx';
import NoteDetailPage from './pages/NoteDetailPage.jsx';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminUsers from './components/AdminUsers.jsx';
import FieldsPage from './pages/admin/FieldsPage.jsx';
import AdminNotifications from './pages/admin/AdminNotifications.jsx';

// Supervisor
import SupervisorDashboard from './pages/supervisor/SupervisorDashboard.jsx';
import AttendanceList from './pages/supervisor/attendance/AttendanceList.jsx';
import AttendanceForm from './pages/supervisor/attendance/AttendanceForm.jsx';
import AttendanceScan from './pages/supervisor/attendance/AttendanceScan.jsx';
import TaskAssign from './pages/supervisor/TaskAssign.jsx';

// Incidents
import IncidencePage from './pages/IncidencePage.jsx';
import AddIncidencePage from './pages/AddIncidencePage.jsx';
import IncidenceDetailPage from './pages/IncidenceDetailPage.jsx';
import UpdateIncidencePage from './pages/UpdateIncidencePage.jsx';

// Pest & Disease
import PestDiseasePage from './pages/pestdisease/PestDiseasePage.jsx';
import AddPestDiseasePage from './pages/pestdisease/AddPestDiseasePage.jsx';
import PestDiseaseDetailPage from './pages/pestdisease/PestDiseaseDetailPage.jsx';
import UpdatePestDiseasePage from './pages/pestdisease/UpdatePestDiseasePage.jsx';

// Plucking Record
import PluckingRecordPage from './pages/PluckingRecordPage.jsx';
import AddPluckingRecordPage from './pages/AddPluckingRecordPage.jsx';
import ViewPluckingRecordPage from './pages/ViewPluckingRecordPage.jsx';
import EditPluckingRecordPage from './pages/EditPluckingRecordPage.jsx';

// Other roles / features
import WorkerDashboard from './pages/worker/WorkerDashboard.jsx';
import ProductionDashboard from './pages/ProductionDashboard.jsx';
import ProductionBatchPage from './pages/ProductionBatchPage.jsx';
import CreateProductionBatch from './pages/CreateProductionBatch.jsx';
import EditProductionBatch from './pages/EditProductionBatch.jsx';
import TransportPage from './pages/TransportPage.jsx';
import CreateTransport from './pages/CreateTransport.jsx';
import EditTransport from './pages/EditTransport.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import VehicleTracking from './pages/VehicleTracking.jsx';
import InventoryManagerDashboard from './pages/inventory/InventoryManagerDashboard.jsx';
import InventoryReports from './pages/inventory/InventoryReports.jsx';
import InventoryStock from './pages/inventory/InventoryStock.jsx';
import InventorySupplies from './pages/inventory/InventorySupplies.jsx';
import ToolsPage from './pages/ToolsPage.jsx';
import CreateToolPage from './pages/CreateToolPage.jsx';
import ToolDetailPage from './pages/ToolDetailPage.jsx';
import FNIPage from './pages/FNIPage.jsx';
import FNICreate from './pages/FNICreate.jsx';
import FNIEditPage from './pages/FNIEditPage.jsx';
import PrivacyPage from './pages/PrivacyPage.jsx';
import TermsPage from './pages/TermsPage.jsx';
import SupportPage from './pages/SupportPage.jsx';

export default function App() {
  return (
    <Routes>
      {/* No-navbar route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Routes with global Navbar via RootLayout */}
      <Route element={<RootLayout />}>
        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/support" element={<SupportPage />} />

        {/* ADMIN AREA with sub-navbar & breadcrumbs */}
        <Route
          path="/admin"
          element={
            <RequireAuth role="admin">
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="fields" element={<FieldsPage />} />
          <Route path="notifications" element={<AdminNotifications />} />
        </Route>

        {/* Notes (practice) */}
        <Route
          path="/notes/create"
          element={
            <RequireAuth>
              <CreatePage />
            </RequireAuth>
          }
        />
        <Route
          path="/notes/:id"
          element={
            <RequireAuth>
              <NoteDetailPage />
            </RequireAuth>
          }
        />

        {/* SUPERVISOR AREA with sub-navbar & breadcrumbs */}
        <Route
          path="/supervisor"
          element={
            <RequireAuth role="field_supervisor">
              <SupervisorLayout />
            </RequireAuth>
          }
        >
          <Route index element={<SupervisorDashboard />} />

          {/* Attendance */}
          <Route path="attendance" element={<AttendanceList />} />
          <Route path="attendance/new" element={<AttendanceForm />} />
          <Route path="attendance/:id" element={<AttendanceForm />} />
          <Route path="attendance/:id/edit" element={<AttendanceForm />} />
          <Route path="attendance/scan" element={<AttendanceScan />} />

          {/* Tasks */}
          <Route path="tasks" element={<TaskAssign />} />

          {/* Incidents (scoped) */}
          <Route path="incidences" element={<IncidencePage />} />
          <Route path="incidences/add" element={<AddIncidencePage />} />
          <Route path="incidences/:id" element={<IncidenceDetailPage />} />
          <Route path="incidences/:id/edit" element={<UpdateIncidencePage />} />

          {/* Pest & Disease (scoped) */}
          <Route path="pestdisease" element={<PestDiseasePage />} />
          <Route path="pestdisease/add" element={<AddPestDiseasePage />} />
          <Route path="pestdisease/:id" element={<PestDiseaseDetailPage />} />
          <Route path="pestdisease/:id/edit" element={<UpdatePestDiseasePage />} />

          {/* Plucking Records (scoped) */}
          <Route path="plucking-records" element={<PluckingRecordPage />} />
          <Route path="plucking-records/add" element={<AddPluckingRecordPage />} />
          <Route path="plucking-records/:id" element={<ViewPluckingRecordPage />} />
          <Route path="plucking-records/:id/edit" element={<EditPluckingRecordPage />} />
        </Route>

        {/* Legacy routes (still valid) */}
        <Route path="/incidences" element={<RequireAuth><IncidencePage /></RequireAuth>} />
        <Route path="/incidences/add" element={<RequireAuth><AddIncidencePage /></RequireAuth>} />
        <Route path="/incidences/:id" element={<RequireAuth><IncidenceDetailPage /></RequireAuth>} />
        <Route path="/incidences/:id/edit" element={<RequireAuth><UpdateIncidencePage /></RequireAuth>} />

        <Route path="/pestdisease" element={<RequireAuth><PestDiseasePage /></RequireAuth>} />
        <Route path="/pestdisease/add" element={<RequireAuth><AddPestDiseasePage /></RequireAuth>} />
        <Route path="/pestdisease/:id" element={<RequireAuth><PestDiseaseDetailPage /></RequireAuth>} />
        <Route path="/pestdisease/:id/edit" element={<RequireAuth><UpdatePestDiseasePage /></RequireAuth>} />

        <Route path="/plucking-records" element={<RequireAuth><PluckingRecordPage /></RequireAuth>} />
        <Route path="/plucking-records/add" element={<RequireAuth><AddPluckingRecordPage /></RequireAuth>} />
        <Route path="/plucking-records/:id" element={<RequireAuth><ViewPluckingRecordPage /></RequireAuth>} />
        <Route path="/plucking-records/:id/edit" element={<RequireAuth><EditPluckingRecordPage /></RequireAuth>} />

        {/* Worker */}
        <Route
          path="/worker"
          element={
            <RequireAuth role="worker">
              <WorkerDashboard />
            </RequireAuth>
          }
        />

        {/* Production Manager */}
        <Route
          path="/production-dashboard"
          element={
            <RequireAuth role="production_manager">
              <ProductionDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/production-batches"
          element={
            <RequireAuth role="production_manager">
              <ProductionBatchPage />
            </RequireAuth>
          }
        />
        <Route
          path="/create-production-batch"
          element={
            <RequireAuth role="production_manager">
              <CreateProductionBatch />
            </RequireAuth>
          }
        />
        <Route
          path="/edit-production-batch/:id"
          element={
            <RequireAuth role="production_manager">
              <EditProductionBatch />
            </RequireAuth>
          }
        />
        <Route
          path="/transports"
          element={
            <RequireAuth role="production_manager">
              <TransportPage />
            </RequireAuth>
          }
        />
        <Route
          path="/create-transport"
          element={
            <RequireAuth role="production_manager">
              <CreateTransport />
            </RequireAuth>
          }
        />
        <Route
          path="/edit-transport/:id"
          element={
            <RequireAuth role="production_manager">
              <EditTransport />
            </RequireAuth>
          }
        />
        <Route
          path="/reports"
          element={
            <RequireAuth role="production_manager">
              <ReportsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth role="production_manager">
              <ProfilePage />
            </RequireAuth>
          }
        />
        <Route
          path="/vehicle-tracking"
          element={
            <RequireAuth role="production_manager">
              <VehicleTracking />
            </RequireAuth>
          }
        />

        {/* INVENTORY MANAGER AREA with sub-navbar & breadcrumbs */}
        <Route
          path="/inventory"
          element={
            <RequireAuth role="inventory_manager">
              <InventoryLayout />
            </RequireAuth>
          }
        >
          <Route index element={<InventoryManagerDashboard />} />
          <Route path="stock" element={<InventoryStock />} />
          <Route path="supplies" element={<InventorySupplies />} />
          <Route path="reports" element={<InventoryReports />} />
          
          {/* Tools */}
          <Route path="tools" element={<ToolsPage />} />
          <Route path="tools/create" element={<CreateToolPage />} />
          <Route path="tools/:id" element={<ToolDetailPage />} />
          
          {/* FNI */}
          <Route path="fni" element={<FNIPage />} />
          <Route path="fni/create" element={<FNICreate />} />
          <Route path="fni/:id/edit" element={<FNIEditPage />} />
        </Route>

        {/* Fallback inside layout */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>

      {/* Extra safety net */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
