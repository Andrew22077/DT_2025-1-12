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
  const [resultadosPorEstudiante, setResultadosPorEstudiante] = useState({});
  const [cargandoResultados, setCargandoResultados] = useState({});
  
  // Estados para modal de detalles del estudiante
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState(null);

  useEffect(() => {
    cargarResultados();
  }, []);

  // Cargar resultados de estudiantes cuando cambie la pestaña activa
  useEffect(() => {
    console.log("useEffect activado:", { activeTab, estudiantesProfesores: !!estudiantesProfesores });
    if (activeTab === "estudiante" && estudiantesProfesores?.estudiantes_profesores) {
      console.log("Cargando resultados automáticamente...");
      cargarResultadosTodosEstudiantes();
    }
  }, [activeTab, estudiantesProfesores]);

  const cargarResultados = async () => {
    try {
      setLoading(true);
      console.log("Cargando resultados globales...");
      const datos = await evaluacionApi.obtenerResultadosGlobales();
      console.log("Resultados globales cargados:", datos);
      setResultadosGlobales(datos);
      setGacsSemestre(datos.gacs_semestre);
      setProfesoresMaterias(datos.profesores_materias);
      setEstudiantesProfesores(datos.estudiantes_profesores);
      console.log("Estudiantes profesores cargados:", datos.estudiantes_profesores);
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
          // Cargar resultados detallados de todos los estudiantes
          setTimeout(() => cargarResultadosTodosEstudiantes(), 100);
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
    const estudianteId = estudiante.estudiante_id;
    
    console.log(`Cargando resultados para estudiante ${estudianteId} (${estudiante.estudiante_nombre})`);
    
    // Si ya tenemos los resultados, no cargar de nuevo
    if (resultadosPorEstudiante[estudianteId]) {
      console.log(`Resultados ya cargados para estudiante ${estudianteId}`);
      return;
    }

    try {
      setCargandoResultados(prev => ({ ...prev, [estudianteId]: true }));
      
      let resultados;
      
      // Si el estudiante pertenece a segundo semestre, usar la API por semestre
      if (esSegundoSemestre(estudiante.estudiante_grupo)) {
        console.log(`Estudiante ${estudianteId} es de segundo semestre, usando API por semestre`);
        resultados = await evaluacionApi.obtenerResultadosEstudiantePorSemestre(estudianteId);
        console.log(`Resultados por semestre para ${estudianteId}:`, resultados);
      } else {
        console.log(`Estudiante ${estudianteId} es de primer semestre, usando API normal`);
        // Para estudiantes de primer semestre, usar la API normal
        const resultadosNormales = await evaluacionApi.obtenerResultadosEstudiante(estudianteId);
        console.log(`Resultados normales para ${estudianteId}:`, resultadosNormales);
        resultados = {
          estudiante: {
            id: estudianteId,
            nombre: estudiante.estudiante_nombre,
            grupo: estudiante.estudiante_grupo,
            documento: estudiante.documento || 'N/A',
            es_segundo_semestre: false
          },
          primer_semestre: resultadosNormales,
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
        };
      }
      
      console.log(`Guardando resultados para estudiante ${estudianteId}:`, resultados);
      setResultadosPorEstudiante(prev => ({
        ...prev,
        [estudianteId]: resultados
      }));
      
    } catch (error) {
      console.error(`Error al cargar resultados del estudiante ${estudianteId}:`, error);
      // No mostrar toast para evitar spam, solo log del error
    } finally {
      setCargandoResultados(prev => ({ ...prev, [estudianteId]: false }));
    }
  };

  // Función para cargar resultados de todos los estudiantes
  const cargarResultadosTodosEstudiantes = async () => {
    if (!estudiantesProfesores?.estudiantes_profesores) return;
    
    console.log("Cargando resultados para", estudiantesProfesores.estudiantes_profesores.length, "estudiantes");
    
    // Cargar resultados de todos los estudiantes en paralelo
    const promesas = estudiantesProfesores.estudiantes_profesores.map(estudiante => 
      cargarResultadosEstudiante(estudiante)
    );
    
    await Promise.allSettled(promesas);
    console.log("Resultados cargados:", resultadosPorEstudiante);
  };

  // Función para cargar resultados detallados de un estudiante seleccionado
  const cargarResultadosEstudianteSeleccionado = async (estudiante) => {
    try {
      setLoading(true);
      
      // Si el estudiante ya tiene datos de GAC, usarlos directamente
      if (estudiante.gacs) {
        setEstudianteSeleccionado(estudiante);
        return;
      }
      
      // Si no, cargar los datos del estudiante
      const estudianteId = estudiante.estudiante_id;
      let resultados;
      
      // Si el estudiante pertenece a segundo semestre, usar la API por semestre
      if (esSegundoSemestre(estudiante.estudiante_grupo)) {
        resultados = await evaluacionApi.obtenerResultadosEstudiantePorSemestre(estudianteId);
      } else {
        // Para estudiantes de primer semestre, usar la API normal
        const resultadosNormales = await evaluacionApi.obtenerResultadosEstudiante(estudianteId);
        resultados = {
          estudiante: {
            id: estudianteId,
            nombre: estudiante.estudiante_nombre,
            grupo: estudiante.estudiante_grupo,
            documento: estudiante.documento || 'N/A',
            es_segundo_semestre: false
          },
          primer_semestre: resultadosNormales,
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
        };
      }
      
      // Crear objeto con datos del estudiante y resultados
      const estudianteConResultados = {
        ...estudiante,
        resultados: resultados
      };
      
      setEstudianteSeleccionado(estudianteConResultados);
      
    } catch (error) {
      console.error(`Error al cargar resultados del estudiante:`, error);
      toast.error("Error al cargar detalles del estudiante");
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
          await evaluacionApi.descargarPDFEstudiantesPorSemestre();
          toast.success("PDF de estudiantes por semestre descargado exitosamente");
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

  // Función para renderizar resultados por semestre en la tabla
  const renderResultadosSemestreTabla = (estudiante) => {
    const estudianteId = estudiante.estudiante_id;
    const resultados = resultadosPorEstudiante[estudianteId];
    const cargando = cargandoResultados[estudianteId];

    console.log(`Renderizando para estudiante ${estudianteId}:`, { resultados, cargando });

    if (cargando) {
      return (
        <div className="flex items-center justify-center py-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-500">Cargando...</span>
        </div>
      );
    }

    if (!resultados) {
      return (
        <div className="text-sm text-gray-400">
          Sin datos (ID: {estudianteId})
        </div>
      );
    }

    const esSegundoSem = resultados.estudiante?.es_segundo_semestre || false;
    const primerSem = resultados.primer_semestre;
    const segundoSem = resultados.segundo_semestre;

    return (
      <div className="space-y-2">
        {/* Primer Semestre */}
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-blue-800">1er Semestre</span>
            <span className={`text-sm font-bold ${getColorByPuntaje(primerSem?.resumen_general?.promedio_general || 0)}`}>
              {primerSem?.resumen_general?.promedio_general?.toFixed(2) || "0.00"}
            </span>
          </div>
          <div className="text-xs text-blue-600">
            {primerSem?.resumen_general?.total_evaluaciones || 0} evaluaciones
          </div>
          {/* GACs del primer semestre */}
          {primerSem?.grafico_gacs && primerSem.grafico_gacs.length > 0 && (
            <div className="mt-2">
              <div className="text-xs text-blue-700 font-medium mb-1">GACs:</div>
              <div className="flex flex-wrap gap-1">
                {primerSem.grafico_gacs.slice(0, 3).map((gac, index) => (
                  <span key={index} className="text-xs bg-blue-200 text-blue-800 px-1 py-0.5 rounded">
                    {gac.gac}: {gac.promedio?.toFixed(1)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Segundo Semestre - solo si es estudiante de segundo semestre */}
        {esSegundoSem && (
          <div className="bg-green-50 rounded-lg p-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-green-800">2do Semestre</span>
              <span className={`text-sm font-bold ${getColorByPuntaje(segundoSem?.resumen_general?.promedio_general || 0)}`}>
                {segundoSem?.resumen_general?.promedio_general?.toFixed(2) || "0.00"}
              </span>
            </div>
            <div className="text-xs text-green-600">
              {segundoSem?.resumen_general?.total_evaluaciones || 0} evaluaciones
            </div>
            {/* GACs del segundo semestre */}
            {segundoSem?.grafico_gacs && segundoSem.grafico_gacs.length > 0 && (
              <div className="mt-2">
                <div className="text-xs text-green-700 font-medium mb-1">GACs:</div>
                <div className="flex flex-wrap gap-1">
                  {segundoSem.grafico_gacs.slice(0, 3).map((gac, index) => (
                    <span key={index} className="text-xs bg-green-200 text-green-800 px-1 py-0.5 rounded">
                      {gac.gac}: {gac.promedio?.toFixed(1)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
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
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
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
                          
                          {/* Materias del primer semestre */}
                          {gac.primer_semestre.materias && gac.primer_semestre.materias.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs font-medium text-blue-700 mb-2">
                                📚 Materias donde se desarrolla más:
                              </p>
                              <div className="space-y-1">
                                {gac.primer_semestre.materias.slice(0, 3).map((materia, index) => (
                                  <div key={index} className="flex justify-between items-center text-xs">
                                    <span className="text-blue-600 truncate">
                                      {materia.materia_nombre}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <span className={`font-bold ${getColorByPuntaje(materia.promedio)}`}>
                                        {materia.promedio}
                                      </span>
                                      <span className={`px-1 py-0.5 rounded text-xs ${
                                        materia.desarrollo === 'Excelente' ? 'bg-green-100 text-green-800' :
                                        materia.desarrollo === 'Bueno' ? 'bg-yellow-100 text-yellow-800' :
                                        materia.desarrollo === 'Regular' ? 'bg-orange-100 text-orange-800' :
                                        'bg-red-100 text-red-800'
                                      }`}>
                                        {materia.desarrollo}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Segundo Semestre */}
                        <div className="p-3 bg-green-50 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
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
                          
                          {/* Materias del segundo semestre */}
                          {gac.segundo_semestre.materias && gac.segundo_semestre.materias.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs font-medium text-green-700 mb-2">
                                📚 Materias donde se desarrolla más:
                              </p>
                              <div className="space-y-1">
                                {gac.segundo_semestre.materias.slice(0, 3).map((materia, index) => (
                                  <div key={index} className="flex justify-between items-center text-xs">
                                    <span className="text-green-600 truncate">
                                      {materia.materia_nombre}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <span className={`font-bold ${getColorByPuntaje(materia.promedio)}`}>
                                        {materia.promedio}
                                      </span>
                                      <span className={`px-1 py-0.5 rounded text-xs ${
                                        materia.desarrollo === 'Excelente' ? 'bg-green-100 text-green-800' :
                                        materia.desarrollo === 'Bueno' ? 'bg-yellow-100 text-yellow-800' :
                                        materia.desarrollo === 'Regular' ? 'bg-orange-100 text-orange-800' :
                                        'bg-red-100 text-red-800'
                                      }`}>
                                        {materia.desarrollo}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
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
                              <th className="px-4 py-2 text-left">
                                Acciones
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
                                  <td className="px-4 py-2">
                                    <button
                                      onClick={() => cargarResultadosEstudianteSeleccionado(estudiante)}
                                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                    >
                                      Ver Detalles
                                    </button>
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

                {/* Modal de detalles del estudiante */}
                {estudianteSeleccionado && estudianteSeleccionado.estudiante_nombre && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold">
                          Detalles de {estudianteSeleccionado.estudiante_nombre}
                        </h3>
                        <button
                          onClick={() => setEstudianteSeleccionado(null)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="space-y-6">
                        {/* Información general */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="text-lg font-semibold text-gray-800 mb-2">
                            📊 Información General
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Grupo:</p>
                              <p className="font-medium">{estudianteSeleccionado.estudiante_grupo}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Promedio General:</p>
                              <p className={`font-bold text-lg ${getColorByPuntaje(estudianteSeleccionado.promedio)}`}>
                                {estudianteSeleccionado.promedio}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Total Evaluaciones:</p>
                              <p className="font-medium">{estudianteSeleccionado.total_evaluaciones}</p>
                            </div>
                          </div>
                        </div>

                        {/* Evaluaciones detalladas */}
                        <div className="bg-white border rounded-lg p-4">
                          <h4 className="text-lg font-semibold text-gray-800 mb-3">
                            📝 Evaluaciones Detalladas
                          </h4>
                          <div className="space-y-3">
                            {estudianteSeleccionado.evaluaciones && estudianteSeleccionado.evaluaciones.map((evaluacion, index) => (
                              <div key={index} className="bg-gray-50 p-3 rounded-lg">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <p className="font-medium text-gray-800">
                                      RAC {evaluacion.rac_numero}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {evaluacion.rac_descripcion}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {new Date(evaluacion.fecha).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className={`text-lg font-bold ${getColorByPuntaje(evaluacion.puntaje)}`}>
                                      {evaluacion.puntaje}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Resultados por GAC */}
                        {estudianteSeleccionado.gacs && estudianteSeleccionado.gacs.length > 0 && (
                          <div className="bg-white border rounded-lg p-4">
                            <h4 className="text-lg font-semibold text-gray-800 mb-3">
                              🎯 Resultados por GAC
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {estudianteSeleccionado.gacs.map((gac, gacIndex) => (
                                <div key={gacIndex} className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <p className="font-medium text-blue-800">
                                        {gac.gac}
                                      </p>
                                      <p className="text-sm text-blue-600">
                                        {gac.descripcion}
                                      </p>
                                      <p className="text-xs text-blue-500">
                                        {gac.total_evaluaciones} evaluación(es)
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className={`text-lg font-bold ${getColorByPuntaje(gac.promedio)}`}>
                                        {gac.promedio}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
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
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        console.log("Forzando recarga de datos...");
                        setResultadosPorEstudiante({});
                        cargarResultadosTodosEstudiantes();
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      🔄 Recargar Datos
                    </button>
                    <button
                      onClick={() => handleDescargarPDF("estudiante")}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      <FaDownload />
                      {loading ? "Generando..." : "Descargar PDF"}
                    </button>
                  </div>
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
                            Resultados por Semestre
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
                              <td className="px-6 py-4">
                                {renderResultadosSemestreTabla(estudiante)}
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
