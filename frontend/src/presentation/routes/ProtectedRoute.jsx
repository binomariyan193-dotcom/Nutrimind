import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../application/context/AuthContext';

export const ProtectedRoute = () => {
  const { user } = useAuth();

  if (!user) {
    // User not logged in, redirect to login page
    return <Navigate to="/login" replace />;
  }

  // User logged in, render child routes
  return <Outlet />;
};
