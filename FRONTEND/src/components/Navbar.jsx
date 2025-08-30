import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Leaf, User, BarChart2, Home, Wrench, FlaskConical } from 'lucide-react';

const Navbar = () => {
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
          <nav className="flex gap-4">
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
              <NavLink to="/admin/tools" className="btn btn-ghost flex items-center gap-1">
                <Wrench size={18} />
                Tools
              </NavLink>
              <NavLink to="/admin/fni" className="btn btn-ghost flex items-center gap-1">
                <FlaskConical size={18} />
                FNI
              </NavLink>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Navbar;