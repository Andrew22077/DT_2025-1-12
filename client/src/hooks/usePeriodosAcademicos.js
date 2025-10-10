import { useState, useEffect } from 'react';

/**
 * Hook personalizado para manejar períodos académicos
 */
export const usePeriodosAcademicos = () => {
  const [periodos, setPeriodos] = useState([]);
  const [periodoActual, setPeriodoActual] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar todos los períodos académicos
  const cargarPeriodos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/periodos/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar períodos académicos');
      }

      const data = await response.json();
      setPeriodos(data);
      
      // Encontrar el período actual
      const actual = data.find(p => p.activo);
      setPeriodoActual(actual);
      
    } catch (err) {
      setError(err.message);
      console.error('Error cargando períodos:', err);
    } finally {
      setLoading(false);
    }
  };

  // Cargar período actual específicamente
  const cargarPeriodoActual = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/periodos/actual/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar período actual');
      }

      const data = await response.json();
      setPeriodoActual(data);
      
    } catch (err) {
      setError(err.message);
      console.error('Error cargando período actual:', err);
    } finally {
      setLoading(false);
    }
  };

  // Crear nuevo período académico
  const crearPeriodo = async (datosPeriodo) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/periodos/crear/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datosPeriodo)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear período académico');
      }

      const nuevoPeriodo = await response.json();
      
      // Actualizar la lista de períodos
      setPeriodos(prev => [nuevoPeriodo, ...prev]);
      
      // Si es el período actual, actualizarlo
      if (nuevoPeriodo.activo) {
        setPeriodoActual(nuevoPeriodo);
      }
      
      return nuevoPeriodo;
      
    } catch (err) {
      setError(err.message);
      console.error('Error creando período:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Obtener período por ID
  const getPeriodoById = (id) => {
    return periodos.find(p => p.id === id);
  };

  // Formatear período para mostrar
  const formatearPeriodo = (periodo) => {
    if (!periodo) return '';
    return `${periodo.codigo} - ${periodo.nombre}`;
  };

  // Verificar si un período es el actual
  const esPeriodoActual = (periodo) => {
    return periodo && periodo.activo;
  };

  // Cargar períodos al montar el hook
  useEffect(() => {
    cargarPeriodos();
  }, []);

  return {
    periodos,
    periodoActual,
    loading,
    error,
    cargarPeriodos,
    cargarPeriodoActual,
    crearPeriodo,
    getPeriodoById,
    formatearPeriodo,
    esPeriodoActual
  };
};

export default usePeriodosAcademicos;
