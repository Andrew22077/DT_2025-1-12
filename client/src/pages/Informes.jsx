import React, { useState, useEffect } from "react";
import { useEvaluacionApi } from "../api/EvaluacionApi";
import { useAuth } from "../api/Auth";
import {
  FaChartBar,
  FaUsers,
  FaGraduationCap,
  FaCheckCircle,
} from "react-icons/fa";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import toast from "react-hot-toast";

const Informes = () => {
  const { user } = useAuth();
  const evaluacionApi = useEvaluacionApi();

  const [estadisticasGenerales, setEstadisticasGenerales] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [filtroEstudiante, setFiltroEstudiante] = useState("todos");

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      const datos = await evaluacionApi.obtenerEstadisticasGenerales();
      setEstadisticasGenerales(datos);
    } catch (error) {
      toast.error("Error al cargar estadísticas: " + (error.message || error));
    } finally {
      setLoading(false);
    }
  };

  const getColorByPuntaje = (promedio) => {
    if (promedio >= 4.0) return "text-green-600";
    if (promedio >= 3.0) return "text-blue-600";
    if (promedio >= 2.0) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading || !estadisticasGenerales) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  const {
    resumen_general = {},
    top_gacs = [],
    estudiantes = [],
  } = estadisticasGenerales;

  // Filtrar datos por estudiante si se selecciona
  const topGacsFiltrados =
    filtroEstudiante === "todos"
      ? top_gacs
      : top_gacs.map((gac) => ({
          ...gac,
          total_evaluaciones: gac.evaluaciones.filter(
            (e) => e.estudiante_id === filtroEstudiante
          ).length,
          aprobadas: gac.evaluaciones.filter(
            (e) => e.estudiante_id === filtroEstudiante && e.puntaje >= 3
          ).length,
          reprobadas: gac.evaluaciones.filter(
            (e) => e.estudiante_id === filtroEstudiante && e.puntaje < 3
          ).length,
        }));

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header y Tabs */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <FaChartBar className="text-3xl text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Dashboard de Evaluaciones BI
              </h1>
              <p className="text-gray-600">
                Visualización interactiva de estadísticas
              </p>
            </div>
          </div>
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("general")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "general"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Estadísticas Generales
              </button>
              <button
                onClick={() => setActiveTab("gac")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "gac"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Estadísticas por GAC
              </button>
            </nav>
          </div>
        </div>

        {/* Filtro por estudiante */}
        {activeTab === "gac" && (
          <div className="mb-4">
            <label className="mr-2 font-medium">Filtrar por estudiante:</label>
            <select
              value={filtroEstudiante}
              onChange={(e) => setFiltroEstudiante(e.target.value)}
              className="border rounded p-1"
            >
              <option value="todos">Todos</option>
              {estudiantes.map((est) => (
                <option key={est.id} value={est.id}>
                  {est.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Estadísticas Generales */}
        {activeTab === "general" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-blue-50 rounded-lg p-6 text-center shadow-md">
                <FaChartBar className="text-3xl text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">
                  {resumen_general.total_evaluaciones}
                </div>
                <div className="text-sm text-blue-800">Total Evaluaciones</div>
              </div>
              <div className="bg-green-50 rounded-lg p-6 text-center shadow-md">
                <FaUsers className="text-3xl text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">
                  {resumen_general.total_estudiantes}
                </div>
                <div className="text-sm text-green-800">
                  Estudiantes Evaluados
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-6 text-center shadow-md">
                <FaGraduationCap className="text-3xl text-purple-600 mx-auto mb-2" />
                <div
                  className={`text-2xl font-bold ${getColorByPuntaje(
                    resumen_general.promedio_general
                  )}`}
                >
                  {resumen_general.promedio_general.toFixed(2)}
                </div>
                <div className="text-sm text-purple-800">Promedio General</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-6 text-center shadow-md">
                <FaCheckCircle className="text-3xl text-orange-600 mx-auto mb-2" />
                <div
                  className={`text-2xl font-bold ${getColorByPuntaje(
                    resumen_general.porcentaje_aprobacion
                  )}`}
                >
                  {resumen_general.porcentaje_aprobacion.toFixed(1)}%
                </div>
                <div className="text-sm text-orange-800">Aprobación</div>
              </div>
            </div>

            {/* Gráfico de Aprobados vs Reprobados */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Resultados por categoría
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[resumen_general]}>
                  <XAxis dataKey="nombre" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="aprobadas" fill="#34D399" name="Aprobadas" />
                  <Bar dataKey="reprobadas" fill="#F87171" name="Reprobadas" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Estadísticas por GAC */}
        {activeTab === "gac" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topGacsFiltrados.map((gac) => (
              <div
                key={gac.gac_numero}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <div className="flex justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">
                    GAC {gac.gac_numero}
                  </h3>
                  <div
                    className={`text-2xl font-bold ${getColorByPuntaje(
                      gac.promedio
                    )}`}
                  >
                    {gac.promedio.toFixed(2)}
                  </div>
                </div>
                <p className="text-gray-600 mb-4">{gac.gac_descripcion}</p>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={[gac]}>
                    <XAxis dataKey="nombre" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="aprobadas" fill="#34D399" name="Aprobadas" />
                    <Bar
                      dataKey="reprobadas"
                      fill="#F87171"
                      name="Reprobadas"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-8">
          <button
            onClick={cargarEstadisticas}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Actualizando..." : "Actualizar Estadísticas"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Informes;
