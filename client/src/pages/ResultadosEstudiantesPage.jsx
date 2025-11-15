import React, { useState, useEffect } from "react";
import { useEvaluacionApi } from "../api/EvaluacionApi";
import { useAuth } from "../api/Auth";
import {
  FaUserGraduate,
  FaChartBar,
  FaSearch,
  FaEye,
  FaUsers,
  FaDownload,
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
  ScatterChart,
  Scatter,
  LineChart,
  Line,
} from "recharts";
import { 
  getColorByPuntaje, 
  formatearCalificacion, 
  convertirCalificacionCualitativa,
  getSemaforoColor 
} from "../utils/gradeUtils";

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
  const GAC_LINE_COLORS = ["#F97316", "#10B981", "#EF4444"];
  const evolucionTopGacs = resultadosPorSemestre?.evolucion_top_gacs || [];

  // Función para generar datos del diagrama de dispersión de evolución
  const generarDatosEvolucion = (resultadosPorSemestre) => {
    if (!resultadosPorSemestre || !resultadosPorSemestre.primer_semestre || !resultadosPorSemestre.segundo_semestre) {
      return [];
    }

    const datos = [];
    
    // Agregar datos del primer semestre
    if (resultadosPorSemestre.primer_semestre.grafico_profesores) {
      resultadosPorSemestre.primer_semestre.grafico_profesores.forEach((profesor, index) => {
        datos.push({
          x: index + 1,
          y: profesor.promedio,
          semestre: 'Primer Semestre',
          profesor: profesor.profesor,
          evaluaciones: profesor.evaluaciones || 0,
          color: '#3B82F6' // Azul para primer semestre
        });
      });
    }

    // Agregar datos del segundo semestre
    if (resultadosPorSemestre.segundo_semestre.grafico_profesores) {
      resultadosPorSemestre.segundo_semestre.grafico_profesores.forEach((profesor, index) => {
        datos.push({
          x: index + 1,
          y: profesor.promedio,
          semestre: 'Segundo Semestre',
          profesor: profesor.profesor,
          evaluaciones: profesor.evaluaciones || 0,
          color: '#10B981' // Verde para segundo semestre
        });
      });
    }

    return datos;
  };

  // Función para generar datos de evolución temporal
  const generarDatosTemporal = (resultadosPorSemestre) => {
    if (!resultadosPorSemestre || !resultadosPorSemestre.primer_semestre || !resultadosPorSemestre.segundo_semestre) {
      return [];
    }

    const datos = [
      {
        semestre: '1er Semestre',
        promedio: resultadosPorSemestre.primer_semestre.promedio_general,
        evaluaciones: resultadosPorSemestre.primer_semestre.total_evaluaciones,
        estudiantes: resultadosPorSemestre.primer_semestre.total_estudiantes
      },
      {
        semestre: '2do Semestre',
        promedio: resultadosPorSemestre.segundo_semestre.promedio_general,
        evaluaciones: resultadosPorSemestre.segundo_semestre.total_evaluaciones,
        estudiantes: resultadosPorSemestre.segundo_semestre.total_estudiantes
      }
    ];

    return datos;
  };

  // Función para detectar si un estudiante pertenece a segundo semestre
  const esSegundoSemestre = (grupo) => {
    const gruposSegundoSemestre = ['2A', '2B', '2C'];
    return gruposSegundoSemestre.includes(grupo);
  };

  // Función para renderizar la tabla detallada de GACs por período
  const renderTablaGACsDetallada = (gacsDetallados) => {
    if (!gacsDetallados) return null;

    const primerSemestre = gacsDetallados.primer_semestre;
    const segundoSemestre = gacsDetallados.segundo_semestre;

    // Crear un mapa de GACs para facilitar la comparación
    const gacsMap = new Map();
    
    // Procesar GACs del primer semestre
    if (primerSemestre && primerSemestre.gacs) {
      primerSemestre.gacs.forEach(gac => {
        gacsMap.set(gac.numero, {
          numero: gac.numero,
          descripcion: gac.descripcion,
          primer_semestre: {
            promedio: gac.promedio,
            evaluaciones: gac.total_evaluaciones
          }
        });
      });
    }

    // Procesar GACs del segundo semestre
    if (segundoSemestre && segundoSemestre.gacs) {
      segundoSemestre.gacs.forEach(gac => {
        if (gacsMap.has(gac.numero)) {
          gacsMap.get(gac.numero).segundo_semestre = {
            promedio: gac.promedio,
            evaluaciones: gac.total_evaluaciones
          };
        } else {
          gacsMap.set(gac.numero, {
            numero: gac.numero,
            descripcion: gac.descripcion,
            segundo_semestre: {
              promedio: gac.promedio,
              evaluaciones: gac.total_evaluaciones
            }
          });
        }
      });
    }

    const gacsArray = Array.from(gacsMap.values()).sort((a, b) => a.numero - b.numero);

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                GAC
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descripción
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                {primerSemestre?.periodo || "Primer Semestre"}
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                {segundoSemestre?.periodo || "Segundo Semestre"}
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Diferencia
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Evolución
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {gacsArray.map((gac) => {
              const diferencia = (gac.segundo_semestre?.promedio || 0) - (gac.primer_semestre?.promedio || 0);
              const evolucion = diferencia > 0 ? "📈" : diferencia < 0 ? "📉" : "➡️";
              const colorEvolucion = diferencia > 0 ? "text-green-600" : diferencia < 0 ? "text-red-600" : "text-gray-600";

              return (
                <tr key={gac.numero} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    GAC {gac.numero}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {gac.descripcion}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {gac.primer_semestre ? (
                      <div>
                        <div className={`text-lg font-bold ${getColorByPuntaje(gac.primer_semestre.promedio)}`}>
                          {gac.primer_semestre.promedio.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          ({gac.primer_semestre.evaluaciones} eval.)
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {gac.segundo_semestre ? (
                      <div>
                        <div className={`text-lg font-bold ${getColorByPuntaje(gac.segundo_semestre.promedio)}`}>
                          {gac.segundo_semestre.promedio.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          ({gac.segundo_semestre.evaluaciones} eval.)
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {gac.primer_semestre && gac.segundo_semestre ? (
                      <div className={`text-lg font-bold ${colorEvolucion}`}>
                        {diferencia > 0 ? '+' : ''}{diferencia.toFixed(2)}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`text-2xl ${colorEvolucion}`}>
                      {evolucion}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
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

  const handleDescargarPDF = async () => {
    if (!estudianteSeleccionado) {
      toast.error("Por favor selecciona un estudiante primero");
      return;
    }

    try {
      await evaluacionApi.descargarPDFEstudianteIndividual(estudianteSeleccionado.id);
      toast.success("PDF descargado exitosamente");
    } catch (error) {
      toast.error("Error al descargar PDF: " + error.message);
    }
  };

  // Las funciones getColorByPuntaje ahora se importan desde gradeUtils.js
  
  const getColorByPuntajeIndividual = (puntaje) => {
    return getColorByPuntaje(puntaje);
  };

  const getEstadoEvaluacion = (puntaje) => {
    const cualitativa = convertirCalificacionCualitativa(puntaje);
    if (puntaje >= 3.5) {
      return { 
        texto: cualitativa, 
        color: "text-green-600", 
        bg: "bg-green-100" 
      };
    } else if (puntaje >= 3.0) {
      return { 
        texto: cualitativa, 
        color: "text-yellow-600", 
        bg: "bg-yellow-100" 
      };
    } else {
      return { 
        texto: cualitativa, 
        color: "text-red-600", 
        bg: "bg-red-100" 
      };
    }
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
              <div className="text-center">
                <div
                  className={`text-2xl font-bold px-4 py-2 rounded-lg ${getColorByPuntaje(
                    datosSemestre.resumen_general.promedio_general || 0
                  )}`}
                >
                  {datosSemestre.resumen_general.promedio_general?.toFixed(2) || "0.00"}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {convertirCalificacionCualitativa(datosSemestre.resumen_general.promedio_general || 0)}
                </div>
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
                <div className="flex gap-3">
                  <button
                    onClick={handleDescargarPDF}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <FaDownload className="w-4 h-4" />
                    Descargar PDF
                  </button>
                </div>
              </div>
            </div>

            {/* Mostrar resultados por semestre si aplica */}
            {resultadosPorSemestre ? (
              <div className="space-y-6">
                {/* Gráfico de Evolución entre Periodos */}
                {resultadosPorSemestre.evolucion_grafico && resultadosPorSemestre.evolucion_grafico.length > 0 && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                      📈 Evolución de Calificaciones por Período
                    </h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={resultadosPorSemestre.evolucion_grafico}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="periodo" 
                            name="Período"
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis 
                            domain={[0, 5]}
                            name="Promedio"
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip 
                            content={({ active, payload, label }) => {
                              if (!active || !payload || !payload.length) {
                                return null;
                              }
                              const punto = payload[0]?.payload || {};
                              return (
                                <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg text-xs sm:text-sm">
                                  <p className="font-semibold text-gray-800">{label}</p>
                                  <p className="text-gray-500 mb-2">Evaluaciones: {punto.evaluaciones || 0}</p>
                                  {payload.map((item) => (
                                    <div
                                      key={item.dataKey}
                                      className="flex items-center justify-between gap-6"
                                      style={{ color: item.stroke || "#111827" }}
                                    >
                                      <span>{item.name}</span>
                                      <span>
                                        {item.value !== null && item.value !== undefined
                                          ? Number(item.value).toFixed(2)
                                          : "Sin datos"}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              );
                            }}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="promedio" 
                            name="Promedio General"
                            stroke="#6366F1" 
                            strokeWidth={3}
                            dot={{ r: 6, fill: "#6366F1" }}
                            activeDot={{ r: 8, stroke: "#312E81", strokeWidth: 2 }}
                          />
                          {evolucionTopGacs.map((gac, index) => (
                            <Line
                              key={gac.key}
                              type="monotone"
                              dataKey={gac.key}
                              name={gac.label}
                              stroke={GAC_LINE_COLORS[index % GAC_LINE_COLORS.length]}
                              strokeWidth={2}
                              dot={{ r: 4 }}
                              activeDot={{ r: 6 }}
                              connectNulls
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Tabla Detallada de GACs por Período */}
                {resultadosPorSemestre.gacs_detallados && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                      📊 Calificaciones Detalladas por GAC por Período
                    </h3>
                    {renderTablaGACsDetallada(resultadosPorSemestre.gacs_detallados)}
                  </div>
                )}

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
                        <div className="text-center">
                          <div
                            className={`text-3xl font-bold px-4 py-2 rounded-lg ${getColorByPuntaje(
                              resultadosEstudiante.resumen_general.promedio_general || 0
                            )}`}
                          >
                            {resultadosEstudiante.resumen_general.promedio_general?.toFixed(
                              2
                            ) || "0.00"}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {convertirCalificacionCualitativa(resultadosEstudiante.resumen_general.promedio_general || 0)}
                          </div>
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
