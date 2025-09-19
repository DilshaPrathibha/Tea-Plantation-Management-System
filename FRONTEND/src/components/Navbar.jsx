import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Leaf, User, BarChart2, Home, Wrench, FlaskConical, Truck } from 'lucide-react';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="bg-base-300 border-b border-base-content/10">
      <div className="mx-auto max-w-6xl p-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Leaf className="size-7 text-green-700" />
            <span className="text-3xl font-bold text-primary font-mono tracking-tight">
              CeylonLeaf
            </span>
          </Link>
          {/* Desktop nav */}
          <nav className="hidden md:flex gap-4">
            <NavLink to="/" className="btn btn-ghost flex items-center gap-1">
              <Home size={18} />
              Dashboard
            </NavLink>
            <NavLink to="/fields" className="btn btn-ghost flex items-center gap-1">
              <Leaf size={18} />
              Fields
            </NavLink>
            <NavLink to="/workers" className="btn btn-ghost flex items-center gap-1">
              <User size={18} />
              Workers
            </NavLink>
            <NavLink to="/harvests" className="btn btn-ghost flex items-center gap-1">
              <Leaf size={18} />
              Harvests
            </NavLink>
            <NavLink to="/reports" className="btn btn-ghost flex items-center gap-1">
              <BarChart2 size={18} />
              Reports
            </NavLink>
            <NavLink to="/tools" className="btn btn-ghost flex items-center gap-1">
              <Wrench size={18} />
              Tools
            </NavLink>
            <NavLink to="/FNI" className="btn btn-ghost flex items-center gap-1">
              <FlaskConical size={18} />
              FNI
            </NavLink>
            <NavLink to="/vehicle-map" className="btn btn-ghost flex items-center gap-1">
              <Truck size={18} />
              Track Vehicle
            </NavLink>
          </nav>
          {/* Mobile hamburger */}
          <button
            className="md:hidden btn btn-ghost flex items-center"
            aria-label="Open menu"
            onClick={() => setMenuOpen(v => !v)}
          >
            <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
        </div>
        {/* Mobile nav menu */}
        {menuOpen && (
          <nav className="md:hidden flex flex-col gap-2 mt-4 animate-fade-in">
            <NavLink to="/" className="btn btn-ghost flex items-center gap-1" onClick={() => setMenuOpen(false)}>
              <Home size={18} /> Dashboard
            </NavLink>
            <NavLink to="/fields" className="btn btn-ghost flex items-center gap-1" onClick={() => setMenuOpen(false)}>
              <Leaf size={18} /> Fields
            </NavLink>
            <NavLink to="/workers" className="btn btn-ghost flex items-center gap-1" onClick={() => setMenuOpen(false)}>
              <User size={18} /> Workers
            </NavLink>
            <NavLink to="/harvests" className="btn btn-ghost flex items-center gap-1" onClick={() => setMenuOpen(false)}>
              <Leaf size={18} /> Harvests
            </NavLink>
            <NavLink to="/reports" className="btn btn-ghost flex items-center gap-1" onClick={() => setMenuOpen(false)}>
              <BarChart2 size={18} /> Reports
            </NavLink>
            <NavLink to="/tools" className="btn btn-ghost flex items-center gap-1" onClick={() => setMenuOpen(false)}>
              <Wrench size={18} /> Tools
            </NavLink>
            <NavLink to="/FNI" className="btn btn-ghost flex items-center gap-1" onClick={() => setMenuOpen(false)}>
              <FlaskConical size={18} /> FNI
            </NavLink>
            <NavLink to="/vehicle-map" className="btn btn-ghost flex items-center gap-1" onClick={() => setMenuOpen(false)}>
              <Truck size={18} /> Vehicle Map
            </NavLink>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Navbar;