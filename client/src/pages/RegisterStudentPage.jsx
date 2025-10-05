// src/components/RegisterEstudiantePage.jsx
import React, { useState, useEffect } from "react";
import { registerEstudiante, updateEstudiante } from "../api/UserApi";
import { useNavigate } from "react-router-dom";

const RegisterStudentPage = ({ editing = false, estudiante = null }) => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    documento: "",
    nombre: "",
    correo: "",
    grupo: "",
    estado: "prematricula",
  });

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Cargar datos del estudiante si estamos editando
  useEffect(() => {
    if (editing && estudiante) {
      setFormData({
        documento: estudiante.documento || "",
        nombre: estudiante.nombre || "",
        correo: estudiante.correo || "",
        grupo: estudiante.grupo || "",
        estado: estudiante.estado || "prematricula",
      });
    }
  }, [editing, estudiante]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensaje("");
    setError("");

    try {
      if (editing && estudiante) {
        // Actualizar estudiante existente
        await updateEstudiante(estudiante.id, formData);
        setMensaje("Estudiante actualizado exitosamente");
      } else {
        // Crear nuevo estudiante
        await registerEstudiante(formData);
        setMensaje("Estudiante registrado exitosamente");
        // Limpiar formulario
        setFormData({
          documento: "",
          nombre: "",
          correo: "",
          grupo: "",
          estado: "prematricula",
        });
      }

      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate("/estudiantes");
      }, 2000);

    } catch (error) {
      console.error("Error:", error);
      
      // Extraer mensaje de error más específico
      let errorMessage = editing 
        ? "Error al actualizar el estudiante. Verifica los datos."
        : "Error al registrar el estudiante. Verifica los datos.";
      
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.detalles) {
          // Mostrar errores de validación específicos
          const errorDetails = Object.entries(errorData.detalles)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('; ');
          errorMessage = `Errores de validación: ${errorDetails}`;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {editing ? "Editar Estudiante" : "Registrar Nuevo Estudiante"}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {editing 
            ? "Modifica los datos del estudiante"
            : "Completa los datos del nuevo estudiante"
          }
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            
            {/* Mensajes */}
            {mensaje && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                {mensaje}
              </div>
            )}

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Documento */}
            <div>
              <label htmlFor="documento" className="block text-sm font-medium text-gray-700">
                Documento de Identidad
              </label>
              <div className="mt-1">
                <input
                  id="documento"
                  name="documento"
                  type="text"
                  required
                  value={formData.documento}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Número de documento"
                />
              </div>
            </div>

            {/* Nombre */}
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
                Nombre Completo
              </label>
              <div className="mt-1">
                <input
                  id="nombre"
                  name="nombre"
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Apellidos y nombres"
                />
              </div>
            </div>

            {/* Correo */}
            <div>
              <label htmlFor="correo" className="block text-sm font-medium text-gray-700">
                Correo Electrónico
              </label>
              <div className="mt-1">
                <input
                  id="correo"
                  name="correo"
                  type="email"
                  required
                  value={formData.correo}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="correo@ejemplo.com"
                />
              </div>
            </div>

            {/* Grupo */}
            <div>
              <label htmlFor="grupo" className="block text-sm font-medium text-gray-700">
                Grupo
              </label>
              <div className="mt-1">
                <input
                  id="grupo"
                  name="grupo"
                  type="text"
                  required
                  value={formData.grupo}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Ej: 1A, 2B, VIRTUAL 1"
                />
              </div>
            </div>

            {/* Estado */}
            <div>
              <label htmlFor="estado" className="block text-sm font-medium text-gray-700">
                Estado de Matrícula
              </label>
              <div className="mt-1">
                <select
                  id="estado"
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="prematricula">Prematriculado</option>
                  <option value="matriculado">Matriculado</option>
                </select>
              </div>
            </div>

            {/* Botones */}
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading 
                  ? (editing ? "Actualizando..." : "Registrando...") 
                  : (editing ? "Actualizar Estudiante" : "Registrar Estudiante")
                }
              </button>

              <button
                type="button"
                onClick={() => navigate("/estudiantes")}
                className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterStudentPage;