// FRONTEND/src/pages/supervisor/SupervisorDashboard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Leaf,
  BarChart3,
  Package,
  Factory,
  ClipboardList,
  Bug
} from 'lucide-react';
import { Sweet } from '@/utils/sweet';

const Tile = ({ icon, title, desc, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="group rounded-2xl bg-base-100 p-5 border border-base-200 shadow hover:shadow-lg transition-all text-left"
  >
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
        {icon}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
    </div>
    <p className="mt-2 text-base-content/70">{desc}</p>
    <div className="mt-4 text-sm text-primary opacity-0 group-hover:opacity-100 transition">
      Open →
    </div>
  </button>
);

export default function SupervisorDashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-base-200">
      <div className="mx-auto max-w-6xl p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Field Supervisor Dashboard</h1>
          <p className="text-base-content/70">
            Choose a module to manage. This is your hub.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Tile
            icon={<ClipboardList className="w-6 h-6" />}
            title="Attendance"
            desc="Manage daily attendance (QR/manual)."
            onClick={() => navigate('/supervisor/attendance')}
          />
          <Tile
            icon={<ClipboardList className="w-6 h-6" />}
            title="QR Scan"
            desc="Scan worker QR codes to mark attendance."
            onClick={() => navigate('/supervisor/attendance/scan')}
          />
          <Tile
            icon={<ClipboardList className="w-6 h-6" />}
            title="Manual Entry"
            desc="Create a record with the 7-field form."
            onClick={() => navigate('/supervisor/attendance/new')}
          />
          <Tile
            icon={<Users className="w-6 h-6" />}
            title="Task Assignment"
            desc="Assign today’s tasks to attended workers."
            onClick={() => navigate('/supervisor/tasks')}
          />
          <Tile
            icon={<BarChart3 className="w-6 h-6" />}
            title="Incident Management"
            desc="View, report, and manage field incidents."
            onClick={() => navigate('/supervisor/incidences')}
          />
          <Tile
            icon={<Bug className="w-6 h-6" />}
            title="Pest & Disease Report"
            desc="Report and view pest/disease issues in the field."
            onClick={() => navigate('/supervisor/pestdisease')}
          />
          <Tile
            icon={<Leaf className="w-6 h-6" />}
            title="Daily Plucking Record"
            desc="View and add daily plucking records for workers."
            onClick={() => navigate('/supervisor/plucking-records')}
          />
        </div>
      </div>
    </div>
  );
}
