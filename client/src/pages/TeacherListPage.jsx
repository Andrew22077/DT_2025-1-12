import React, { useEffect, useState } from "react";
import { getProfesores } from "../api/UserApi";
import { useNavigate } from "react-router-dom";
import { default as ImportExportExcel } from "../components/ImportExportExcel";

const TeacherList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    nombre: "",
    correo: "",
    estado: "", // Filtro para el estado (activo/inactivo)
  });

  const token = localStorage.getItem("token");
  const navigate = useNavigate(); // Hook para redirigir al usuario

  const fetchUsers = async () => {
    try {
      const usersData = await getProfesores(token);
      setUsers(usersData);
      setLoading(false);
    } catch {
      setError("No se pudieron cargar los usuarios.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

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

  if (loading) return <p>Cargando usuarios...</p>;
  if (error) return <p>{error}</p>;

  const handleCardClick = (userId) => {
    // Redirigir al usuario a la página de edición
    navigate(`/editar/${userId}`);
  };

  return (
    <div className="p-5 text-center">
      <h2 className="text-3xl font-semibold mb-5">Lista de Profesores</h2>

      {/* Componente de importación/exportación de Excel */}
      <ImportExportExcel onImportSuccess={handleImportSuccess} />

      {/* Filtros y Botón de Registrar Profesor */}
      <div className="flex justify-between mb-5 items-center flex-wrap ">
        <div className="flex space-x-4 items-center center">
          <input
            type="text"
            name="nombre"
            value={filters.nombre}
            onChange={handleFilterChange}
            placeholder="Filtrar por nombre"
            className="px-4 py-2 border rounded"
          />
          <input
            type="text"
            name="correo"
            value={filters.correo}
            onChange={handleFilterChange}
            placeholder="Filtrar por correo"
            className="px-4 py-2 border rounded"
          />
          <select
            name="estado"
            value={filters.estado}
            onChange={handleFilterChange}
            className="px-4 py-2 border rounded"
          >
            <option value="">Filtrar por estado</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
          <button
            onClick={() => navigate("/registrar")}
            className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
          >
            Registrar Profesor
          </button>
        </div>
      </div>

      {/* Lista de Profesores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className="bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out cursor-pointer"
            onClick={() => handleCardClick(user.id)} // Redirigir al hacer clic
          >
            <div className="flex justify-center mb-4">
              <img
                src={`https://www.gravatar.com/avatar/${user.correo}?d=identicon`}
                alt={user.nombre}
                className="w-24 h-24 rounded-full object-cover"
              />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-medium mb-2">{user.nombre}</h3>
              <p className="text-sm text-gray-500">
                <strong>Cédula:</strong> {user.cedula}
              </p>
              <p className="text-sm text-gray-500">
                <strong>Correo:</strong> {user.correo}
              </p>
              <p
                className={`mt-2 text-sm ${
                  user.is_active ? "text-green-500" : "text-red-500"
                }`}
              >
                <strong>Estado:</strong>{" "}
                {user.is_active ? "Activo" : "Inactivo"}
              </p>
            </div>
            <div className="mt-4 text-center">
              {user.is_staff && (
                <span className="inline-block bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  Admin
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeacherList;
