import React from 'react';
import { Navigate } from 'react-router-dom';
import { Sweet, Toast } from '@/utils/sweet';

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

  // Debug log for troubleshooting role-based redirects
  console.log('[RequireAuth] token:', token, 'user:', user, 'role prop:', role, 'roles prop:', roles);

  if (!token || !user) {
    console.warn('[RequireAuth] No token or user found, redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    console.warn(`[RequireAuth] User role (${user.role}) does not match required role (${role}), redirecting to home for role.`);
    return <Navigate to={homeForRole(user.role)} replace />;
  }
  if (Array.isArray(roles) && roles.length > 0 && !roles.includes(user.role)) {
    console.warn(`[RequireAuth] User role (${user.role}) not in allowed roles (${roles}), redirecting to home for role.`);
    return <Navigate to={homeForRole(user.role)} replace />;
  }

  return children;
};

export default RequireAuth;
