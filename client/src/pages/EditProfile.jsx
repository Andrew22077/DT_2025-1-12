import React, { useState } from "react";
import { actualizarPerfilUsuario } from "../api/UserApi";

// Definir colores desde los proporcionados
const colors = {
  primary100: "#4CAF50",
  primary200: "#2a9235",
  primary300: "#0a490a",
  accent100: "#FFC107",
  accent200: "#916400",
  text100: "#333333",
  text200: "#5c5c5c",
  bg100: "#e6fbe3",
  bg200: "#dcf1d9",
  bg300: "#b4c8b1"
};

const EditarPerfil = () => {
  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    contrasenia: "",
  });
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    try {
      const data = { ...formData };
      if (data.contrasenia === "") delete data.contrasenia;

      await actualizarPerfilUsuario(data);
      setMensaje("Perfil actualizado con éxito.");
    } catch (err) {
      setError("Error al actualizar perfil. Verifica los campos.");
      console.error(err);
    }
  };

  return (
    <div 
      className="min-h-screen p-6 flex items-center justify-center"
      style={{ backgroundColor: colors.bg100 }}
    >
      <div className="rounded-lg shadow-lg w-full max-w-5xl flex overflow-hidden">
        {/* Lado Izquierdo - Formulario */}
        <div 
          className="w-1/3 p-6 flex flex-col items-center"
          style={{ backgroundColor: colors.primary100 }}
        >
          <div 
            className="w-24 h-24 rounded-full mb-4 flex items-center justify-center"
            style={{ 
              backgroundColor: colors.bg100,
              border: `4px solid ${colors.primary200}`
            }}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              className="w-12 h-12"
              style={{ color: colors.primary300 }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          
          <h2 
            className="text-xl font-semibold mb-4"
            style={{ color: colors.bg100 }}
          >
            Editar Perfil
          </h2>
          
          <form onSubmit={handleSubmit} className="w-full">
            {mensaje && (
              <div 
                className="mb-3 p-2 rounded text-center"
                style={{ backgroundColor: colors.bg100, color: colors.primary300 }}
              >
                {mensaje}
              </div>
            )}
            
            {error && (
              <div 
                className="mb-3 p-2 rounded text-center"
                style={{ backgroundColor: "#FFECEC", color: "#D32F2F" }}
              >
                {error}
              </div>
            )}

            <div className="mb-3">
              <label 
                htmlFor="nombre" 
                className="block font-medium mb-1"
                style={{ color: colors.bg100 }}
              >
                Nombre
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className="p-2 w-full rounded focus:outline-none"
                style={{ 
                  border: `1px solid ${colors.bg200}`,
                  backgroundColor: colors.bg100,
                  color: colors.text100
                }}
                required
              />
            </div>

            <div className="mb-3">
              <label 
                htmlFor="correo" 
                className="block font-medium mb-1"
                style={{ color: colors.bg100 }}
              >
                Correo electrónico
              </label>
              <input
                type="email"
                id="correo"
                name="correo"
                value={formData.correo}
                onChange={handleChange}
                className="p-2 w-full rounded focus:outline-none"
                style={{ 
                  border: `1px solid ${colors.bg200}`,
                  backgroundColor: colors.bg100,
                  color: colors.text100
                }}
                required
              />
            </div>

            <div className="mb-4">
              <label 
                htmlFor="contrasenia" 
                className="block font-medium mb-1"
                style={{ color: colors.bg100 }}
              >
                Nueva Contraseña (opcional)
              </label>
              <input
                type="password"
                id="contrasenia"
                name="contrasenia"
                value={formData.contrasenia}
                onChange={handleChange}
                className="p-2 w-full rounded focus:outline-none"
                style={{ 
                  border: `1px solid ${colors.bg200}`,
                  backgroundColor: colors.bg100,
                  color: colors.text100
                }}
                placeholder="Dejar en blanco si no deseas cambiarla"
              />
            </div>

            <button
              type="submit"
                className="text-amber-50 mt-1 block w-full px-3 py-2 border border-green-300 rounded-md bg-green-700 hover:bg-emerald-800 focus:outline-none focus:ring-orange-400 focus:border-orange-400"
            >
              Guardar Cambios
            </button>
          </form>
        </div>

        {/* Lado Derecho - Información de perfil */}
        <div 
          className="w-2/3 p-8"
          style={{ backgroundColor: colors.bg200 }}
        >
          <h1 
            className="text-2xl font-bold mb-6"
            style={{ color: colors.primary300 }}
          >
            Notificaciones
          </h1>
          
          <div 
            className="rounded-lg p-6 shadow-md"
            style={{ backgroundColor: colors.bg100 }}
          >
            <div className="mb-6">

              <ul 
                className="list-disc pl-5 space-y-2"
                style={{ color: colors.text200 }}
              >

              </ul>
            </div>
            
            <div
              className="p-4 rounded-lg"
              style={{ backgroundColor: colors.bg200 }}
            >
              <p 
                className="text-sm"
                style={{ color: colors.text200 }}
              >

              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditarPerfil;