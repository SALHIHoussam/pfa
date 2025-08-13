import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

export default function AdminRoute() {
  const token = localStorage.getItem('token');

  if (!token) {
    // Pas de token → redirection vers login
    return <Navigate to="/login" replace />;
  }

  try {
    const decoded = jwtDecode(token);

    if (decoded.role === 'ADMIN') {
      // Token valide et rôle ADMIN → accès autorisé
      return <Outlet />;
    } else {
      // Rôle non admin → supprime token et redirige
      localStorage.removeItem('token');
      return <Navigate to="/login" replace />;
    }
  } catch {
    // Token invalide → supprime et redirige
    localStorage.removeItem('token');
    return <Navigate to="/login" replace />;
  }
}
