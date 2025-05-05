import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import campusBackground from "../assets/campus-unbosque.jpg";
import { useAuth } from "../api/Auth"; // Usa el contexto

function LoginPage() {
  const [correo, setCorreo] = useState("");
  const [contrasenia, setContrasenia] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login, user } = useAuth(); // Hook del contexto

  // Si ya hay sesión activa, redirigir
  if (user) {
    const isStaff = localStorage.getItem("isStaff") === "true";
    return <Navigate to={isStaff ? "/admin-menu" : "/menu"} />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const data = await login(correo, contrasenia); // login maneja token y user internamente

      // Redirige según el rol
      if (data.acceso) {
        navigate("/admin-menu");
      } else {
        navigate("/menu");
      }
    } catch (err) {
      console.error(err);
      setError("Correo o contraseña incorrectos");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{
        backgroundImage: `url(${campusBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        overflow: "hidden",
      }}
    >
      <div className="bg-white bg-opacity-90 rounded-lg shadow-lg p-8 max-w-sm w-full">
        <h2 className="text-2xl font-bold text-center mb-4 text-green-800">
          Iniciar Sesión
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-green-800">
              Email:
            </label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-orange-400 focus:border-orange-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-green-800">
              Contraseña:
            </label>
            <input
              type="password"
              value={contrasenia}
              onChange={(e) => setContrasenia(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-orange-400 focus:border-orange-400"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-green-800 text-white py-2 rounded-md hover:bg-orange-500 transition"
          >
            Entrar
          </button>
        </form>
        {error && (
          <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
        )}
      </div>
    </div>
  );
}

export default LoginPage;
