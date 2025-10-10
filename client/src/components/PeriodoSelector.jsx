import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaChevronDown } from 'react-icons/fa';

/**
 * Componente para seleccionar períodos académicos
 */
const PeriodoSelector = ({ 
  periodos = [], 
  periodoSeleccionado = null, 
  onPeriodoChange = () => {},
  mostrarActual = true,
  className = ""
}) => {
  const [periodoActual, setPeriodoActual] = useState(null);
  const [loading, setLoading] = useState(false);

  // Cargar período actual al montar el componente
  useEffect(() => {
    if (mostrarActual && periodos.length === 0) {
      cargarPeriodoActual();
    }
  }, [mostrarActual, periodos]);

  const cargarPeriodoActual = async () => {
    try {
      setLoading(true);
      const response = await fetch('/competencias/api/periodos/actual/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPeriodoActual(data);
      }
    } catch (error) {
      console.error('Error cargando período actual:', error);
    } finally {
      setLoading(false);
    }
  };

  // Crear lista de períodos con el actual al inicio si es necesario
  const periodosParaMostrar = mostrarActual && periodoActual 
    ? [periodoActual, ...periodos.filter(p => p.id !== periodoActual.id)]
    : periodos;

  const handleChange = (event) => {
    const periodoId = event.target.value;
    if (periodoId) {
      const periodo = periodosParaMostrar.find(p => p.id === parseInt(periodoId));
      onPeriodoChange(periodo);
    } else {
      onPeriodoChange(null);
    }
  };

  const formatearPeriodo = (periodo) => {
    if (!periodo) return '';
    return `${periodo.codigo} - ${periodo.nombre}`;
  };

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <FaCalendarAlt className="text-gray-400" />
        <div className="animate-pulse bg-gray-200 h-8 w-48 rounded"></div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center space-x-2">
        <FaCalendarAlt className="text-blue-600" />
        <label className="text-sm font-medium text-gray-700">
          Período Académico:
        </label>
      </div>
      
      <div className="relative mt-1">
        <select
          value={periodoSeleccionado?.id || ''}
          onChange={handleChange}
          className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[200px]"
        >
          <option value="">
            {mostrarActual ? 'Seleccionar período...' : 'Todos los períodos'}
          </option>
          {periodosParaMostrar.map((periodo) => (
            <option key={periodo.id} value={periodo.id}>
              {formatearPeriodo(periodo)}
              {periodo.activo && ' (Actual)'}
            </option>
          ))}
        </select>
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <FaChevronDown className="h-4 w-4 text-gray-400" />
        </div>
      </div>

      {periodoSeleccionado && (
        <div className="mt-2 text-xs text-gray-600">
          <div className="flex justify-between">
            <span>Inicio:</span>
            <span>{new Date(periodoSeleccionado.fecha_inicio).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Fin:</span>
            <span>{new Date(periodoSeleccionado.fecha_fin).toLocaleDateString()}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PeriodoSelector;
