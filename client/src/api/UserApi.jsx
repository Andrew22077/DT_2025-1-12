import axios from "axios";

const API_URL = "http://localhost:8000/api";

export const getProfesores = async () => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Token no encontrado. El usuario debe estar autenticado.");
  }

  try {
    const response = await axios.get(`${API_URL}/listar-profesores/`, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error al obtener la lista de profesores:", error);
    throw error;
  }
};
