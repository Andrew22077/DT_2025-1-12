// src/components/RegisterPage.js
import React, { useState, useEffect } from "react";
import { registerProfesor, updateProfesor, useUserApi } from "../api/UserApi";
import { useNavigate } from "react-router-dom";

const RegisterPage = ({ editing = false, profesor = null }) => {
  const { getMaterias } = useUserApi();
  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    cedula: "",
    password: "",
    is_staff: false,
    is_active: true,
    materias: [],
  });

  const [materias, setMaterias] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const cargarMaterias = async () => {
      try {
        setLoading(true);
        const materiasData = await getMaterias();
        setMaterias(materiasData);
      } catch (error) {
        console.error("Error al cargar materias:", error);
        setError("Error al cargar las materias");
      } finally {
        setLoading(false);
      }
    };

    cargarMaterias();

    if (editing && profesor) {
      setFormData({
        nombre: profesor.nombre,
        correo: profesor.correo,
        cedula: profesor.cedula,
        password: "", // No se edita la contraseña
        is_staff: profesor.is_staff,
        is_active: profesor.is_active,
        materias: profesor.materias
          ? profesor.materias.map((m) => m.id).filter((id) => id != null)
          : [],
      });
    }
  }, [editing, profesor, getMaterias]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleMateriaChange = (materiaId) => {
    // Validar que materiaId sea válido
    if (!materiaId || materiaId === null || materiaId === undefined) {
      console.error("ID de materia inválido:", materiaId);
      return;
    }

    setFormData((prevData) => {
      const newMaterias = prevData.materias.includes(materiaId)
        ? prevData.materias.filter((id) => id !== materiaId)
        : [...prevData.materias, materiaId];

      // Filtrar valores nulos o indefinidos
      const filteredMaterias = newMaterias.filter(
        (id) => id != null && id !== undefined
      );

      return {
        ...prevData,
        materias: filteredMaterias,
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        // En edición, se envían solo los campos necesarios (sin password)
        const { password, ...dataToUpdate } = formData;
        await updateProfesor(profesor.id, dataToUpdate);
      } else {
        // En registro, se envían los campos necesarios incluyendo materias
        const { nombre, correo, cedula, password, materias } = formData;
        await registerProfesor({ nombre, correo, cedula, password, materias });
      }
      navigate("/teacher-list");
    } catch (error) {
      console.error("Error al registrar o actualizar el profesor:", error);
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

        {/* Selección de materias */}
        <div>
          <label className="block mb-2 font-medium">Materias</label>
          {loading ? (
            <p className="text-gray-500">Cargando materias...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded p-2">
              {materias.map((materia) => (
                <label
                  key={materia.id}
                  className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                >
                  <input
                    type="checkbox"
                    checked={formData.materias.includes(materia.id)}
                    onChange={() => handleMateriaChange(materia.id)}
                    className="rounded"
                  />
                  <span className="text-sm">{materia.nombre}</span>
                </label>
              ))}
            </div>
          )}
        </div>

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
