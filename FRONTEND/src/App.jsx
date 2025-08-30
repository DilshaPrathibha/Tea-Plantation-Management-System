import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import CreatePage from './pages/CreatePage.jsx';
import NoteDetailPage from './pages/NoteDetailPage.jsx';

import RequireAuth from './components/RequireAuth.jsx';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard.jsx';   // tiles landing
import AdminUsers from './components/AdminUsers.jsx';            // users CRUD
import FieldsPage from './pages/admin/FieldsPage.jsx';           // fields page

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

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
