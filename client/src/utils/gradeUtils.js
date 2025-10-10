/**
 * Utilidades para conversión de calificaciones numéricas a cualitativas
 * según la escala de la Universidad El Bosque
 */

/**
 * Convierte una calificación numérica a su equivalente cualitativo
 * según la escala de la Universidad El Bosque
 * @param {number} calificacion - La calificación numérica (0.0 - 5.0)
 * @returns {string} - La calificación cualitativa
 */
export const convertirCalificacionCualitativa = (calificacion) => {
  if (typeof calificacion !== 'number' || isNaN(calificacion)) {
    return 'Sin calificar';
  }

  // Redondear a 1 decimal para comparaciones más precisas
  const calificacionRedondeada = Math.round(calificacion * 10) / 10;

  if (calificacionRedondeada >= 5.0) {
    return 'Excelente';
  } else if (calificacionRedondeada >= 4.0) {
    return 'Notable';
  } else if (calificacionRedondeada >= 3.5) {
    return 'Aprobado';
  } else if (calificacionRedondeada >= 3.0) {
    return 'Insuficiente';
  } else if (calificacionRedondeada >= 1.0) {
    return 'Deficiente';
  } else {
    return 'Reprobado';
  }
};

/**
 * Obtiene el color de semáforización según la calificación
 * @param {number} calificacion - La calificación numérica (0.0 - 5.0)
 * @returns {object} - Objeto con información de color y estado
 */
export const obtenerColorSemaforizacion = (calificacion) => {
  if (typeof calificacion !== 'number' || isNaN(calificacion)) {
    return {
      color: 'gray',
      clase: 'text-gray-600 bg-gray-50',
      semaforo: 'gray',
      descripcion: 'Sin calificar'
    };
  }

  const calificacionRedondeada = Math.round(calificacion * 10) / 10;

  if (calificacionRedondeada >= 4.0) {
    // Verde: Excelente rendimiento
    return {
      color: 'green',
      clase: 'text-green-600 bg-green-50',
      semaforo: 'verde',
      descripcion: 'Excelente'
    };
  } else if (calificacionRedondeada >= 3.0) {
    // Amarillo: Rendimiento aceptable
    return {
      color: 'yellow',
      clase: 'text-yellow-600 bg-yellow-50',
      semaforo: 'amarillo',
      descripcion: 'Aceptable'
    };
  } else {
    // Rojo: Rendimiento deficiente
    return {
      color: 'red',
      clase: 'text-red-600 bg-red-50',
      semaforo: 'rojo',
      descripcion: 'Deficiente'
    };
  }
};

/**
 * Obtiene la clase CSS para el color de semáforización
 * @param {number} calificacion - La calificación numérica
 * @returns {string} - La clase CSS correspondiente
 */
export const getColorByPuntaje = (calificacion) => {
  return obtenerColorSemaforizacion(calificacion).clase;
};

/**
 * Obtiene el color del semáforo para iconos
 * @param {number} calificacion - La calificación numérica
 * @returns {string} - El color para iconos (red, yellow, green)
 */
export const getSemaforoColor = (calificacion) => {
  return obtenerColorSemaforizacion(calificacion).color;
};

/**
 * Formatea una calificación mostrando tanto el valor numérico como cualitativo
 * @param {number} calificacion - La calificación numérica
 * @param {boolean} mostrarNumerico - Si mostrar el valor numérico (default: true)
 * @param {boolean} mostrarCualitativo - Si mostrar el valor cualitativo (default: true)
 * @returns {string} - La calificación formateada
 */
export const formatearCalificacion = (calificacion, mostrarNumerico = true, mostrarCualitativo = true) => {
  if (typeof calificacion !== 'number' || isNaN(calificacion)) {
    return 'Sin calificar';
  }

  const cualitativa = convertirCalificacionCualitativa(calificacion);
  const numerica = calificacion.toFixed(2);

  if (mostrarNumerico && mostrarCualitativo) {
    return `${numerica} - ${cualitativa}`;
  } else if (mostrarNumerico) {
    return numerica;
  } else if (mostrarCualitativo) {
    return cualitativa;
  }

  return numerica;
};

/**
 * Verifica si una calificación está aprobada según la escala de la Universidad El Bosque
 * @param {number} calificacion - La calificación numérica
 * @returns {boolean} - True si está aprobada (>= 3.5), false en caso contrario
 */
export const esCalificacionAprobada = (calificacion) => {
  if (typeof calificacion !== 'number' || isNaN(calificacion)) {
    return false;
  }
  return calificacion >= 3.5;
};

/**
 * Obtiene un resumen completo de la calificación
 * @param {number} calificacion - La calificación numérica
 * @returns {object} - Objeto con toda la información de la calificación
 */
export const obtenerResumenCalificacion = (calificacion) => {
  const semaforizacion = obtenerColorSemaforizacion(calificacion);
  const cualitativa = convertirCalificacionCualitativa(calificacion);
  const aprobada = esCalificacionAprobada(calificacion);

  return {
    numerica: calificacion,
    cualitativa,
    aprobada,
    ...semaforizacion,
    formateada: formatearCalificacion(calificacion)
  };
};
