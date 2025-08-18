import React, { useState, useEffect } from 'react';
import { useEvaluacionApi } from '../api/EvaluacionApi';
import { useAuth } from '../api/Auth';
import { FaUserGraduate, FaSave, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import toast from 'react-hot-toast';

const EvaluacionEstudiantesPage = () => {
  const { user } = useAuth();
  const evaluacionApi = useEvaluacionApi();
  
  const [estudiantes, setEstudiantes] = useState([]);
  const [racs, setRacs] = useState([]);
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
      const [estudiantesData, racsData] = await Promise.all([
        evaluacionApi.obtenerEstudiantes(),
        evaluacionApi.obtenerRACs()
      ]);
      
      setEstudiantes(estudiantesData);
      setRacs(racsData);
      
      // Inicializar evaluaciones con valores por defecto
      const evaluacionesIniciales = {};
      racsData.forEach(rac => {
        evaluacionesIniciales[rac.id] = '';
      });
      setEvaluaciones(evaluacionesIniciales);
      
    } catch (error) {
      toast.error('Error al cargar los datos: ' + error.message);
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

    const estudiante = estudiantes.find(e => e.id === parseInt(estudianteId));
    setEstudianteSeleccionado(estudiante);

    try {
      // Cargar evaluaciones existentes del estudiante
      const evaluacionesExistentes = await evaluacionApi.obtenerEvaluacionesEstudiante(estudianteId);
      
      // Crear objeto de evaluaciones con valores existentes o vacíos
      const nuevasEvaluaciones = {};
      racs.forEach(rac => {
        const evaluacionExistente = evaluacionesExistentes.find(e => e.rac_id === rac.id);
        nuevasEvaluaciones[rac.id] = evaluacionExistente ? evaluacionExistente.puntaje.toString() : '';
      });
      
      setEvaluaciones(nuevasEvaluaciones);
    } catch (error) {
      toast.error('Error al cargar evaluaciones del estudiante: ' + error.message);
    }
  };

  const handlePuntajeChange = (racId, valor) => {
    // Validar que el valor esté entre 0.0 y 5.0
    const numValor = parseFloat(valor);
    if (valor === '' || (numValor >= 0.0 && numValor <= 5.0)) {
      setEvaluaciones(prev => ({
        ...prev,
        [racId]: valor
      }));
    }
  };

  const validarEvaluaciones = () => {
    const evaluacionesVacias = Object.values(evaluaciones).filter(valor => valor === '').length;
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
      const evaluacionesParaGuardar = racs.map(rac => ({
        rac_id: rac.id,
        puntaje: parseFloat(evaluaciones[rac.id])
      }));

      await evaluacionApi.crearEvaluacionesMasivas(estudianteSeleccionado.id, evaluacionesParaGuardar);
      
      toast.success('Evaluaciones guardadas correctamente');
      
      // Recargar evaluaciones para mostrar datos actualizados
      await handleEstudianteChange(estudianteSeleccionado.id);
      
    } catch (error) {
      toast.error('Error al guardar evaluaciones: ' + error.message);
    } finally {
      setGuardando(false);
    }
  };

  const guardarEvaluacionIndividual = async (racId) => {
    const puntaje = evaluaciones[racId];
    if (!puntaje || puntaje === '') {
      toast.error('Debe ingresar un puntaje para este RAC');
      return;
    }

    try {
      await evaluacionApi.crearOActualizarEvaluacion(
        estudianteSeleccionado.id,
        racId,
        parseFloat(puntaje)
      );
      
      toast.success('Evaluación guardada correctamente');
    } catch (error) {
      toast.error('Error al guardar evaluación: ' + error.message);
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
              <h1 className="text-3xl font-bold text-gray-800">Evaluación de Estudiantes</h1>
              <p className="text-gray-600">Asigne calificaciones a los estudiantes para cada RAC</p>
            </div>
          </div>
          
          {/* Selector de Estudiante */}
          <div className="max-w-md">
            <label htmlFor="estudiante" className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar Estudiante
            </label>
            <select
              id="estudiante"
              value={estudianteSeleccionado?.id || ''}
              onChange={(e) => handleEstudianteChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Seleccione un estudiante --</option>
              {estudiantes.map(estudiante => (
                <option key={estudiante.id} value={estudiante.id}>
                  {estudiante.nombre} - {estudiante.grupo} ({estudiante.documento})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Formulario de Evaluación */}
        {estudianteSeleccionado && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                Evaluando: {estudianteSeleccionado.nombre}
              </h2>
              <p className="text-gray-600">
                Grupo: {estudianteSeleccionado.grupo} | Documento: {estudianteSeleccionado.documento}
              </p>
            </div>

            {/* Lista de RACs con campos de puntaje */}
            <div className="space-y-4">
              {racs.map(rac => (
                <div key={rac.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
                    {/* Descripción del RAC */}
                    <div className="lg:col-span-2">
                      <h3 className="font-semibold text-gray-800 mb-2">
                        RAC {rac.numero}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {rac.descripcion}
                      </p>
                    </div>

                    {/* Campo de Puntaje */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <label htmlFor={`puntaje-${rac.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                          Puntaje (0.0 - 5.0)
                        </label>
                        <input
                          type="number"
                          id={`puntaje-${rac.id}`}
                          min="0.0"
                          max="5.0"
                          step="0.1"
                          value={evaluaciones[rac.id] || ''}
                          onChange={(e) => handlePuntajeChange(rac.id, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.0"
                        />
                      </div>
                      
                      {/* Botón para guardar individual */}
                      <button
                        onClick={() => guardarEvaluacionIndividual(rac.id)}
                        disabled={!evaluaciones[rac.id] || evaluaciones[rac.id] === ''}
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

            {/* Botón para guardar todas las evaluaciones */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <FaExclamationTriangle className="inline w-4 h-4 mr-2 text-yellow-500" />
                  Complete todas las evaluaciones antes de guardar
                </div>
                
                <button
                  onClick={guardarEvaluaciones}
                  disabled={guardando || Object.values(evaluaciones).some(valor => valor === '')}
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

        {/* Mensaje cuando no hay estudiante seleccionado */}
        {!estudianteSeleccionado && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FaUserGraduate className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-600 mb-2">
              Seleccione un estudiante para comenzar
            </h3>
            <p className="text-gray-500">
              Use el selector de arriba para elegir el estudiante que desea evaluar
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EvaluacionEstudiantesPage;
