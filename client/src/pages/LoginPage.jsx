import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import campusBackground from "../assets/campus-unbosque.jpg";
function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await axios.post("http://localhost:8000/api/login/", {
        email,
        password,
      });

      const data = response.data;

      // Guarda token y permisos
      localStorage.setItem("token", data.token);
      localStorage.setItem("isStaff", data.user.is_staff);
      localStorage.setItem("isSuperuser", data.user.is_superuser);

      // Decide redirección
      if (data.user.is_staff) {
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
        backgroundSize: "cover", // Ajusta la imagen al tamaño de la pantalla
        backgroundPosition: "center", // Centra la imagen
        backgroundAttachment: "fixed", // Mantiene la imagen fija mientras se desplaza
        overflow: "hidden", // Elimina el scrollbar
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
