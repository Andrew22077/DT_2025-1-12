// src/api/UserApi.js
import axios from "axios";
import { useState, useCallback } from "react";

const API_URL = "http://localhost:8000/api";

// Hook personalizado para la API de usuarios
export const useUserApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Obtener todos los profesores
  const getProfesores = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Token no encontrado");

    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/listar-profesores/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error al obtener profesores:", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener un profesor por ID
  const getProfesor = useCallback(async (id) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Token no encontrado");

    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/profesor/${id}/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error al obtener profesor:", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Actualizar los datos de un profesor (nombre, correo, etc.)
  const updateProfesor = useCallback(async (id, data) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Token no encontrado");

    try {
      setLoading(true);
      setError(null);
      const response = await axios.put(`${API_URL}/profesor/${id}/`, data, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error al actualizar profesor:", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ NUEVO: Actualizar estado de admin/activo
  const updateProfesorStatus = useCallback(async (id, data) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Token no encontrado");

    try {
      setLoading(true);
      setError(null);
      const response = await axios.put(
        `${API_URL}/profesores/${id}/update/`,
        data,
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error al actualizar estado del profesor:", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ NUEVO: Actualizar foto del profesor
  const actualizarFoto = useCallback(async (id, formData) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Token no encontrado");

    try {
      setLoading(true);
      setError(null);
      const response = await axios.put(
        `${API_URL}/profesores/${id}/foto/`,
        formData,
        {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error al actualizar foto del profesor:", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const registerProfesor = useCallback(async (datos) => {
    try {
      // Obtener el token del localStorage
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No se encontró el token de autenticación.");
      }

      // Extraer solo los campos necesarios para el registro
      const { cedula, nombre, correo, password, materias = [] } = datos;

      // Crear el payload con el nombre correcto del campo "contrasenia"
      const payload = {
        cedula,
        nombre,
        correo,
        contrasenia: password, // Django espera "contrasenia", no "password"
        materias: materias, // Incluir materias
      };

      setLoading(true);
      setError(null);
      const response = await axios.post(`${API_URL}/register/`, payload, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error(
        "Error al registrar profesor:",
        error.response?.data || error.message
      );
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Importar Excel de profesores
  const importExcelProfesores = useCallback(async (file) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Token no encontrado");

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      setError(null);
      const response = await axios.post(
        `${API_URL}/import-excel-profesores/`,
        formData,
        {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error al importar Excel:", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Exportar profesores a Excel
  const exportProfesoresExcel = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Token no encontrado");

    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/export-excel-profesores/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
        responseType: "blob", // Importante para archivos
      });

      // Obtener nombre del archivo desde headers si el backend lo envía
      const contentDisposition = response.headers["content-disposition"];
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1]?.replace(/"/g, "")
        : `profesores_${new Date().toISOString().split("T")[0]}.xlsx`;

      // Crear URL para descargar el archivo
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return { success: true, message: "Archivo descargado exitosamente" };
    } catch (error) {
      console.error("Error al exportar Excel de profesores:", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Actualizar datos del usuario autenticado
  const actualizarPerfil = useCallback(async (datos) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Token no encontrado");

    try {
      setLoading(true);
      setError(null);
      const response = await axios.put(
        `http://localhost:8000/perfil/actualizar/`, // sin /api/
        datos,
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error al actualizar perfil del usuario:", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Función helper para obtener headers de autenticación
  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Token no encontrado");
    return {
      Authorization: `Token ${token}`,
    };
  }, []);

  // Obtener todos los estudiantes
  const getEstudiantes = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Token no encontrado");

    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/listar-estudiantes/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error al obtener estudiantes:", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener un estudiante por ID
  const getEstudiante = useCallback(async (id) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Token no encontrado");

    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/estudiante/${id}/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error al obtener estudiante:", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Registrar un nuevo estudiante
  const registerEstudiante = useCallback(async (datos) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Token no encontrado");

    try {
      setLoading(true);
      setError(null);
      const response = await axios.post(
        `${API_URL}/register-estudiante/`,
        datos,
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error(
        "Error al registrar estudiante:",
        error.response?.data || error.message
      );
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Actualizar los datos de un estudiante
  const updateEstudiante = useCallback(async (id, data) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Token no encontrado");

    try {
      setLoading(true);
      setError(null);
      const response = await axios.put(`${API_URL}/estudiante/${id}/`, data, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error al actualizar estudiante:", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Eliminar un estudiante
  const deleteEstudiante = useCallback(async (id) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Token no encontrado");

    try {
      setLoading(true);
      setError(null);
      const response = await axios.delete(`${API_URL}/estudiante/${id}/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error al eliminar estudiante:", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Importar Excel de estudiantes
  const importExcelEstudiantes = useCallback(async (file) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Token no encontrado");

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      setError(null);
      const response = await axios.post(
        `${API_URL}/import-excel-estudiantes/`,
        formData,
        {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error al importar Excel de estudiantes:", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Exportar estudiantes a Excel
  const exportEstudiantesExcel = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Token no encontrado");

    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/export-excel-estudiantes/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
        responseType: "blob", // Importante para archivos
      });

      // Obtener nombre del archivo desde headers si el backend lo envía
      const contentDisposition = response.headers["content-disposition"];
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1]?.replace(/"/g, "")
        : `estudiantes_${new Date().toISOString().split("T")[0]}.xlsx`;

      // Crear URL para descargar el archivo
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return { success: true, message: "Archivo descargado exitosamente" };
    } catch (error) {
      console.error("Error al exportar Excel de estudiantes:", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener estudiantes por grupo
  const getEstudiantesPorGrupo = useCallback(async (grupo) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Token no encontrado");

    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `${API_URL}/estudiantes-por-grupo/${grupo}/`,
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error al obtener estudiantes por grupo:", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener lista de grupos únicos
  const getGrupos = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Token no encontrado");

    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/grupos/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error al obtener grupos:", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener perfil del usuario actual
  const getCurrentUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Token no encontrado");

    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/perfil/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error al obtener perfil actual:", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener todas las materias
  const getMaterias = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Token no encontrado");

    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `http://localhost:8000/competencias/api/materias/`,
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error al obtener materias:", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // Estados
    loading,
    error,

    // Funciones de profesores
    getProfesores,
    getProfesor,
    updateProfesor,
    updateProfesorStatus,
    actualizarFoto,
    registerProfesor,
    importExcelProfesores,
    exportProfesoresExcel,

    // Funciones de perfil
    actualizarPerfil,
    getCurrentUser,

    // Funciones de materias
    getMaterias,

    // Funciones de estudiantes
    getEstudiantes,
    getEstudiante,
    registerEstudiante,
    updateEstudiante,
    deleteEstudiante,
    importExcelEstudiantes,
    exportEstudiantesExcel,
    getEstudiantesPorGrupo,
    getGrupos,

    // Helpers
    getAuthHeaders,
  };
};

// Funciones individuales para compatibilidad (deprecated)
export const getProfesores = async () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token no encontrado");

  try {
    const response = await axios.get(`${API_URL}/listar-profesores/`, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error al obtener profesores:", error);
    throw error;
  }
};

export const getProfesor = async (id) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token no encontrado");

  try {
    const response = await axios.get(`${API_URL}/profesor/${id}/`, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error al obtener profesor:", error);
    throw error;
  }
};

export const updateProfesor = async (id, data) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token no encontrado");

  try {
    const response = await axios.put(`${API_URL}/profesor/${id}/`, data, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error al actualizar profesor:", error);
    throw error;
  }
};

export const updateProfesorStatus = async (id, data) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token no encontrado");

  try {
    const response = await axios.put(
      `${API_URL}/profesores/${id}/update/`,
      data,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error al actualizar estado del profesor:", error);
    throw error;
  }
};

export const registerProfesor = async (datos) => {
  try {
    // Obtener el token del localStorage
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No se encontró el token de autenticación.");
    }

    // Extraer solo los campos necesarios para el registro
    const { cedula, nombre, correo, password, materias = [] } = datos;

    // Crear el payload con el nombre correcto del campo "contrasenia"
    const payload = {
      cedula,
      nombre,
      correo,
      contrasenia: password, // Django espera "contrasenia", no "password"
      materias: materias, // Incluir materias
    };

    const response = await axios.post(`${API_URL}/register/`, payload, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error(
      "Error al registrar profesor:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const importExcelProfesores = async (file) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token no encontrado");

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await axios.post(
      `${API_URL}/import-excel-profesores/`,
      formData,
      {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error al importar Excel:", error);
    throw error;
  }
};

export const exportProfesoresExcel = async () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token no encontrado");

  try {
    const response = await axios.get(`${API_URL}/export-excel-profesores/`, {
      headers: {
        Authorization: `Token ${token}`,
      },
      responseType: "blob", // Importante para archivos
    });

    // Obtener nombre del archivo desde headers si el backend lo envía
    const contentDisposition = response.headers["content-disposition"];
    const filename = contentDisposition
      ? contentDisposition.split("filename=")[1]?.replace(/"/g, "")
      : `profesores_${new Date().toISOString().split("T")[0]}.xlsx`;

    // Crear URL para descargar el archivo
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return { success: true, message: "Archivo descargado exitosamente" };
  } catch (error) {
    console.error("Error al exportar Excel de profesores:", error);
    throw error;
  }
};

export const actualizarPerfilUsuario = async (datos) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token no encontrado");

  try {
    const response = await axios.put(
      `http://localhost:8000/perfil/actualizar/`, // sin /api/
      datos,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error al actualizar perfil del usuario:", error);
    throw error;
  }
};

export const getEstudiantes = async () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token no encontrado");

  try {
    const response = await axios.get(`${API_URL}/listar-estudiantes/`, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error al obtener estudiantes:", error);
    throw error;
  }
};

export const getEstudiante = async (id) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token no encontrado");

  try {
    const response = await axios.get(`${API_URL}/estudiante/${id}/`, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error al obtener estudiante:", error);
    throw error;
  }
};

export const registerEstudiante = async (datos) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token no encontrado");

  try {
    const response = await axios.post(
      `${API_URL}/register-estudiante/`,
      datos,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error al registrar estudiante:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const updateEstudiante = async (id, data) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token no encontrado");

  try {
    const response = await axios.put(`${API_URL}/estudiante/${id}/`, data, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error al actualizar estudiante:", error);
    throw error;
  }
};

export const deleteEstudiante = async (id) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token no encontrado");

  try {
    const response = await axios.delete(`${API_URL}/estudiante/${id}/`, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error al eliminar estudiante:", error);
    throw error;
  }
};

export const importExcelEstudiantes = async (file) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token no encontrado");

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await axios.post(
      `${API_URL}/import-excel-estudiantes/`,
      formData,
      {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error al importar Excel de estudiantes:", error);
    throw error;
  }
};

export const exportEstudiantesExcel = async () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token no encontrado");

  try {
    const response = await axios.get(`${API_URL}/export-excel-estudiantes/`, {
      headers: {
        Authorization: `Token ${token}`,
      },
      responseType: "blob", // Importante para archivos
    });

    // Obtener nombre del archivo desde headers si el backend lo envía
    const contentDisposition = response.headers["content-disposition"];
    const filename = contentDisposition
      ? contentDisposition.split("filename=")[1]?.replace(/"/g, "")
      : `estudiantes_${new Date().toISOString().split("T")[0]}.xlsx`;

    // Crear URL para descargar el archivo
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return { success: true, message: "Archivo descargado exitosamente" };
  } catch (error) {
    console.error("Error al exportar Excel de estudiantes:", error);
    throw error;
  }
};

export const getEstudiantesPorGrupo = async (grupo) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token no encontrado");

  try {
    const response = await axios.get(
      `${API_URL}/estudiantes-por-grupo/${grupo}/`,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error al obtener estudiantes por grupo:", error);
    throw error;
  }
};

export const getGrupos = async () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token no encontrado");

  try {
    const response = await axios.get(`${API_URL}/grupos/`, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error al obtener grupos:", error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token no encontrado");

  try {
    const response = await axios.get(`${API_URL}/perfil/`, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error al obtener perfil actual:", error);
    throw error;
  }
};
