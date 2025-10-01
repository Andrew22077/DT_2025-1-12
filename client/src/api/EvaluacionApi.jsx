import { useAuth } from "./Auth";

const API_BASE_URL = "http://3.17.149.166/competencias";

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

  // Nuevas funciones para informes
  const obtenerInformesGACSemestre = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/informes/gac-semestre/`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error("Error al obtener informes GAC por semestre");
      }

      return await response.json();
    } catch (error) {
      console.error("Error en obtenerInformesGACSemestre:", error);
      throw error;
    }
  };

  const obtenerInformesProfesorMateria = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/informes/profesor-materia/`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error("Error al obtener informes por profesor y materia");
      }

      return await response.json();
    } catch (error) {
      console.error("Error en obtenerInformesProfesorMateria:", error);
      throw error;
    }
  };

  const obtenerInformesEstudianteProfesores = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/informes/estudiante-profesores/`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Error al obtener informes por estudiante y profesores"
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error en obtenerInformesEstudianteProfesores:", error);
      throw error;
    }
  };

  const obtenerDetalleProfesorMateria = async (profesorId, materiaId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/informes/detalle-profesor-materia/${profesorId}/${materiaId}/`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error("Error al obtener detalle de profesor y materia");
      }

      return await response.json();
    } catch (error) {
      console.error("Error en obtenerDetalleProfesorMateria:", error);
      throw error;
    }
  };

  const obtenerMateriasProfesor = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/materias-profesor/`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Error al obtener materias del profesor");
      }

      return await response.json();
    } catch (error) {
      console.error("Error en obtenerMateriasProfesor:", error);
      throw error;
    }
  };

  const obtenerGACsPorMateria = async (materiaId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/gacs-por-materia/${materiaId}/`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error("Error al obtener GACs por materia");
      }

      return await response.json();
    } catch (error) {
      console.error("Error en obtenerGACsPorMateria:", error);
      throw error;
    }
  };

  // Funciones para descargar PDFs
  const descargarPDFResumenGeneral = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/pdf/resumen-general/`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error("Error al descargar PDF de resumen general");
      }

      // Crear blob y descargar
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resumen_general_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error en descargarPDFResumenGeneral:", error);
      throw error;
    }
  };

  const descargarPDFPorGAC = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/pdf/por-gac/`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error("Error al descargar PDF por GAC");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `informe_por_gac_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error en descargarPDFPorGAC:", error);
      throw error;
    }
  };

  const descargarPDFPorProfesor = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/pdf/por-profesor/`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error("Error al descargar PDF por profesor");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `informe_por_profesor_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error en descargarPDFPorProfesor:", error);
      throw error;
    }
  };

  const descargarPDFPorEstudiante = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/pdf/por-estudiante/`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error("Error al descargar PDF por estudiante");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `informe_por_estudiante_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error en descargarPDFPorEstudiante:", error);
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
    obtenerInformesGACSemestre,
    obtenerInformesProfesorMateria,
    obtenerInformesEstudianteProfesores,
    obtenerDetalleProfesorMateria,
    obtenerMateriasProfesor,
    obtenerGACsPorMateria,
    descargarPDFResumenGeneral,
    descargarPDFPorGAC,
    descargarPDFPorProfesor,
    descargarPDFPorEstudiante,
  };
};
