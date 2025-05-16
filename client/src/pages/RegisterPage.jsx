// src/components/RegisterPage.js
import React, { useState, useEffect } from "react";
import { registerProfesor, updateProfesor } from "../api/UserApi";
import { useNavigate } from "react-router-dom";

const RegisterPage = ({ editing = false, profesor = null }) => {
  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    cedula: "",
    password: "",
    is_staff: false,
    is_active: true,
  });

  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (editing && profesor) {
      setFormData({
        nombre: profesor.nombre,
        correo: profesor.correo,
        cedula: profesor.cedula,
        password: "", // No se edita la contraseña
        is_staff: profesor.is_staff,
        is_active: profesor.is_active,
      });
    }
  }, [editing, profesor]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        // En edición, se envían todos los campos
        await updateProfesor(profesor.id, formData);
      } else {
        // En registro, solo se envían los campos necesarios
        const { nombre, correo, cedula, password } = formData;
        await registerProfesor({ nombre, correo, cedula, password });
      }
      navigate("/teacher-list");
    } catch {
      setError("Error al registrar o actualizar el profesor.");
    }
  };

  return (
    <div className="p-5 max-w-lg mx-auto">
      <h2 className="text-3xl font-semibold mb-5">
        {editing ? "Editar Profesor" : "Registrar Profesor"}
      </h2>

      {error && <p className="text-red-500">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="nombre" className="block">
            Nombre
          </label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleInputChange}
            className="px-4 py-2 border rounded w-full"
            required
          />
        </div>

        <div>
          <label htmlFor="correo" className="block">
            Correo
          </label>
          <input
            type="email"
            id="correo"
            name="correo"
            value={formData.correo}
            onChange={handleInputChange}
            className="px-4 py-2 border rounded w-full"
            required
          />
        </div>

        <div>
          <label htmlFor="cedula" className="block">
            Cédula
          </label>
          <input
            type="text"
            id="cedula"
            name="cedula"
            value={formData.cedula}
            onChange={handleInputChange}
            className="px-4 py-2 border rounded w-full"
            required
          />
        </div>

        {!editing && (
          <div>
            <label htmlFor="password" className="block">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="px-4 py-2 border rounded w-full"
              required
            />
          </div>
        )}

        {editing && (
          <>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
                className="mr-2"
              />
              <label htmlFor="is_active">Activo</label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_staff"
                checked={formData.is_staff}
                onChange={handleInputChange}
                className="mr-2"
              />
              <label htmlFor="is_staff">Administrador</label>
            </div>
          </>
        )}

        <button
          type="submit"
          className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        >
          {editing ? "Actualizar" : "Registrar"}
        </button>
      </form>
    </div>
  );
};

export default RegisterPage;
