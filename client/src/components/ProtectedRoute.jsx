import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../api/Auth";

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, isAuthReady } = useAuth();

  if (!isAuthReady) {
    return null;
  }

  if (!user?.token) {
    // Si no hay token, redirige al login
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !user.is_staff) {
    // Si se requiere admin pero no es staff, redirige a unauthorized
    return <Navigate to="/unauthorized" replace />;
  }

  // Si todo está bien, renderiza los hijos (la página protegida)
  return children;
};

export default ProtectedRoute;
