import React, { useState, useEffect } from "react";
import { useEvaluacionApi } from "../api/EvaluacionApi";
import { useAuth } from "../api/Auth";
import {
  FaChartBar,
  FaUsers,
  FaGraduationCap,
  FaCheckCircle,
  FaChalkboardTeacher,
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

  const [resultadosGlobales, setResultadosGlobales] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [filtroEstudiante, setFiltroEstudiante] = useState("todos");
  const [filtroProfesor, setFiltroProfesor] = useState("todos");

  useEffect(() => {
    cargarResultados();
  }, []);

  const cargarResultados = async () => {
    try {
      setLoading(true);
      const datos = await evaluacionApi.obtenerResultadosGlobales();
      setResultadosGlobales(datos);
    } catch (error) {
      toast.error("Error al cargar resultados: " + (error.message || error));
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

  if (loading || !resultadosGlobales) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando resultados globales...</p>
        </div>
      </div>
    );
  }

  const {
    resumen_general = {},
    grafico_gacs = [],
    grafico_profesores = [],
    grafico_estudiantes = [],
    evaluaciones = [],
  } = resultadosGlobales;

  // Filtrar evaluaciones
  const evaluacionesFiltradas = evaluaciones.filter((e) => {
    if (filtroEstudiante !== "todos" && e.estudiante !== filtroEstudiante)
      return false;
    if (filtroProfesor !== "todos" && e.profesor !== filtroProfesor)
      return false;
    return true;
  });

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
                Visualización interactiva de estadísticas globales
              </p>
            </div>
          </div>
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                ["general", "Resumen General"],
                ["gac", "Por GAC"],
                ["profesor", "Por Profesor"],
                ["estudiante", "Por Estudiante"],
              ].map(([tab, label]) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* --- Tab General --- */}
        {activeTab === "general" && (
          <div className="space-y-6">
            {/* Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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
                <div className="text-sm text-green-800">Estudiantes</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-6 text-center shadow-md">
                <FaChalkboardTeacher className="text-3xl text-yellow-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-yellow-600">
                  {resumen_general.total_profesores}
                </div>
                <div className="text-sm text-yellow-800">Profesores</div>
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
                <div className="text-2xl font-bold text-orange-600">
                  {resumen_general.total_gacs_evaluados}
                </div>
                <div className="text-sm text-orange-800">GACs Evaluados</div>
              </div>
            </div>

            {/* Gráfico comparativo GACs */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Promedio por GAC
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={grafico_gacs}>
                  <XAxis dataKey="gac" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="promedio" fill="#3B82F6" name="Promedio" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* --- Tab por GAC --- */}
        {activeTab === "gac" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {grafico_gacs.map((gac) => (
              <div key={gac.gac} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">{gac.gac}</h3>
                  <div
                    className={`text-2xl font-bold ${getColorByPuntaje(
                      gac.promedio
                    )}`}
                  >
                    {gac.promedio.toFixed(2)}
                  </div>
                </div>
                <p className="text-gray-600 mb-4">{gac.descripcion}</p>
              </div>
            ))}
          </div>
        )}

        {/* --- Tab por Profesor --- */}
        {activeTab === "profesor" && (
          <div>
            <div className="mb-4">
              <label className="mr-2 font-medium">Filtrar por profesor:</label>
              <select
                value={filtroProfesor}
                onChange={(e) => setFiltroProfesor(e.target.value)}
                className="border rounded p-1"
              >
                <option value="todos">Todos</option>
                {grafico_profesores.map((p) => (
                  <option key={p.profesor} value={p.profesor}>
                    {p.profesor}
                  </option>
                ))}
              </select>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Promedio por Profesor
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={
                    filtroProfesor === "todos"
                      ? grafico_profesores
                      : grafico_profesores.filter(
                          (p) => p.profesor === filtroProfesor
                        )
                  }
                >
                  <XAxis dataKey="profesor" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="promedio" fill="#10B981" name="Promedio" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* --- Tab por Estudiante --- */}
        {activeTab === "estudiante" && (
          <div>
            <div className="mb-4">
              <label className="mr-2 font-medium">
                Filtrar por estudiante:
              </label>
              <select
                value={filtroEstudiante}
                onChange={(e) => setFiltroEstudiante(e.target.value)}
                className="border rounded p-1"
              >
                <option value="todos">Todos</option>
                {grafico_estudiantes.map((e) => (
                  <option key={e.estudiante} value={e.estudiante}>
                    {e.estudiante}
                  </option>
                ))}
              </select>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Promedio por Estudiante
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={
                    filtroEstudiante === "todos"
                      ? grafico_estudiantes
                      : grafico_estudiantes.filter(
                          (e) => e.estudiante === filtroEstudiante
                        )
                  }
                >
                  <XAxis dataKey="estudiante" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="promedio" fill="#F59E0B" name="Promedio" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="text-center mt-8">
          <button
            onClick={cargarResultados}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Actualizando..." : "Actualizar Datos"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Informes;
