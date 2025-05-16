import React, { useEffect, useState } from "react";
import { getProfesores } from "../api/UserApi"; // Importamos la función para obtener usuarios

const TeacherList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token"); // Suponiendo que guardas el token en localStorage

  useEffect(() => {
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

    fetchUsers();
  }, [token]);

  if (loading) return <p>Cargando usuarios...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="p-5 text-center">
      <h2 className="text-3xl font-semibold mb-5">Lista de Profesores</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {users.map((user) => (
          <div
            className="bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out"
            key={user.id}
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
