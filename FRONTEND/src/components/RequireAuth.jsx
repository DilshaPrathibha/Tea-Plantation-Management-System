import React from 'react';
import { Navigate } from 'react-router-dom';

const homeForRole = (role) => {
  if (role === 'admin') return '/admin';
  if (role === 'field_supervisor') return '/supervisor';
  if (role === 'production_manager') return '/production-dashboard';
  if (role === 'inventory_manager') return '/inventory-dashboard';
  return '/';
};

const RequireAuth = ({ children, role, roles }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  if (!token || !user) return <Navigate to="/login" replace />;

  if (role && user.role !== role) {
    return <Navigate to={homeForRole(user.role)} replace />;
  }
  if (Array.isArray(roles) && roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to={homeForRole(user.role)} replace />;
  }

  return children;
};

export default RequireAuth;
