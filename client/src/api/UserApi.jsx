// src/api/UserApi.js
import axios from "axios";

const API_URL = "http://localhost:8000/api";

// Obtener todos los profesores
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

// Obtener un profesor por ID
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

// Actualizar los datos de un profesor (nombre, correo, etc.)
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

// ✅ NUEVO: Actualizar estado de admin/activo
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
    const { cedula, nombre, correo, password } = datos;

    // Crear el payload con el nombre correcto del campo "contrasenia"
    const payload = {
      cedula,
      nombre,
      correo,
      contrasenia: password, // Django espera "contrasenia", no "password"
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

// Importar Excel de profesores
export const importExcelProfesores = async (file) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token no encontrado");

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await axios.post(`${API_URL}/import-excel-profesores/`, formData, {
      headers: {
        Authorization: `Token ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error al importar Excel:", error);
    throw error;
  }
};

// Exportar profesores a Excel
export const exportProfesoresExcel = async () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token no encontrado");

  try {
    const response = await axios.get(`${API_URL}/export-excel-profesores/`, {
      headers: {
        Authorization: `Token ${token}`,
      },
      responseType: 'blob', // Importante para archivos
    });
    
    // Crear URL para descargar el archivo
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `profesores_${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error("Error al exportar Excel:", error);
    throw error;
  }
};