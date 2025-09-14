import React, { useEffect, useState } from "react";
import { useUserApi } from "../api/UserApi";
import { useNavigate } from "react-router-dom";
import { default as ImportExportExcel } from "../components/ImportExportExcel";
import { FaUser, FaCamera, FaEdit } from "react-icons/fa";

const TeacherList = () => {
  const { getProfesores, loading, error } = useUserApi();
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    nombre: "",
    correo: "",
    estado: "", // Filtro para el estado (activo/inactivo)
  });

  const navigate = useNavigate(); // Hook para redirigir al usuario

  const fetchUsers = async () => {
    try {
      const usersData = await getProfesores();
      setUsers(usersData);
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  // Manejador para cuando se complete una importación exitosa
  const handleImportSuccess = () => {
    fetchUsers(); // Recargamos la lista de profesores
  };

  // Filtrar los usuarios con base en los filtros
  const filteredUsers = users.filter((user) => {
    return (
      (filters.nombre
        ? user.nombre.toLowerCase().includes(filters.nombre.toLowerCase())
        : true) &&
      (filters.correo
        ? user.correo.toLowerCase().includes(filters.correo.toLowerCase())
        : true) &&
      (filters.estado
        ? filters.estado === "activo"
          ? user.is_active
          : !user.is_active
        : true)
    );
  });

  const handleCardClick = (userId) => {
    // Redirigir al usuario a la página de edición
    navigate(`/editar/${userId}`);
  };

  const handleEditClick = (e, userId) => {
    e.stopPropagation(); // Evitar que se active el onClick del card
    navigate(`/editar/${userId}`);
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando profesores...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">
            Error al cargar los profesores
          </p>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={fetchUsers}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Reintentar
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 p-5">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          Lista de Profesores
        </h2>

        {/* Componente de importación/exportación de Excel */}
        <ImportExportExcel onImportSuccess={handleImportSuccess} />

        {/* Filtros y Botón de Registrar Profesor */}
        <div className="flex justify-between mb-8 items-center flex-wrap gap-4">
          <div className="flex space-x-4 items-center flex-wrap">
            <input
              type="text"
              name="nombre"
              value={filters.nombre}
              onChange={handleFilterChange}
              placeholder="Filtrar por nombre"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              name="correo"
              value={filters.correo}
              onChange={handleFilterChange}
              placeholder="Filtrar por correo"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              name="estado"
              value={filters.estado}
              onChange={handleFilterChange}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Filtrar por estado</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
          <button
            onClick={() => navigate("/registrar")}
            className="bg-green-500 text-white py-2 px-6 rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center"
          >
            <FaUser className="mr-2" />
            Registrar Profesor
          </button>
        </div>

        {/* Lista de Profesores */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out cursor-pointer group overflow-hidden"
              onClick={() => handleCardClick(user.id)}
            >
              {/* Header con foto */}
              <div className="relative bg-gradient-to-r from-blue-500 to-cyan-500 p-4">
                <div className="flex justify-center mb-3">
                  <div className="relative">
                    {user.foto_url &&
                    user.foto_url !== "/static/default-avatar.png" ? (
                      <img
                        src={user.foto_url}
                        alt={user.nombre}
                        className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-white/20 border-4 border-white shadow-lg flex items-center justify-center">
                        <FaUser className="text-3xl text-white" />
                      </div>
                    )}

                    {/* Indicador de foto */}
                    {user.foto_url &&
                      user.foto_url !== "/static/default-avatar.png" && (
                        <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-1">
                          <FaCamera className="text-xs" />
                        </div>
                      )}
                  </div>
                </div>

                {/* Botón de editar */}
                <button
                  onClick={(e) => handleEditClick(e, user.id)}
                  className="absolute top-2 right-2 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  title="Editar profesor"
                >
                  <FaEdit className="text-sm" />
                </button>
              </div>

              {/* Información del profesor */}
              <div className="p-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2 truncate">
                    {user.nombre}
                  </h3>

                  <div className="space-y-2 text-sm text-gray-600">
                    <p className="flex items-center justify-center">
                      <span className="font-medium mr-2">Cédula:</span>
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {user.cedula}
                      </span>
                    </p>

                    <p className="flex items-center justify-center">
                      <span className="font-medium mr-2">Correo:</span>
                      <span
                        className="truncate max-w-[150px]"
                        title={user.correo}
                      >
                        {user.correo}
                      </span>
                    </p>

                    {/* Materias */}
                    {user.materias && user.materias.length > 0 && (
                      <div className="mt-2">
                        <span className="font-medium text-xs text-gray-500">
                          Materias:
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {user.materias.slice(0, 2).map((materia, index) => (
                            <span
                              key={index}
                              className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                            >
                              {materia.nombre}
                            </span>
                          ))}
                          {user.materias.length > 2 && (
                            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                              +{user.materias.length - 2} más
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Estado */}
                  <div className="mt-3">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        user.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </div>

                  {/* Rol de administrador */}
                  {user.is_staff && (
                    <div className="mt-2">
                      <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                        Administrador
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mensaje si no hay profesores */}
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <FaUser className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {users.length === 0
                ? "No hay profesores registrados"
                : "No se encontraron profesores con los filtros aplicados"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherList;
