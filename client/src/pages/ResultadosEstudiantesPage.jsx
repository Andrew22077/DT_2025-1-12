import React, { useState, useEffect } from "react";
import { useEvaluacionApi } from "../api/EvaluacionApi";
import { useAuth } from "../api/Auth";
import {
  FaUserGraduate,
  FaChartBar,
  FaSearch,
  FaEye,
  FaUsers,
} from "react-icons/fa";
import toast from "react-hot-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

const ResultadosEstudiantesPage = () => {
  const { user } = useAuth();
  const evaluacionApi = useEvaluacionApi();

  const [estudiantes, setEstudiantes] = useState([]);
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState(null);
  const [resultadosEstudiante, setResultadosEstudiante] = useState(null);
  const [resultadosPorSemestre, setResultadosPorSemestre] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cargandoResultados, setCargandoResultados] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#845EC2"];

  // Función para detectar si un estudiante pertenece a segundo semestre
  const esSegundoSemestre = (grupo) => {
    const gruposSegundoSemestre = ['2A', '2B', '2C'];
    return gruposSegundoSemestre.includes(grupo);
  };

  useEffect(() => {
    cargarEstudiantes();
  }, []);

  const cargarEstudiantes = async () => {
    try {
      setLoading(true);
      const estudiantesData = await evaluacionApi.obtenerEstudiantes();
      setEstudiantes(estudiantesData);
    } catch (error) {
      toast.error("Error al cargar estudiantes: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEstudianteChange = async (estudianteId) => {
    if (!estudianteId) {
      setEstudianteSeleccionado(null);
      setResultadosEstudiante(null);
      setResultadosPorSemestre(null);
      return;
    }

    const estudiante = estudiantes.find((e) => e.id === parseInt(estudianteId));
    setEstudianteSeleccionado(estudiante);

    try {
      setCargandoResultados(true);
      
      // Si el estudiante pertenece a segundo semestre, usar la API por semestre
      if (esSegundoSemestre(estudiante.grupo)) {
        const resultados = await evaluacionApi.obtenerResultadosEstudiantePorSemestre(
          estudianteId
        );
        setResultadosPorSemestre(resultados);
        setResultadosEstudiante(null); // Limpiar resultados normales
      } else {
        // Para estudiantes de primer semestre, usar la API normal
        const resultados = await evaluacionApi.obtenerResultadosEstudiante(
          estudianteId
        );
        setResultadosEstudiante(resultados);
        setResultadosPorSemestre(null); // Limpiar resultados por semestre
      }
    } catch (error) {
      toast.error(
        "Error al cargar resultados del estudiante: " + error.message
      );
    } finally {
      setCargandoResultados(false);
    }
  };

  const getColorByPuntaje = (promedio) => {
    if (promedio >= 4.0) return "text-green-600 bg-green-50";
    if (promedio >= 3.0) return "text-blue-600 bg-blue-50";
    if (promedio >= 2.0) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getColorByPuntajeIndividual = (puntaje) => {
    if (puntaje >= 4) return "text-green-600";
    if (puntaje >= 3) return "text-blue-600";
    if (puntaje >= 2) return "text-yellow-600";
    return "text-red-600";
  };

  const getEstadoEvaluacion = (puntaje) => {
    if (puntaje >= 3)
      return { texto: "Aprobado", color: "text-green-600", bg: "bg-green-100" };
    return { texto: "Reprobado", color: "text-red-600", bg: "bg-red-100" };
  };

  // Función para renderizar los resultados de un semestre específico
  const renderResultadosSemestre = (datosSemestre, semestreNombre) => {
    if (!datosSemestre || datosSemestre.resumen_general.total_evaluaciones === 0) {
      return (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            {semestreNombre}
          </h3>
          <div className="text-center py-8">
            <p className="text-gray-500">
              No hay evaluaciones registradas para {semestreNombre.toLowerCase()}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          {semestreNombre}
        </h3>
        
        {/* Resumen general del semestre */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-lg font-medium text-gray-700">
                Resumen General - {semestreNombre}
              </h4>
            </div>
            <div className="text-right">
              <div
                className={`text-2xl font-bold px-4 py-2 rounded-lg ${getColorByPuntaje(
                  datosSemestre.resumen_general.promedio_general || 0
                )}`}
              >
                {datosSemestre.resumen_general.promedio_general?.toFixed(2) || "0.00"}
              </div>
              <p className="text-sm text-gray-600 mt-1">Promedio General</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-xl font-bold text-blue-600">
                {datosSemestre.resumen_general.total_evaluaciones}
              </div>
              <div className="text-sm text-blue-800">
                Total Evaluaciones
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-xl font-bold text-green-600">
                {datosSemestre.resumen_general.total_gacs_evaluados}
              </div>
              <div className="text-sm text-green-800">GACs Evaluados</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-xl font-bold text-purple-600">
                {datosSemestre.resumen_general.total_racs_evaluados}
              </div>
              <div className="text-sm text-purple-800">RACs Evaluados</div>
            </div>
          </div>
        </div>

        {/* Gráficos del semestre */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-4">
              Promedio por Profesor - {semestreNombre}
            </h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={datosSemestre.grafico_profesores || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="profesor" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="promedio" fill="#4F46E5" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-4">
              Promedio por GAC - {semestreNombre}
            </h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={datosSemestre.grafico_gacs || []}
                  dataKey="promedio"
                  nameKey="gac"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {datosSemestre.grafico_gacs?.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabla de evaluaciones detalladas del semestre */}
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-4">
            Evaluaciones Detalladas - {semestreNombre}
          </h4>
          {datosSemestre.evaluaciones?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Profesor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      RAC
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Puntaje
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {datosSemestre.evaluaciones.map((evalItem, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {evalItem.profesor}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {evalItem.rac_numero}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {evalItem.rac_descripcion}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {evalItem.puntaje}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">
              No hay evaluaciones registradas para este semestre.
            </p>
          )}
        </div>
      </div>
    );
  };

  const estudiantesFiltrados = estudiantes.filter(
    (estudiante) =>
      estudiante.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      estudiante.grupo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      estudiante.documento.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando estudiantes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <FaUserGraduate className="text-3xl text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Resultados de Estudiantes
              </h1>
              <p className="text-gray-600">
                Consulte el rendimiento detallado de cada estudiante por GAC
              </p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Buscador */}
            <div className="flex-1 max-w-md">
              <label
                htmlFor="search"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Buscar Estudiante
              </label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  id="search"
                  placeholder="Nombre, grupo o documento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Selector de Estudiante */}
            <div className="w-full lg:w-80">
              <label
                htmlFor="estudiante"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Seleccionar Estudiante
              </label>
              <select
                id="estudiante"
                value={estudianteSeleccionado?.id || ""}
                onChange={(e) => handleEstudianteChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- Seleccione un estudiante --</option>
                {estudiantesFiltrados.map((estudiante) => (
                  <option key={estudiante.id} value={estudiante.id}>
                    {estudiante.nombre} - {estudiante.grupo} (
                    {estudiante.documento})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Resultados del Estudiante */}
        {estudianteSeleccionado && (resultadosEstudiante || resultadosPorSemestre) && (
          <div className="space-y-6">
            {/* Información del estudiante */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-800">
                    {estudianteSeleccionado.nombre}
                  </h2>
                  <p className="text-gray-600">
                    Grupo: {estudianteSeleccionado.grupo} | Documento:{" "}
                    {estudianteSeleccionado.documento}
                  </p>
                  {resultadosPorSemestre && (
                    <p className="text-sm text-blue-600 mt-1">
                      📚 Estudiante de segundo semestre - Mostrando resultados de ambos semestres
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Mostrar resultados por semestre si aplica */}
            {resultadosPorSemestre ? (
              <div className="space-y-6">
                {/* Resultados de Primer Semestre */}
                {renderResultadosSemestre(
                  resultadosPorSemestre.primer_semestre,
                  "Primer Semestre"
                )}

                {/* Resultados de Segundo Semestre */}
                {renderResultadosSemestre(
                  resultadosPorSemestre.segundo_semestre,
                  "Segundo Semestre"
                )}
              </div>
            ) : (
              /* Mostrar resultados normales para estudiantes de primer semestre */
              resultadosEstudiante && (
                <div className="space-y-6">
                  {/* Información y resumen general */}
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800">
                          Resumen General
                        </h3>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-3xl font-bold px-4 py-2 rounded-lg ${getColorByPuntaje(
                            resultadosEstudiante.resumen_general.promedio_general || 0
                          )}`}
                        >
                          {resultadosEstudiante.resumen_general.promedio_general?.toFixed(
                            2
                          ) || "0.00"}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">Promedio General</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {resultadosEstudiante.resumen_general.total_evaluaciones}
                        </div>
                        <div className="text-sm text-blue-800">
                          Total Evaluaciones
                        </div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {resultadosEstudiante.resumen_general.total_gacs_evaluados}
                        </div>
                        <div className="text-sm text-green-800">GACs Evaluados</div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {resultadosEstudiante.resumen_general.total_racs_evaluados}
                        </div>
                        <div className="text-sm text-purple-800">RACs Evaluados</div>
                      </div>
                    </div>
                  </div>

                  {/* Gráficos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Promedio por Profesor
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={resultadosEstudiante.grafico_profesores || []}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="profesor" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="promedio" fill="#4F46E5" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Promedio por GAC
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={resultadosEstudiante.grafico_gacs || []}
                            dataKey="promedio"
                            nameKey="gac"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label
                          >
                            {resultadosEstudiante.grafico_gacs?.map(
                              (entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              )
                            )}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Tabla de evaluaciones detalladas */}
                  <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                      Evaluaciones Detalladas
                    </h3>
                    {resultadosEstudiante.evaluaciones?.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Profesor
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                RAC
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Descripción
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Puntaje
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {resultadosEstudiante.evaluaciones.map(
                              (evalItem, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {evalItem.profesor}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {evalItem.rac_numero}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {evalItem.rac_descripcion}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {evalItem.puntaje}
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-500">
                        No hay evaluaciones registradas para este estudiante.
                      </p>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* Lista de Estudiantes */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FaUsers className="text-blue-600" />
            Lista de Estudiantes ({estudiantesFiltrados.length})
          </h3>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estudiante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grupo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Documento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {estudiantesFiltrados.map((estudiante) => (
                  <tr key={estudiante.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {estudiante.nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {estudiante.grupo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {estudiante.documento}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            estudiante.estado === "matriculado"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {estudiante.estado === "matriculado"
                            ? "Matriculado"
                            : "Prematriculado"}
                        </span>
                        {esSegundoSemestre(estudiante.grupo) && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            📚 2do Semestre
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEstudianteChange(estudiante.id)}
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                      >
                        <FaEye className="w-4 h-4" />
                        Ver Resultados
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultadosEstudiantesPage;
