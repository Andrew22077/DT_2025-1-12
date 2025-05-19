import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Menu } from "./pages/Menu";
import AdminMenuPage from "./pages/AdminMenu";
import TeacherList from "./pages/TeacherList";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import { Navigation } from "./components/Navigation";
import { Toaster } from "react-hot-toast";
import RegisterPage from "./pages/RegisterPage";
import RegisterWrapper from "./pages/RegisterWrapper";
import EditarPerfil from './pages/EditProfile';

function App() {
  return (
    <BrowserRouter>
      <Navigation />
      <Routes>
        <Route path="/editar-perfil" element={<EditarPerfil />} />
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
        <Route
          path="/teacher-list"
          element={
            <ProtectedRoute requireAdmin={true}>
              <TeacherList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/registrar"
          element={
            <ProtectedRoute requireAdmin={true}>
              <RegisterPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/editar/:id"
          element={
            <ProtectedRoute requireAdmin={true}>
              <RegisterWrapper />
            </ProtectedRoute>
          }
        />
      </Routes>

      <Toaster />
    </BrowserRouter>
  );
}

export default App;
