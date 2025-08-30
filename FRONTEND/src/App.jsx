import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';


import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import CreatePage from './pages/CreatePage.jsx';
import NoteDetailPage from './pages/NoteDetailPage.jsx';

/*
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RequireAuth from "./components/RequireAuth";*/


import RequireAuth from './components/RequireAuth.jsx';


// Admin
import AdminDashboard from './pages/admin/AdminDashboard.jsx';   // tiles landing
import AdminUsers from './components/AdminUsers.jsx';            // users CRUD
import FieldsPage from './pages/admin/FieldsPage.jsx';           // fields page
/*
// New pages
import ToolsPage from "./pages/ToolsPage";
import ToolDetailPage from "./pages/ToolDetailPage";
import FNIPage from "./pages/FNIPage";
import CreateToolPage from "./pages/CreateToolPage";
import CreatePage from "./pages/CreatePage";
import NoteDetailPage from "./pages/NoteDetailPage";
import FNIDetailPage from "./pages/FNIDetailPage";

// Simple placeholders (keep or replace later)
const WorkerDashboard = () => <div className="p-8 text-2xl">Worker Dashboard</div>;
const ProductionDashboard = () => <div className="p-8 text-2xl">Production Manager Dashboard</div>;
const InventoryDashboard = () => <div className="p-8 text-2xl">Inventory Manager Dashboard</div>;
const FieldDashboard = () => <div className="p-8 text-2xl">Field Supervisor Dashboard</div>;
const NotFound = () => <div className="p-8 text-2xl">Page not found</div>;*/


// Supervisor
import SupervisorDashboard from './pages/supervisor/SupervisorDashboard.jsx';
import AttendanceList from './pages/supervisor/attendance/AttendanceList.jsx';
import AttendanceForm from './pages/supervisor/attendance/AttendanceForm.jsx';
import AttendanceScan from './pages/supervisor/attendance/AttendanceScan.jsx';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Admin */}
      <Route
        path="/admin"
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
            <AdminUsers />
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

      {/* Notes */}
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


      {/* Field Supervisor only */}
      <Route
        path="/supervisor"
        element={
          <RequireAuth role="field_supervisor">
            <SupervisorDashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/supervisor/attendance"
        element={
          <RequireAuth role="field_supervisor">
            <AttendanceList />
          </RequireAuth>
        }
      />
      <Route
        path="/supervisor/attendance/new"
        element={
          <RequireAuth role="field_supervisor">
            <AttendanceForm />
          </RequireAuth>
        }
      />
      <Route
        path="/supervisor/attendance/:id/edit"
        element={
          <RequireAuth role="field_supervisor">
            <AttendanceForm />
          </RequireAuth>
        }
      />
      <Route
        path="/supervisor/attendance/scan"
        element={
          <RequireAuth role="field_supervisor">
            <AttendanceScan />
          </RequireAuth>
        }
      />

        /*
        <Route path="*" element={<NotFound />} />
   
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
};*/


      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
