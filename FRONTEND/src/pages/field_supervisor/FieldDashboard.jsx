import React from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardCheck, Users, CloudSun, ListChecks } from "lucide-react";

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

export default function FieldDashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-base-200">
      <div className="mx-auto max-w-6xl p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Field Supervisor Dashboard</h1>
          <p className="text-base-content/70">
            Assign workers, track tasks, and monitor field conditions.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* ⭐ Assign Task card (requested) */}
          <Tile
            icon={<ClipboardCheck className="w-6 h-6" />}
            title="Assign Task"
            desc="Create a new task and assign a worker. Attendance & weather are auto-checked."
            onClick={() => navigate("/field/assign-task")}
          />

          <Tile
            icon={<ListChecks className="w-6 h-6" />}
            title="Today’s Tasks"
            desc="View all tasks you’ve assigned today."
            onClick={() => navigate("/field/tasks")}
          />

          <Tile
            icon={<CloudSun className="w-6 h-6" />}
            title="Weather & Alerts"
            desc="Quick glance of weather in your estates."
            onClick={() => navigate("/field/weather")}
          />
        </div>
      </div>
    </div>
  );
}
