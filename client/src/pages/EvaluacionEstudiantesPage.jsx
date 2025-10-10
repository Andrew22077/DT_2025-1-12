import React, { useState, useEffect } from "react";
import { useEvaluacionApi } from "../api/EvaluacionApi";
import { useAuth } from "../api/Auth";
import {
  FaUserGraduate,
  FaSave,
  FaCheck,
  FaExclamationTriangle,
  FaRandom,
} from "react-icons/fa";
import toast from "react-hot-toast";
import { convertirCalificacionCualitativa } from "../utils/gradeUtils";

const EvaluacionEstudiantesPage = () => {
  const { user } = useAuth();
  const evaluacionApi = useEvaluacionApi();

  const [estudiantes, setEstudiantes] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [materiaSeleccionada, setMateriaSeleccionada] = useState(null);
  const [racsPorGac, setRacsPorGac] = useState({});
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState(null);
  const [evaluaciones, setEvaluaciones] = useState({});
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [estudiantesData, materiasData] = await Promise.all([
        evaluacionApi.obtenerEstudiantes(),
        evaluacionApi.obtenerMateriasProfesor(),
      ]);

      setEstudiantes(estudiantesData);
      setMaterias(materiasData.materias);
    } catch (error) {
      toast.error("Error al cargar los datos: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMateriaChange = async (materiaId) => {
    if (!materiaId) {
      setMateriaSeleccionada(null);
      setRacsPorGac({});
      setEvaluaciones({});
      return;
    }

    try {
      setLoading(true);
      const materia = materias.find((m) => m.id === parseInt(materiaId));
      setMateriaSeleccionada(materia);

      // Obtener GACs y RACs para esta materia
      const gacsData = await evaluacionApi.obtenerGACsPorMateria(materiaId);

      // Convertir la estructura de datos para que sea compatible con el resto del código
      const racsPorGacData = {};
      gacsData.gacs.forEach((gac) => {
        racsPorGacData[gac.gac_numero] = gac.racs;
      });

      setRacsPorGac(racsPorGacData);

      // Inicializar evaluaciones con valores por defecto
      const evaluacionesIniciales = {};
      Object.values(racsPorGacData).forEach((racsGac) => {
        racsGac.forEach((rac) => {
          evaluacionesIniciales[rac.id] = "";
        });
      });
      setEvaluaciones(evaluacionesIniciales);
    } catch (error) {
      toast.error("Error al cargar los GACs de la materia: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEstudianteChange = async (estudianteId) => {
    if (!estudianteId) {
      setEstudianteSeleccionado(null);
      setEvaluaciones({});
      return;
    }

    const estudiante = estudiantes.find((e) => e.id === parseInt(estudianteId));
    setEstudianteSeleccionado(estudiante);

    // Si no hay materia seleccionada, no cargar evaluaciones
    if (!materiaSeleccionada) {
      return;
    }

    try {
      // Cargar evaluaciones existentes del estudiante
      const evaluacionesExistentes =
        await evaluacionApi.obtenerEvaluacionesEstudiante(estudianteId);

      // Crear objeto de evaluaciones con valores existentes o vacíos
      const nuevasEvaluaciones = {};
      Object.values(racsPorGac).forEach((racsGac) => {
        racsGac.forEach((rac) => {
          const evaluacionExistente = evaluacionesExistentes.find(
            (e) => e.rac_id === rac.id
          );
          nuevasEvaluaciones[rac.id] = evaluacionExistente
            ? evaluacionExistente.puntaje.toString()
            : "";
        });
      });

      setEvaluaciones(nuevasEvaluaciones);
    } catch (error) {
      toast.error(
        "Error al cargar evaluaciones del estudiante: " + error.message
      );
    }
  };

  const handlePuntajeChange = (racId, valor) => {
    // Validar que el valor esté entre 1 y 5
    const numValor = parseInt(valor);
    if (valor === "" || (numValor >= 1 && numValor <= 5)) {
      setEvaluaciones((prev) => ({
        ...prev,
        [racId]: valor,
      }));
    }
  };

  const validarEvaluaciones = () => {
    const evaluacionesVacias = Object.values(evaluaciones).filter(
      (valor) => valor === ""
    ).length;
    if (evaluacionesVacias > 0) {
      toast.error(`Faltan ${evaluacionesVacias} evaluaciones por completar`);
      return false;
    }
    return true;
  };

  const guardarEvaluaciones = async () => {
    if (!validarEvaluaciones()) return;

    try {
      setGuardando(true);

      // Preparar datos para envío masivo
      const evaluacionesParaGuardar = [];
      Object.values(racsPorGac).forEach((racsGac) => {
        racsGac.forEach((rac) => {
          if (evaluaciones[rac.id]) {
            evaluacionesParaGuardar.push({
              rac_id: rac.id,
              puntaje: parseInt(evaluaciones[rac.id]),
            });
          }
        });
      });

      await evaluacionApi.crearEvaluacionesMasivas(
        estudianteSeleccionado.id,
        evaluacionesParaGuardar
      );

      toast.success("Evaluaciones guardadas correctamente");

      // Recargar evaluaciones para mostrar datos actualizados
      await handleEstudianteChange(estudianteSeleccionado.id);
    } catch (error) {
      toast.error("Error al guardar evaluaciones: " + error.message);
    } finally {
      setGuardando(false);
    }
  };

  const guardarEvaluacionIndividual = async (racId) => {
    const puntaje = evaluaciones[racId];
    if (!puntaje || puntaje === "") {
      toast.error("Debe ingresar un puntaje para este RAC");
      return;
    }

    try {
      await evaluacionApi.crearOActualizarEvaluacion(
        estudianteSeleccionado.id,
        racId,
        parseInt(puntaje)
      );

      toast.success("Evaluación guardada correctamente");
    } catch (error) {
      toast.error("Error al guardar evaluación: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <FaUserGraduate className="text-3xl text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Evaluación de Estudiantes
              </h1>
              <p className="text-gray-600">
                Seleccione una materia para ver los GACs disponibles y evalúe a
                los estudiantes
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Selector de Materia */}
            <div>
              <label
                htmlFor="materia"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Seleccionar Materia
              </label>
              <select
                id="materia"
                value={materiaSeleccionada?.id || ""}
                onChange={(e) => handleMateriaChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- Seleccione una materia --</option>
                {materias.map((materia) => (
                  <option key={materia.id} value={materia.id}>
                    {materia.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Selector de Estudiante */}
            <div>
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
                disabled={!materiaSeleccionada}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">-- Seleccione un estudiante --</option>
                {estudiantes.map((estudiante) => (
                  <option key={estudiante.id} value={estudiante.id}>
                    {estudiante.nombre} - {estudiante.grupo} (
                    {estudiante.documento})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Formulario de Evaluación */}
        {estudianteSeleccionado && materiaSeleccionada && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                Evaluando: {estudianteSeleccionado.nombre}
              </h2>
              <p className="text-gray-600 mb-2">
                Grupo: {estudianteSeleccionado.grupo} | Documento:{" "}
                {estudianteSeleccionado.documento}
              </p>
              <p className="text-blue-600 font-medium">
                Materia: {materiaSeleccionada.nombre}
              </p>
            </div>

            {/* RACs organizados por GAC */}
            <div className="space-y-8">
              {Object.entries(racsPorGac).map(([gacNumero, racs]) => (
                <div
                  key={gacNumero}
                  className="border border-gray-200 rounded-lg p-6"
                >
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 bg-blue-50 p-3 rounded-md">
                    GAC {gacNumero} - {racs.length} RACs
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 pl-3">
                    {racs[0]?.gac_descripcion || "Descripción no disponible"}
                  </p>

                  <div className="space-y-4">
                    {racs.map((rac) => (
                      <div
                        key={rac.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
                          {/* Descripción del RAC */}
                          <div className="lg:col-span-2">
                            <h4 className="font-semibold text-gray-800 mb-2">
                              RAC {rac.numero}
                            </h4>
                            <p className="text-gray-600 text-sm leading-relaxed">
                              {rac.descripcion}
                            </p>
                          </div>

                          {/* Campo de Puntaje */}
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <label
                                htmlFor={`puntaje-${rac.id}`}
                                className="block text-sm font-medium text-gray-700 mb-1"
                              >
                                Puntaje
                              </label>
                              <select
                                id={`puntaje-${rac.id}`}
                                value={evaluaciones[rac.id] || ""}
                                onChange={(e) =>
                                  handlePuntajeChange(rac.id, e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="">-- Seleccione --</option>
                                <option value="0">0 - Reprobado</option>
                                <option value="1">1 - Deficiente</option>
                                <option value="2">2 - Deficiente</option>
                                <option value="3">3 - Insuficiente</option>
                                <option value="3.5">3.5 - Aprobado</option>
                                <option value="4">4 - Notable</option>
                                <option value="5">5 - Excelente</option>
                              </select>
                            </div>

                            {/* Botón para guardar individual */}
                            <button
                              onClick={() =>
                                guardarEvaluacionIndividual(rac.id)
                              }
                              disabled={
                                !evaluaciones[rac.id] ||
                                evaluaciones[rac.id] === ""
                              }
                              className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                              title="Guardar evaluación individual"
                            >
                              <FaCheck className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Botón para guardar todas las evaluaciones */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <FaExclamationTriangle className="inline w-4 h-4 mr-2 text-yellow-500" />
                  Complete todas las evaluaciones antes de guardar
                </div>

                <button
                  onClick={guardarEvaluaciones}
                  disabled={
                    guardando ||
                    Object.values(evaluaciones).some((valor) => valor === "")
                  }
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {guardando ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <FaSave className="w-4 h-4" />
                      Guardar Todas las Evaluaciones
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mensaje cuando no hay selección */}
        {(!estudianteSeleccionado || !materiaSeleccionada) && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FaUserGraduate className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-600 mb-2">
              {!materiaSeleccionada
                ? "Seleccione una materia para comenzar"
                : "Seleccione un estudiante para comenzar"}
            </h3>
            <p className="text-gray-500">
              {!materiaSeleccionada
                ? "Primero seleccione una materia para ver los GACs disponibles"
                : "Use el selector de arriba para elegir el estudiante que desea evaluar"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EvaluacionEstudiantesPage;
