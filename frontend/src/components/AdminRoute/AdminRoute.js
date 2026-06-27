import React from 'react';
import { Navigate } from 'react-router-dom';

const AdminRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('glamoraAdminUser'));
  const token = localStorage.getItem('glamoraAdminToken');

  if (!user || !token || user.role !== 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return children;
};

export default AdminRoute;