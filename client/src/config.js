/**
 * Configuración de URLs de la API.
 * En producción, define VITE_API_URL (ej: https://tu-backend.railway.app)
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";
