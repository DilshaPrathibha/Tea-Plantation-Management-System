import React from "react";
import { Navigate, useLocation } from "react-router-dom";

/**
 * Protect a route.
 * Props:
 *   - role?: string          // single required role
 *   - roles?: string[]       // any of these roles
 *   - children: JSX.Element
 */
export default function RequireAuth({ children, role, roles = [] }) {
  const location = useLocation();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const userRole = user?.role;

  // not logged in -> go to login and remember where they came from
  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // normalize required roles (support role OR roles prop)
  const required = roles.length ? roles : role ? [role] : [];

  // if roles were specified, ensure the user matches one
  if (required.length && !required.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
