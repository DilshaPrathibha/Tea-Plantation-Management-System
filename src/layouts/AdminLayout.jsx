import React from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

const LABELS = { admin:"Admin", users:"Users", fields:"Fields", notifications:"Notifications" };
const human = s => LABELS[s] || decodeURIComponent(s).replace(/-/g, " ");

function Breadcrumbs() {
  const { pathname } = useLocation();
  const parts = pathname.split("/").filter(Boolean);
  let acc = "";
  return (
    <nav className="text-sm text-white/70 whitespace-nowrap overflow-x-auto no-scrollbar">
      {parts.map((p,i) => {
        acc += `/${p}`;
        const isId = /^[a-f0-9]{8,}$/i.test(p);
        const label = human(isId ? "Detail" : p);
        return (
          <span key={acc}>
            {i>0 && <span className="mx-2 text-white/40">/</span>}
            <NavLink to={acc} className="hover:text-white">{label}</NavLink>
          </span>
        );
      })}
    </nav>
  );
}

const Tab = ({ to, children }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `px-3 py-1.5 rounded-full border transition ${
        isActive ? "border-emerald-400/60 bg-emerald-400/10 text-emerald-200"
                 : "border-white/10 text-white/80 hover:bg-white/5"}`
    }
  >
    {children}
  </NavLink>
);

export default function AdminLayout() {
  const navigate = useNavigate();
  return (
    <>
      {/* sub-navbar under global navbar */}
      <div className="sticky top-16 z-20 bg-base-300/80 backdrop-blur border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {/* Removed "Back to Dashboard" button since Dashboard is already in main navbar */}
            <Breadcrumbs />
          </div>
          <div className="flex flex-wrap gap-2 overflow-x-auto no-scrollbar">
            {/* Removed duplicated items: Notifications, Users, Fields are already in main navbar */}
          </div>
        </div>
      </div>
      <Outlet/>
    </>
  );
}
