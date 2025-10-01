// src/utils/photoUtils.js

/**
 * Construye la URL completa para una foto del backend
 * @param {string} fotoUrl - URL relativa de la foto desde el backend
 * @returns {string} URL completa para mostrar la foto
 */
export const buildPhotoUrl = (fotoUrl) => {
  if (!fotoUrl || fotoUrl === "/static/default-avatar.png") {
    return null;
  }
  
  // Si ya es una URL completa, devolverla tal como está
  if (fotoUrl.startsWith("http")) {
    return fotoUrl;
  }
  
  // Construir URL completa con el backend
  return `http://3.17.149.166${fotoUrl}`;
};

/**
 * Verifica si una URL de foto es válida
 * @param {string} fotoUrl - URL de la foto
 * @returns {boolean} true si la foto es válida
 */
export const isValidPhotoUrl = (fotoUrl) => {
  return fotoUrl && fotoUrl !== "/static/default-avatar.png" && fotoUrl !== "";
};
