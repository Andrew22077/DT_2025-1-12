import React, { useEffect, useState } from "react";
import { getEstudiantes } from "../api/UserApi";
import { useNavigate } from "react-router-dom";
import ImportExportExcelEstudiantes from "../components/ImportExportExcelEstudiantes";

const EstudiantesListPage = () => {
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    nombre: "",
    correo: "",
    documento: "",
    grupo: "",
    estado: "",
  });
  
  const navigate = useNavigate();

  const fetchEstudiantes = async () => {
    try {
      const estudiantesData = await getEstudiantes();
      setEstudiantes(estudiantesData);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar estudiantes:', error);
      setError("No se pudieron cargar los estudiantes.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEstudiantes();
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
    fetchEstudiantes(); // Recargamos la lista de estudiantes
  };

  // Filtrar los estudiantes con base en los filtros
  const filteredEstudiantes = estudiantes.filter((estudiante) => {
    return (
      (filters.nombre
        ? estudiante.nombre.toLowerCase().includes(filters.nombre.toLowerCase())
        : true) &&
      (filters.correo
        ? estudiante.correo.toLowerCase().includes(filters.correo.toLowerCase())
        : true) &&
      (filters.documento
        ? estudiante.documento.toLowerCase().includes(filters.documento.toLowerCase())
        : true) &&
      (filters.grupo
        ? estudiante.grupo.toLowerCase().includes(filters.grupo.toLowerCase())
        : true) &&
      (filters.estado
        ? estudiante.estado === filters.estado
        : true)
    );
  });

  if (loading) return <p>Cargando estudiantes...</p>;
  if (error) return <p>{error}</p>;

  const handleCardClick = (estudianteId) => {
    // Redirigir al estudiante a la página de edición
    navigate(`/editar-estudiante/${estudianteId}`);
  };

  return (
    <div className="p-5 text-center">
      <h2 className="text-3xl font-semibold mb-5">Lista de Estudiantes</h2>
      
      {/* Componente de importación/exportación de Excel */}
      <ImportExportExcelEstudiantes onImportSuccess={handleImportSuccess} />
      
      {/* Filtros y Botón de Registrar Estudiante */}
      <div className="flex justify-between mb-5 items-center flex-wrap">
        <div className="flex space-x-4 items-center">
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
          <input
            type="text"
            name="documento"
            value={filters.documento}
            onChange={handleFilterChange}
            placeholder="Filtrar por documento"
            className="px-4 py-2 border rounded"
          />
          <input
            type="text"
            name="grupo"
            value={filters.grupo}
            onChange={handleFilterChange}
            placeholder="Filtrar por grupo"
            className="px-4 py-2 border rounded"
          />
          <select
            name="estado"
            value={filters.estado}
            onChange={handleFilterChange}
            className="px-4 py-2 border rounded"
          >
            <option value="">Filtrar por estado</option>
            <option value="prematricula">Prematriculado</option>
            <option value="matriculado">Matriculado</option>
          </select>
          <button
            onClick={() => navigate("/registrar-estudiante")}
            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
          >
            Registrar Estudiante
          </button>
        </div>
      </div>

      {/* Lista de Estudiantes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredEstudiantes.map((estudiante) => (
          <div
            key={estudiante.id}
            className="bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out cursor-pointer border-l-4 border-blue-500"
            onClick={() => handleCardClick(estudiante.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleCardClick(estudiante.id);
              }
            }}
          >
            <div className="flex justify-center mb-4">
              <img
                src={`https://www.gravatar.com/avatar/${estudiante.correo}?d=identicon`}
                alt={estudiante.nombre}
                className="w-20 h-20 rounded-full object-cover border-2 border-blue-200"
              />
            </div>
            
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2 text-gray-800">
                {estudiante.nombre}
              </h3>
              
              <div className="space-y-1 text-sm text-gray-600">
                <p>
                  <strong>Documento:</strong> {estudiante.documento}
                </p>
                <p>
                  <strong>Correo:</strong> {estudiante.correo}
                </p>
                <p>
                  <strong>Grupo:</strong> 
                  <span className="inline-block ml-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                    {estudiante.grupo}
                  </span>
                </p>
                <p>
                  <strong>Estado:</strong> 
                  <span className={`inline-block ml-1 px-2 py-1 rounded-full text-xs font-semibold ${
                    estudiante.estado === 'matriculado' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {estudiante.estado_display || (estudiante.estado === 'matriculado' ? 'Matriculado' : 'Prematriculado')}
                  </span>
                </p>
              </div>
            </div>

            {/* Indicador visual del grupo */}
            <div className="mt-3 text-center">
              <span className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                Estudiante
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Mensaje cuando no hay estudiantes */}
      {filteredEstudiantes.length === 0 && !loading && (
        <div className="text-center py-10">
          <p className="text-gray-500 text-lg">No se encontraron estudiantes con los filtros aplicados.</p>
        </div>
      )}

      {/* Información de totales */}
      <div className="mt-8 text-center text-gray-600">
        <p>
          Mostrando {filteredEstudiantes.length} de {estudiantes.length} estudiantes
        </p>
      </div>
    </div>
  );
};

export default EstudiantesListPage;