import React from 'react';
import { FaCircle } from 'react-icons/fa';
import { 
  formatearCalificacion, 
  convertirCalificacionCualitativa,
  getColorByPuntaje,
  getSemaforoColor,
  obtenerResumenCalificacion
} from '../utils/gradeUtils';

/**
 * Componente para mostrar calificaciones con información cualitativa y semáforización
 */
const GradeDisplay = ({ calificacion, mostrarDetalle = false, size = 'normal' }) => {
  if (typeof calificacion !== 'number' || isNaN(calificacion)) {
    return (
      <div className="text-gray-500 text-sm">
        Sin calificar
      </div>
    );
  }

  const resumen = obtenerResumenCalificacion(calificacion);
  
  const sizeClasses = {
    small: 'text-sm',
    normal: 'text-base',
    large: 'text-lg',
    xlarge: 'text-xl'
  };

  const textSizeClass = sizeClasses[size] || sizeClasses.normal;

  if (mostrarDetalle) {
    return (
      <div className="text-center">
        <div className={`font-bold ${textSizeClass} ${resumen.clase}`}>
          {calificacion.toFixed(2)}
        </div>
        <div className="text-xs text-gray-600 mt-1">
          {resumen.cualitativa}
        </div>
        <div className="flex items-center justify-center mt-1">
          <FaCircle 
            className={`text-xs mr-1 ${
              resumen.color === 'red' 
                ? 'text-red-500' 
                : resumen.color === 'yellow' 
                ? 'text-yellow-500' 
                : 'text-green-500'
            }`} 
          />
          <span className="text-xs text-gray-600">
            {resumen.descripcion}
          </span>
        </div>
        {!resumen.aprobada && (
          <div className="text-xs text-red-600 mt-1 font-medium">
            No aprobado
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <div className={`font-bold ${textSizeClass} ${resumen.clase}`}>
        {calificacion.toFixed(2)}
      </div>
      <FaCircle 
        className={`text-sm ${
          resumen.color === 'red' 
            ? 'text-red-500' 
            : resumen.color === 'yellow' 
            ? 'text-yellow-500' 
            : 'text-green-500'
        }`} 
      />
    </div>
  );
};

/**
 * Componente para mostrar una tabla de ejemplos de calificaciones
 */
export const GradeExamplesTable = () => {
  const ejemplos = [0.0, 1.0, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        📊 Escala de Calificaciones - Universidad El Bosque
      </h3>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Calificación Numérica
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Calificación Cualitativa
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Semáforo
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {ejemplos.map((calificacion) => {
              const resumen = obtenerResumenCalificacion(calificacion);
              return (
                <tr key={calificacion} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {calificacion.toFixed(1)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`text-sm font-medium ${resumen.clase}`}>
                      {resumen.cualitativa}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      resumen.aprobada 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {resumen.aprobada ? 'Aprobado' : 'No Aprobado'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <FaCircle 
                        className={`text-sm mr-2 ${
                          resumen.color === 'red' 
                            ? 'text-red-500' 
                            : resumen.color === 'yellow' 
                            ? 'text-yellow-500' 
                            : 'text-green-500'
                        }`} 
                      />
                      <span className="text-sm text-gray-600 capitalize">
                        {resumen.semaforo}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-center">
          <FaCircle className="text-green-500 mr-2" />
          <span className="text-sm text-blue-800">
            <strong>Verde:</strong> Excelente rendimiento (4.0 - 5.0)
          </span>
        </div>
        <div className="flex items-center mt-1">
          <FaCircle className="text-yellow-500 mr-2" />
          <span className="text-sm text-blue-800">
            <strong>Amarillo:</strong> Rendimiento aceptable (3.0 - 3.9)
          </span>
        </div>
        <div className="flex items-center mt-1">
          <FaCircle className="text-red-500 mr-2" />
          <span className="text-sm text-blue-800">
            <strong>Rojo:</strong> Rendimiento deficiente (0.0 - 2.9)
          </span>
        </div>
      </div>
    </div>
  );
};

export default GradeDisplay;
