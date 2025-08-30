import React, { useState, useEffect } from 'react';
import { useEvaluacionApi } from '../api/EvaluacionApi';
import { useAuth } from '../api/Auth';
import { FaChartBar, FaChartLine, FaChartPie, FaUsers, FaGraduationCap, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';

const Informes = () => {
  const { user } = useAuth();
  const evaluacionApi = useEvaluacionApi();
  
  const [estadisticasGenerales, setEstadisticasGenerales] = useState(null);
  const [estadisticasPorGAC, setEstadisticasPorGAC] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      const [generales, porGac] = await Promise.all([
        evaluacionApi.obtenerEstadisticasGenerales(),
        evaluacionApi.obtenerEstadisticasPorGAC()
      ]);
      
      setEstadisticasGenerales(generales);
      setEstadisticasPorGAC(porGac.estadisticas_por_gac || []);
      
    } catch (error) {
      toast.error('Error al cargar estadísticas: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getColorByPuntaje = (promedio) => {
    if (promedio >= 4.0) return 'text-green-600';
    if (promedio >= 3.0) return 'text-blue-600';
    if (promedio >= 2.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getColorByPorcentaje = (porcentaje) => {
    if (porcentaje >= 80) return 'text-green-600';
    if (porcentaje >= 60) return 'text-blue-600';
    if (porcentaje >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando estadísticas...</p>
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
            <FaChartBar className="text-3xl text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Informes y Estadísticas</h1>
              <p className="text-gray-600">Análisis detallado de las evaluaciones por GAC y generales</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('general')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'general'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FaChartPie className="inline w-4 h-4 mr-2" />
                Estadísticas Generales
              </button>
              <button
                onClick={() => setActiveTab('gac')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'gac'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FaChartBar className="inline w-4 h-4 mr-2" />
                Estadísticas por GAC
              </button>
            </nav>
          </div>
        </div>

        {/* Contenido de las tabs */}
        {activeTab === 'general' && estadisticasGenerales && (
          <div className="space-y-6">
            {/* Resumen General */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <FaChartPie className="text-blue-600" />
                Resumen General
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Evaluaciones */}
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    {estadisticasGenerales.resumen_general.total_evaluaciones}
                  </div>
                  <div className="text-sm text-blue-800">Total Evaluaciones</div>
                </div>

                {/* Total Estudiantes */}
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600 mb-2">
                    {estadisticasGenerales.resumen_general.total_estudiantes}
                  </div>
                  <div className="text-sm text-green-800">Estudiantes Evaluados</div>
                </div>

                {/* Promedio General */}
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className={`text-2xl font-bold mb-2 ${getColorByPuntaje(estadisticasGenerales.resumen_general.promedio_general)}`}>
                    {estadisticasGenerales.resumen_general.promedio_general.toFixed(2)}
                  </div>
                  <div className="text-sm text-purple-800">Promedio General</div>
                </div>

                {/* Porcentaje Aprobación */}
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <div className={`text-2xl font-bold mb-2 ${getColorByPorcentaje(estadisticasGenerales.resumen_general.porcentaje_aprobacion)}`}>
                    {estadisticasGenerales.resumen_general.porcentaje_aprobacion.toFixed(1)}%
                  </div>
                  <div className="text-sm text-orange-800">Aprobación</div>
                </div>
              </div>

              {/* Gráfico de Aprobados vs Reprobados */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribución de Resultados</h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-600">Aprobados</span>
                      <span className="text-sm font-medium text-green-600">
                        {estadisticasGenerales.resumen_general.aprobadas}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-green-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${(estadisticasGenerales.resumen_general.aprobadas / estadisticasGenerales.resumen_general.total_evaluaciones) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-red-600">Reprobados</span>
                      <span className="text-sm font-medium text-red-600">
                        {estadisticasGenerales.resumen_general.reprobadas}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-red-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${(estadisticasGenerales.resumen_general.reprobadas / estadisticasGenerales.resumen_general.total_evaluaciones) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Top RACs */}
            {estadisticasGenerales.top_racs && estadisticasGenerales.top_racs.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                  <FaChartLine className="text-green-600" />
                  Top 5 RACs con Mejor Promedio
                </h2>
                
                <div className="space-y-4">
                  {estadisticasGenerales.top_racs.map((rac, index) => (
                    <div key={rac.numero} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                            index === 0 ? 'bg-yellow-500' : 
                            index === 1 ? 'bg-gray-400' : 
                            index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800">RAC {rac.numero}</h4>
                            <p className="text-sm text-gray-600">{rac.descripcion}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${getColorByPuntaje(rac.promedio)}`}>
                            {rac.promedio.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {rac.total_evaluaciones} evaluaciones
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'gac' && (
          <div className="space-y-6">
            {/* Estadísticas por GAC */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <FaChartBar className="text-blue-600" />
                Estadísticas por GAC
              </h2>
              
              {estadisticasPorGAC.length > 0 ? (
                <div className="space-y-6">
                  {estadisticasPorGAC.map((gac) => (
                    <div key={gac.gac_numero} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-gray-800">
                          GAC {gac.gac_numero}
                        </h3>
                        <div className={`text-2xl font-bold ${getColorByPuntaje(gac.promedio)}`}>
                          {gac.promedio.toFixed(2)}
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mb-4">{gac.gac_descripcion}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-blue-50 rounded-lg p-3 text-center">
                          <div className="text-lg font-bold text-blue-600">{gac.total_evaluaciones}</div>
                          <div className="text-sm text-blue-800">Total Evaluaciones</div>
                        </div>
                        
                        <div className="bg-green-50 rounded-lg p-3 text-center">
                          <div className="text-lg font-bold text-green-600">{gac.aprobadas}</div>
                          <div className="text-sm text-green-800">Aprobadas</div>
                        </div>
                        
                        <div className="bg-red-50 rounded-lg p-3 text-center">
                          <div className="text-lg font-bold text-red-600">{gac.reprobadas}</div>
                          <div className="text-sm text-red-800">Reprobadas</div>
                        </div>
                      </div>
                      
                      {/* Barra de progreso de aprobación */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Porcentaje de Aprobación</span>
                          <span className={`text-sm font-bold ${getColorByPorcentaje(gac.porcentaje_aprobacion)}`}>
                            {gac.porcentaje_aprobacion.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-green-500 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${gac.porcentaje_aprobacion}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FaChartBar className="text-6xl text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-600 mb-2">
                    No hay estadísticas disponibles
                  </h3>
                  <p className="text-gray-500">
                    Las estadísticas por GAC aparecerán cuando se realicen evaluaciones
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Botón de actualización */}
        <div className="text-center">
          <button
            onClick={cargarEstadisticas}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2 mx-auto"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Actualizando...
              </>
            ) : (
              <>
                <FaChartBar className="w-4 h-4" />
                Actualizar Estadísticas
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Informes;

