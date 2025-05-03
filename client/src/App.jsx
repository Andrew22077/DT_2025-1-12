import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import MenuPage from "./pages/Menu";
import AdminMenuPage from "./pages/AdminMenu";
import ProtectedRoute from "./components/ProtectedRoute";
import { Information } from "./pages/Information";
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
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/admin-menu" element={<AdminMenuPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/information" element={<Information />} />
        {/* <Route
          path="/menu"
          element={
            <ProtectedRoute>
              <MenuPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-menu"
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminMenuPage />
            </ProtectedRoute>
          }
        /> */}
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
