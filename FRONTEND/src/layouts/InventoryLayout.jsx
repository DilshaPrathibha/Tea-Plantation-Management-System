import React from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

const LABELS = { 
  inventory: "Inventory", 
  stock: "Stock Management",
  supplies: "Supply Management",
  analytics: "Analytics",
  reports: "Reports", 
  tools: "Tools", 
  fni: "FNI",
  create: "Create",
  edit: "Edit"
};
const human = s => LABELS[s] || decodeURIComponent(s).replace(/-/g, " ");

function Breadcrumbs() {
  const { pathname } = useLocation();
  const parts = pathname.split("/").filter(Boolean);
  
  // Filter out ID parts that are followed by 'edit'
  const filteredParts = [];
  const originalIndexMap = [];
  
  for (let i = 0; i < parts.length; i++) {
    const isId = /^[a-f0-9]{8,}$/i.test(parts[i]);
    // Skip ID if next part is 'edit'
    if (isId && parts[i + 1] === "edit") {
      continue;
    }
    filteredParts.push(parts[i]);
    originalIndexMap.push(i);
  }
  
  return (
    <nav className="text-sm text-white/70 whitespace-nowrap overflow-x-auto no-scrollbar">
      {filteredParts.map((p, i) => {
        const originalIndex = originalIndexMap[i];
        const acc = "/" + parts.slice(0, originalIndex + 1).join("/");
        const isId = /^[a-f0-9]{8,}$/i.test(p);
        const label = human(isId ? "Detail" : p);
        
        return (
          <span key={acc}>
            {i > 0 && <span className="mx-2 text-white/40">/</span>}
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

export default function InventoryLayout() {
  const navigate = useNavigate();
  return (
    <>
      {/* sub-navbar under global navbar */}
      <div className="sticky top-16 z-20 bg-base-300/80 backdrop-blur border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Breadcrumbs />
          </div>
          <div className="flex flex-wrap gap-2 overflow-x-auto no-scrollbar">
            {/* Secondary navigation buttons removed as requested */}
          </div>
        </div>
      </div>
      <Outlet/>
    </>
  );
}