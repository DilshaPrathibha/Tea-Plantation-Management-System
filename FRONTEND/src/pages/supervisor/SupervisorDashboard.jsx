// FRONTEND/src/pages/supervisor/SupervisorDashboard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Sweet, Toast } from '@/utils/sweet';

export default function SupervisorDashboard() {
  return (
    <div className="min-h-screen bg-base-200">
      <div className="mx-auto max-w-5xl p-6">
        <h1 className="text-2xl md:text-3xl font-bold">Field Supervisor Dashboard</h1>

        <div className="mt-6 grid md:grid-cols-3 gap-4">
          <Link to="/supervisor/attendance" className="card bg-base-100 shadow hover:shadow-lg transition">
            <div className="card-body">
              <h2 className="card-title">Attendance</h2>
              <p>Manage daily attendance (QR or manual).</p>
            </div>
          </Link>

          <Link to="/supervisor/attendance/scan" className="card bg-base-100 shadow hover:shadow-lg transition">
            <div className="card-body">
              <h2 className="card-title">QR Scan</h2>
              <p>Scan worker QR codes to mark attendance quickly.</p>
            </div>
          </Link>


          <Link to="/supervisor/attendance/new" className="card bg-base-100 shadow hover:shadow-lg transition">
            <div className="card-body">
              <h2 className="card-title">Manual Entry</h2>
              <p>Create a record with the 7-field form.</p>
            </div>
          </Link>
          <Link to="/supervisor/tasks" className="card bg-base-100 shadow hover:shadow-lg transition">
  <div className="card-body">
    <h2 className="card-title">Task Assignment</h2>
    <p>Assign today’s tasks to attended workers, with due time and priorities.</p>
  </div>
</Link>
          
        </div>
      </div>
    </div>
  );
}
