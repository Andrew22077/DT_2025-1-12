import React, { useState, useEffect } from "react";
import { useEvaluacionApi } from "../api/EvaluacionApi";
import { useAuth } from "../api/Auth";
import {
  FaChartBar,
  FaUsers,
  FaGraduationCap,
  FaCheckCircle,
  FaChalkboardTeacher,
  FaEye,
  FaCircle,
  FaDownload,
} from "react-icons/fa";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
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

  // Nuevos estados para las nuevas funcionalidades
  const [gacsSemestre, setGacsSemestre] = useState(null);
  const [profesoresMaterias, setProfesoresMaterias] = useState(null);
  const [estudiantesProfesores, setEstudiantesProfesores] = useState(null);
  const [detalleProfesorMateria, setDetalleProfesorMateria] = useState(null);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  
  // Estados para funcionalidad de semestres en estudiantes
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState(null);
  const [resultadosEstudianteSemestre, setResultadosEstudianteSemestre] = useState(null);
  const [mostrarResultadosEstudiante, setMostrarResultadosEstudiante] = useState(false);

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

  const cargarDatosTab = async (tab) => {
    try {
      setLoading(true);
      switch (tab) {
        case "gac":
          const datosGAC = await evaluacionApi.obtenerInformesGACSemestre();
          setGacsSemestre(datosGAC);
          break;
        case "profesor":
          const datosProfesor =
            await evaluacionApi.obtenerInformesProfesorMateria();
          setProfesoresMaterias(datosProfesor);
          break;
        case "estudiante":
          const datosEstudiante =
            await evaluacionApi.obtenerInformesEstudianteProfesores();
          setEstudiantesProfesores(datosEstudiante);
          break;
        default:
          break;
      }
    } catch (error) {
      toast.error("Error al cargar datos: " + (error.message || error));
    } finally {
      setLoading(false);
    }
  };

  const cargarDetalleProfesorMateria = async (profesorId, materiaId) => {
    try {
      setLoading(true);
      const datos = await evaluacionApi.obtenerDetalleProfesorMateria(
        profesorId,
        materiaId
      );
      setDetalleProfesorMateria(datos);
      setMostrarDetalle(true);
    } catch (error) {
      toast.error("Error al cargar detalle: " + (error.message || error));
    } finally {
      setLoading(false);
    }
  };

  // Función para detectar si un estudiante pertenece a segundo semestre
  const esSegundoSemestre = (grupo) => {
    const gruposSegundoSemestre = ['2A', '2B', '2C'];
    return gruposSegundoSemestre.includes(grupo);
  };

  // Función para cargar resultados detallados de un estudiante
  const cargarResultadosEstudiante = async (estudiante) => {
    try {
      setLoading(true);
      setEstudianteSeleccionado(estudiante);
      
      // Si el estudiante pertenece a segundo semestre, usar la API por semestre
      if (esSegundoSemestre(estudiante.estudiante_grupo)) {
        const resultados = await evaluacionApi.obtenerResultadosEstudiantePorSemestre(
          estudiante.estudiante_id
        );
        setResultadosEstudianteSemestre(resultados);
      } else {
        // Para estudiantes de primer semestre, usar la API normal
        const resultados = await evaluacionApi.obtenerResultadosEstudiante(
          estudiante.estudiante_id
        );
        setResultadosEstudianteSemestre({
          estudiante: {
            id: estudiante.estudiante_id,
            nombre: estudiante.estudiante_nombre,
            grupo: estudiante.estudiante_grupo,
            documento: estudiante.documento || 'N/A',
            es_segundo_semestre: false
          },
          primer_semestre: resultados,
          segundo_semestre: {
            semestre: "Segundo Semestre",
            resumen_general: {
              promedio_general: 0,
              total_evaluaciones: 0,
              total_gacs_evaluados: 0,
              total_racs_evaluados: 0,
            },
            grafico_profesores: [],
            grafico_gacs: [],
            evaluaciones: [],
          }
        });
      }
      
      setMostrarResultadosEstudiante(true);
    } catch (error) {
      toast.error("Error al cargar resultados del estudiante: " + (error.message || error));
    } finally {
      setLoading(false);
    }
  };

  // Funciones para descargar PDFs
  const handleDescargarPDF = async (tipo) => {
    try {
      setLoading(true);
      switch (tipo) {
        case "general":
          await evaluacionApi.descargarPDFResumenGeneral();
          toast.success("PDF de resumen general descargado exitosamente");
          break;
        case "gac":
          await evaluacionApi.descargarPDFPorGAC();
          toast.success("PDF por GAC descargado exitosamente");
          break;
        case "profesor":
          await evaluacionApi.descargarPDFPorProfesor();
          toast.success("PDF por profesor descargado exitosamente");
          break;
        case "estudiante":
          await evaluacionApi.descargarPDFPorEstudiante();
          toast.success("PDF por estudiante descargado exitosamente");
          break;
        default:
          break;
      }
    } catch (error) {
      toast.error("Error al descargar PDF: " + (error.message || error));
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
              <BarChart data={datosSemestre.grafico_gacs || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="gac" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="promedio" fill="#10B981" />
              </BarChart>
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
                  onClick={() => {
                    setActiveTab(tab);
                    cargarDatosTab(tab);
                  }}
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
            {/* Botón de descarga PDF */}
            <div className="flex justify-end mb-4">
              <button
                onClick={() => {
                  console.log("Botón de descarga clickeado");
                  handleDescargarPDF("general");
                }}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <FaDownload />
                {loading ? "Generando..." : "Descargar PDF"}
              </button>
            </div>

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
          <div>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : gacsSemestre ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-semibold text-gray-800">
                    Promedios de GAC por Semestre
                  </h2>
                  <button
                    onClick={() => handleDescargarPDF("gac")}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    <FaDownload />
                    {loading ? "Generando..." : "Descargar PDF"}
                  </button>
                </div>

                {/* Gráfico comparativo */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    Comparación por Semestre
                  </h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={gacsSemestre.gacs_por_semestre}>
                      <XAxis dataKey="gac_numero" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="primer_semestre.promedio"
                        fill="#3B82F6"
                        name="Primer Semestre"
                      />
                      <Bar
                        dataKey="segundo_semestre.promedio"
                        fill="#10B981"
                        name="Segundo Semestre"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Tarjetas detalladas */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {gacsSemestre.gacs_por_semestre.map((gac) => (
                    <div
                      key={gac.gac_numero}
                      className="bg-white rounded-lg shadow-md p-6"
                    >
                      <div className="mb-4">
                        <h3 className="font-semibold text-gray-800 text-lg">
                          GAC {gac.gac_numero}
                        </h3>
                        <p className="text-gray-600 text-sm mt-1">
                          {gac.gac_descripcion}
                        </p>
                      </div>

                      <div className="space-y-3">
                        {/* Primer Semestre */}
                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                          <div>
                            <span className="text-sm font-medium text-blue-800">
                              Primer Semestre
                            </span>
                            <p className="text-xs text-blue-600">
                              Virtual 1, 1A, 1B, 1C
                            </p>
                          </div>
                          <div className="text-right">
                            <div
                              className={`text-xl font-bold ${getColorByPuntaje(
                                gac.primer_semestre.promedio
                              )}`}
                            >
                              {gac.primer_semestre.promedio.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {gac.primer_semestre.total_evaluaciones}{" "}
                              evaluaciones
                            </div>
                          </div>
                        </div>

                        {/* Segundo Semestre */}
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                          <div>
                            <span className="text-sm font-medium text-green-800">
                              Segundo Semestre
                            </span>
                            <p className="text-xs text-green-600">2A, 2B, 2C</p>
                          </div>
                          <div className="text-right">
                            <div
                              className={`text-xl font-bold ${getColorByPuntaje(
                                gac.segundo_semestre.promedio
                              )}`}
                            >
                              {gac.segundo_semestre.promedio.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {gac.segundo_semestre.total_evaluaciones}{" "}
                              evaluaciones
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No hay datos disponibles</p>
              </div>
            )}
          </div>
        )}

        {/* --- Tab por Profesor --- */}
        {activeTab === "profesor" && (
          <div>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : profesoresMaterias ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-semibold text-gray-800">
                    Promedios por Profesor y Materia
                  </h2>
                  <button
                    onClick={() => handleDescargarPDF("profesor")}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    <FaDownload />
                    {loading ? "Generando..." : "Descargar PDF"}
                  </button>
                </div>

                {/* Modal de detalle */}
                {mostrarDetalle && detalleProfesorMateria && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold">
                          {detalleProfesorMateria.profesor_nombre} -{" "}
                          {detalleProfesorMateria.materia_nombre}
                        </h3>
                        <button
                          onClick={() => setMostrarDetalle(false)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="min-w-full table-auto">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="px-4 py-2 text-left">
                                Estudiante
                              </th>
                              <th className="px-4 py-2 text-left">Grupo</th>
                              <th className="px-4 py-2 text-left">Promedio</th>
                              <th className="px-4 py-2 text-left">
                                Evaluaciones
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {detalleProfesorMateria.estudiantes.map(
                              (estudiante, index) => (
                                <tr key={index} className="border-b">
                                  <td className="px-4 py-2">
                                    {estudiante.estudiante_nombre}
                                  </td>
                                  <td className="px-4 py-2">
                                    {estudiante.estudiante_grupo}
                                  </td>
                                  <td className="px-4 py-2">
                                    <span
                                      className={`font-semibold ${getColorByPuntaje(
                                        estudiante.promedio
                                      )}`}
                                    >
                                      {estudiante.promedio}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2">
                                    {estudiante.total_evaluaciones}
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Lista de profesores y materias */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {profesoresMaterias.profesores_materias.map((item, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() =>
                        cargarDetalleProfesorMateria(
                          item.profesor_id,
                          item.materia_id
                        )
                      }
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-800 text-lg">
                            {item.profesor_nombre}
                          </h3>
                          <p className="text-gray-600 text-sm">
                            {item.materia_nombre}
                          </p>
                        </div>
                        <FaEye className="text-gray-400 hover:text-gray-600" />
                      </div>

                      <div className="space-y-3">
                        {/* Promedio */}
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-600">
                            Promedio:
                          </span>
                          <span
                            className={`text-xl font-bold ${getColorByPuntaje(
                              item.promedio
                            )}`}
                          >
                            {item.promedio}
                          </span>
                        </div>

                        {/* Semaforización */}
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-600">
                            Progreso:
                          </span>
                          <div className="flex items-center space-x-2">
                            <FaCircle
                              className={`text-sm ${
                                item.color_semaforo === "rojo"
                                  ? "text-red-500"
                                  : item.color_semaforo === "amarillo"
                                  ? "text-yellow-500"
                                  : "text-green-500"
                              }`}
                            />
                            <span className="text-sm font-medium">
                              {item.porcentaje_evaluacion}%
                            </span>
                          </div>
                        </div>

                        {/* Estadísticas */}
                        <div className="text-xs text-gray-500 space-y-1">
                          <div className="flex justify-between">
                            <span>Evaluados:</span>
                            <span>{item.estudiantes_evaluados}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total:</span>
                            <span>{item.total_estudiantes}</span>
                          </div>
                        </div>

                        {/* Barra de progreso */}
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              item.color_semaforo === "rojo"
                                ? "bg-red-500"
                                : item.color_semaforo === "amarillo"
                                ? "bg-yellow-500"
                                : "bg-green-500"
                            }`}
                            style={{ width: `${item.porcentaje_evaluacion}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No hay datos disponibles</p>
              </div>
            )}
          </div>
        )}

        {/* --- Tab por Estudiante --- */}
        {activeTab === "estudiante" && (
          <div>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : estudiantesProfesores ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-semibold text-gray-800">
                    Promedios por Estudiante y Profesores Evaluadores
                  </h2>
                  <button
                    onClick={() => handleDescargarPDF("estudiante")}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    <FaDownload />
                    {loading ? "Generando..." : "Descargar PDF"}
                  </button>
                </div>

                {/* Gráfico de barras */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    Distribución de Promedios
                  </h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={estudiantesProfesores.estudiantes_profesores.slice(
                        0,
                        20
                      )}
                    >
                      <XAxis
                        dataKey="estudiante_nombre"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="promedio" fill="#F59E0B" name="Promedio" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Tabla de estudiantes */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Lista de Estudiantes
                    </h3>
                  </div>

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
                            Promedio
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Evaluaciones
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Profesores Evaluadores
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {estudiantesProfesores.estudiantes_profesores.map(
                          (estudiante, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {estudiante.estudiante_nombre}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {estudiante.estudiante_grupo}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`text-lg font-bold ${getColorByPuntaje(
                                    estudiante.promedio
                                  )}`}
                                >
                                  {estudiante.promedio}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {estudiante.total_evaluaciones}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-1">
                                  {estudiante.profesores_evaluadores.map(
                                    (profesor, profIndex) => (
                                      <span
                                        key={profIndex}
                                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                                      >
                                        {profesor}
                                      </span>
                                    )
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex flex-col gap-2">
                                  <button
                                    onClick={() => cargarResultadosEstudiante(estudiante)}
                                    className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                                  >
                                    <FaEye className="w-4 h-4" />
                                    Ver Detalles
                                  </button>
                                  {esSegundoSemestre(estudiante.estudiante_grupo) && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      📚 2do Semestre
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Resumen estadístico */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <FaUsers className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">
                          Total Estudiantes
                        </p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {estudiantesProfesores.estudiantes_profesores.length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <FaChartBar className="h-8 w-8 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">
                          Promedio General
                        </p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {estudiantesProfesores.estudiantes_profesores.length >
                          0
                            ? (
                                estudiantesProfesores.estudiantes_profesores.reduce(
                                  (sum, e) => sum + e.promedio,
                                  0
                                ) /
                                estudiantesProfesores.estudiantes_profesores
                                  .length
                              ).toFixed(2)
                            : "0.00"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <FaCheckCircle className="h-8 w-8 text-yellow-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">
                          Estudiantes Aprobados
                        </p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {
                            estudiantesProfesores.estudiantes_profesores.filter(
                              (e) => e.promedio >= 3.0
                            ).length
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No hay datos disponibles</p>
              </div>
            )}
          </div>
        )}

        {/* Modal de resultados detallados del estudiante */}
        {mostrarResultadosEstudiante && resultadosEstudianteSemestre && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-7xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-semibold text-gray-800">
                    {resultadosEstudianteSemestre.estudiante.nombre}
                  </h3>
                  <p className="text-gray-600">
                    Grupo: {resultadosEstudianteSemestre.estudiante.grupo} | Documento: {resultadosEstudianteSemestre.estudiante.documento}
                  </p>
                  {resultadosEstudianteSemestre.estudiante.es_segundo_semestre && (
                    <p className="text-sm text-blue-600 mt-1">
                      📚 Estudiante de segundo semestre - Mostrando resultados de ambos semestres
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setMostrarResultadosEstudiante(false);
                    setResultadosEstudianteSemestre(null);
                    setEstudianteSeleccionado(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Mostrar resultados por semestre si aplica */}
                {resultadosEstudianteSemestre.estudiante.es_segundo_semestre ? (
                  <div className="space-y-6">
                    {/* Resultados de Primer Semestre */}
                    {renderResultadosSemestre(
                      resultadosEstudianteSemestre.primer_semestre,
                      "Primer Semestre"
                    )}

                    {/* Resultados de Segundo Semestre */}
                    {renderResultadosSemestre(
                      resultadosEstudianteSemestre.segundo_semestre,
                      "Segundo Semestre"
                    )}
                  </div>
                ) : (
                  /* Mostrar resultados normales para estudiantes de primer semestre */
                  <div className="space-y-6">
                    {/* Información y resumen general */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-xl font-semibold text-gray-800">
                            Resumen General
                          </h4>
                        </div>
                        <div className="text-right">
                          <div
                            className={`text-3xl font-bold px-4 py-2 rounded-lg ${getColorByPuntaje(
                              resultadosEstudianteSemestre.primer_semestre.resumen_general.promedio_general || 0
                            )}`}
                          >
                            {resultadosEstudianteSemestre.primer_semestre.resumen_general.promedio_general?.toFixed(2) || "0.00"}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">Promedio General</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {resultadosEstudianteSemestre.primer_semestre.resumen_general.total_evaluaciones}
                          </div>
                          <div className="text-sm text-blue-800">
                            Total Evaluaciones
                          </div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {resultadosEstudianteSemestre.primer_semestre.resumen_general.total_gacs_evaluados}
                          </div>
                          <div className="text-sm text-green-800">GACs Evaluados</div>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {resultadosEstudianteSemestre.primer_semestre.resumen_general.total_racs_evaluados}
                          </div>
                          <div className="text-sm text-purple-800">RACs Evaluados</div>
                        </div>
                      </div>
                    </div>

                    {/* Gráficos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white rounded-lg shadow-md p-6">
                        <h4 className="text-lg font-semibold text-gray-800 mb-4">
                          Promedio por Profesor
                        </h4>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart
                            data={resultadosEstudianteSemestre.primer_semestre.grafico_profesores || []}
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
                        <h4 className="text-lg font-semibold text-gray-800 mb-4">
                          Promedio por GAC
                        </h4>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart
                            data={resultadosEstudianteSemestre.primer_semestre.grafico_gacs || []}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="gac" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="promedio" fill="#10B981" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Tabla de evaluaciones detalladas */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <h4 className="text-xl font-semibold text-gray-800 mb-4">
                        Evaluaciones Detalladas
                      </h4>
                      {resultadosEstudianteSemestre.primer_semestre.evaluaciones?.length > 0 ? (
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
                              {resultadosEstudianteSemestre.primer_semestre.evaluaciones.map(
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
                )}
              </div>
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
