import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Information } from "./pages/Information";
import AdminMenuPage from "./pages/AdminMenu";
import TeacherList from "./pages/TeacherListPage";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import { Navigation } from "./components/Navigation";
import { Toaster } from "react-hot-toast";
import RegisterPage from "./pages/RegisterPage";
import RegisterWrapper from "./pages/RegisterWrapper";
import EditarPerfil from "./pages/EditProfile";
import UserMenuPage from "./pages/UserMenuPage";
import EstudiantesListPage from "./pages/EstudiantesListPage";
import RegisterStudentPage from "./pages/RegisterStudentPage";
import RegisterStudentWrapper from "./pages/RegisterStudentWrapper";
import EvaluacionEstudiantesPage from "./pages/EvaluacionEstudiantesPage";

function App() {
  return (
    <BrowserRouter>
      <Navigation />
      <Routes>
        <Route path="/editar-perfil" element={<EditarPerfil />} />
        <Route path="/" element={<Navigate to="/information" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/information" element={<Information />} />
        <Route path="/registrar-estudiante" element={<RegisterStudentPage />} />
        <Route
          path="/editar-estudiante/:id"
          element={<RegisterStudentWrapper />}
        />
        <Route
          path="/teacher-menu"
          element={
            <ProtectedRoute>
              <UserMenuPage />
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
          path="/student-list"
          element={
            <ProtectedRoute requireAdmin={true}>
              <EstudiantesListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/evaluacion-estudiantes"
          element={
            <ProtectedRoute>
              <EvaluacionEstudiantesPage />
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
