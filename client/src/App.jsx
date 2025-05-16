import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Menu } from "./pages/Menu";
import AdminMenuPage from "./pages/AdminMenu";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import { Navigation } from "./components/Navigation";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <BrowserRouter>
      <Navigation />
      <Routes>
        <Route path="/" element={<Navigate to="/menu" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/menu" element={<Menu />} />
        <Route
          path="/admin-menu"
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminMenuPage />
            </ProtectedRoute>
          }
        />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
