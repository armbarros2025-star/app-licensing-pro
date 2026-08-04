
import React from 'react';
import { Navigate, useLocation } from '../utils/router';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, isAuthChecking, userRole, isClientAccess } = useApp();
  const location = useLocation();

  if (isAuthChecking) {
    return null;
  }

  if (!isAuthenticated) {
    // Redirect to login while saving the attempted location
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (isClientAccess || (allowedRoles && !allowedRoles.includes(userRole))) {
    // User is logged in but doesn't have permission (RBAC)
    // Redirect to dashboard or an unauthorized page
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
