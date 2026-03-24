// src/utils/photoUtils.js

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Construye la URL completa para una foto del backend
 * @param {string} fotoUrl - URL relativa de la foto desde el backend
 * @returns {string} URL completa para mostrar la foto
 */
export const buildPhotoUrl = (fotoUrl) => {
  if (!fotoUrl || fotoUrl === "/static/default-avatar.png") {
    return null;
  }
  
  if (fotoUrl.startsWith("http")) {
    return fotoUrl;
  }
  
  return `${API_BASE}${fotoUrl}`;
};

/**
 * Verifica si una URL de foto es válida
 * @param {string} fotoUrl - URL de la foto
 * @returns {boolean} true si la foto es válida
 */
export const isValidPhotoUrl = (fotoUrl) => {
  return fotoUrl && fotoUrl !== "/static/default-avatar.png" && fotoUrl !== "";
};
