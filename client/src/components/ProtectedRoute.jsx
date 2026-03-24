import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const raw = localStorage.getItem("token");
  const token =
    raw && raw !== "undefined" && raw !== "null" && raw.trim() !== ""
      ? raw
      : null;
  const isStaff = localStorage.getItem("isStaff") === "true";

  if (!token) {
    // Si no hay token, redirige al login
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isStaff) {
    // Si se requiere admin pero no es staff, redirige a unauthorized
    return <Navigate to="/unauthorized" replace />;
  }

  // Si todo está bien, renderiza los hijos (la página protegida)
  return children;
};

export default ProtectedRoute;
