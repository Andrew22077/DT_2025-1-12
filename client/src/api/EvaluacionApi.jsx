import { useAuth } from "./Auth";

const API_BASE_URL = "http://localhost:8000/competencias";

export const useEvaluacionApi = () => {
  const { getAuthHeaders } = useAuth();

  const obtenerEstudiantes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/estudiantes/`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Error al obtener estudiantes");
      }

      return await response.json();
    } catch (error) {
      console.error("Error en obtenerEstudiantes:", error);
      throw error;
    }
  };

  const obtenerRACs = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/racs/`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Error al obtener RACs");
      }

      return await response.json();
    } catch (error) {
      console.error("Error en obtenerRACs:", error);
      throw error;
    }
  };

  const obtenerRACsAleatoriosPorGAC = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/racs/aleatorios-por-gac/`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error("Error al obtener RACs aleatorios por GAC");
      }

      return await response.json();
    } catch (error) {
      console.error("Error en obtenerRACsAleatoriosPorGAC:", error);
      throw error;
    }
  };

  const obtenerEvaluacionesEstudiante = async (estudianteId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/evaluaciones/estudiante/${estudianteId}/`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error("Error al obtener evaluaciones del estudiante");
      }

      return await response.json();
    } catch (error) {
      console.error("Error en obtenerEvaluacionesEstudiante:", error);
      throw error;
    }
  };

  const crearOActualizarEvaluacion = async (estudianteId, racId, puntaje) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/evaluaciones/crear/`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          estudiante_id: estudianteId,
          rac_id: racId,
          puntaje: puntaje,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Error al crear/actualizar evaluación"
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error en crearOActualizarEvaluacion:", error);
      throw error;
    }
  };

  const crearEvaluacionesMasivas = async (estudianteId, evaluaciones) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/evaluaciones/masivas/`,
        {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            estudiante_id: estudianteId,
            evaluaciones: evaluaciones,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Error al crear evaluaciones masivas"
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error en crearEvaluacionesMasivas:", error);
      throw error;
    }
  };

  const obtenerEstadisticasGenerales = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/evaluaciones/estadisticas/`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error("Error al obtener estadísticas generales");
      }

      return await response.json();
    } catch (error) {
      console.error("Error en obtenerEstadisticasGenerales:", error);
      throw error;
    }
  };

  const obtenerEstadisticasPorGAC = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/evaluaciones/estadisticas-por-gac/`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error("Error al obtener estadísticas por GAC");
      }

      return await response.json();
    } catch (error) {
      console.error("Error en obtenerEstadisticasPorGAC:", error);
      throw error;
    }
  };

  const obtenerResultadosEstudiante = async (estudianteId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/evaluaciones/resultados-estudiante/${estudianteId}/`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error("Error al obtener resultados del estudiante");
      }

      return await response.json();
    } catch (error) {
      console.error("Error en obtenerResultadosEstudiante:", error);
      throw error;
    }
  };

  // 🔥 Nuevo método para resultados globales
  const obtenerResultadosGlobales = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/evaluaciones/resultados-globales/`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error("Error al obtener resultados globales");
      }

      return await response.json();
    } catch (error) {
      console.error("Error en obtenerResultadosGlobales:", error);
      throw error;
    }
  };

  return {
    obtenerEstudiantes,
    obtenerRACs,
    obtenerRACsAleatoriosPorGAC,
    obtenerEvaluacionesEstudiante,
    crearOActualizarEvaluacion,
    crearEvaluacionesMasivas,
    obtenerEstadisticasGenerales,
    obtenerEstadisticasPorGAC,
    obtenerResultadosEstudiante,
    obtenerResultadosGlobales,
  };
};
