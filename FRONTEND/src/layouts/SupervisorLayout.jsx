import React from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

/** Map for breadcrumbs text */
const LABELS = {
  supervisor: "Supervisor",
  attendance: "Attendance",
  scan: "QR Scan",
  new: "New",
  tasks: "Task Assignment",
  incidences: "Incidents",
  "pestdisease": "Pest & Disease",
  "plucking-records": "Plucking Records",
};

function Breadcrumbs() {
  const { pathname } = useLocation();
  const parts = pathname.split("/").filter(Boolean);
  const crumbs = [];
  let acc = "";
  parts.forEach((p) => {
    acc += `/${p}`;
    crumbs.push({ path: acc, label: LABELS[p] || p.replace(/-/g, " ") });
  });

  return (
    <nav className="text-sm text-white/70">
      {crumbs.map((c, i) => (
        <span key={c.path}>
          {i > 0 && <span className="mx-2 text-white/40">/</span>}
          <NavLink to={c.path} className="hover:text-white">{c.label}</NavLink>
        </span>
      ))}
    </nav>
  );
}

const Tab = ({ to, children }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `px-3 py-1.5 rounded-full border transition ${
        isActive
          ? "border-emerald-400/60 bg-emerald-400/10 text-emerald-200"
          : "border-white/10 text-white/80 hover:bg-white/5"
      }`
    }
  >
    {children}
  </NavLink>
);

export default function SupervisorLayout() {
  const navigate = useNavigate();

  return (
    <>
      {/* Sub-navbar under your global Navbar */}
      <div className="sticky top-16 z-20 bg-base-300/80 backdrop-blur border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            {/* Removed "Back to Dashboard" button since Dashboard is already in main navbar */}
            <Breadcrumbs />
          </div>

          {/* Quick tabs to main supervisor functions - removed duplicated items */}
          <div className="flex flex-wrap gap-2">
            <Tab to="/supervisor/attendance/scan">QR Scan</Tab>
            <Tab to="/supervisor/attendance/new">Manual Entry</Tab>
            <Tab to="/supervisor/incidences">Incidents</Tab>
            <Tab to="/supervisor/plucking-records">Plucking</Tab>
          </div>
        </div>
      </div>

      {/* Child pages render here */}
      <Outlet />
    </>
  );
}
