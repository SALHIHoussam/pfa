import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

export default function PrivateRoute({ allowedRoles }) {
  const token = localStorage.getItem('token');

  if (!token) return <Navigate to="/login" replace />;

  try {
    const decoded = jwtDecode(token);
    if (allowedRoles.includes(decoded.role)) {
      return <Outlet />;
    }
  } catch {
    localStorage.removeItem('token');
  }

  return <Navigate to="/login" replace />;
}
