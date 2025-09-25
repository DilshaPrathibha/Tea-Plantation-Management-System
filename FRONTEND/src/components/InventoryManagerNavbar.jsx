import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Leaf, BarChart2, Home, Wrench, FlaskConical, LogOut } from 'lucide-react';
import { Sweet } from '@/utils/sweet';

const InventoryManagerNavbar = () => {
  const navigate = useNavigate();

  const logout = async () => {
    const ok = await Sweet.confirm('Log out from Inventory Manager?');
    if (!ok) return;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    await Sweet.success('Signed out');
    navigate('/login');
  };

  return (
    <header className="bg-base-300 border-b border-base-content/10">
      <div className="mx-auto max-w-6xl p-4">
        <div className="flex items-center justify-between">
          <Link to="/inventory-dashboard" className="flex items-center gap-2">
            <Leaf className="size-7 text-green-700" />
            <span className="text-3xl font-bold text-primary font-mono tracking-tight">
              CeylonLeaf
            </span>
          </Link>
          <nav className="flex gap-4">
            <NavLink to="/inventory-dashboard" className="btn btn-ghost flex items-center gap-1">
              <Home size={18} />
              Dashboard
            </NavLink>
            <NavLink to="/inventory-reports" className="btn btn-ghost flex items-center gap-1">
              <BarChart2 size={18} />
              Reports
            </NavLink>
            <NavLink to="/tools" className="btn btn-ghost flex items-center gap-1">
              <Wrench size={18} />
              Tools
            </NavLink>
            <NavLink to="/fni" className="btn btn-ghost flex items-center gap-1">
              <FlaskConical size={18} />
              FNI
            </NavLink>
            <button className="btn btn-ghost text-red-400 hover:text-red-300 hover:bg-red-900/20 flex items-center gap-1" onClick={logout}>
              <LogOut size={18} />
              Logout
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default InventoryManagerNavbar;