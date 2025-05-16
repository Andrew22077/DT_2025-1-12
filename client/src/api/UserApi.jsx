// src/api/UserApi.js
import axios from "axios";

const API_URL = "http://localhost:8000/api";

export const registerProfesor = async (datos) => {
  try {
    // Obtener el token del localStorage
    const token = localStorage.getItem("token");

    // Si no hay token, lanzar un error
    if (!token) {
      throw new Error("No se encontró el token de autenticación.");
    }

    // Enviar la solicitud POST con el token en los encabezados
    const response = await axios.post(`${API_URL}/register/`, datos, {
      headers: {
        Authorization: `Token ${token}`, // Enviar el token en los encabezados
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error al registrar profesor:", error);
    throw error;
  }
};

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
  const response = await axios.get(`${API_URL}/profesor/${id}/`, {
    headers: {
      Authorization: `Token ${token}`,
    },
  });
  return response.data;
};

export const updateProfesor = async (id, data) => {
  const token = localStorage.getItem("token");
  const response = await axios.put(`${API_URL}/profesor/${id}/`, data, {
    headers: {
      Authorization: `Token ${token}`,
    },
  });
  return response.data;
};
