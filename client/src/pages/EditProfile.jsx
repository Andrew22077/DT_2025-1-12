import React, { useState, useEffect } from "react";
import { useUserApi } from "../api/UserApi";
import { buildPhotoUrl, isValidPhotoUrl } from "../utils/photoUtils";

const EditProfile = () => {
  const { getCurrentUser, actualizarPerfil, actualizarFoto, getMateriasProfesor, loading, error } =
    useUserApi();

  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    cedula: "",
    contrasenia: "",
    confirmarContrasenia: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [materias, setMaterias] = useState([]);

  // Cargar datos del usuario al montar el componente
  useEffect(() => {
    loadUserData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadUserData = async () => {
    try {
      const userData = await getCurrentUser();
      console.log("Datos del usuario cargados:", userData);
      setUser(userData);
      setFormData({
        nombre: userData.nombre || "",
        correo: userData.correo || "",
        cedula: userData.cedula || "",
        contrasenia: "",
        confirmarContrasenia: "",
      });

      // Si el usuario tiene foto, mostrar preview
      console.log("Foto URL del usuario:", userData.foto_url);
      console.log("¿Es válida la foto?", isValidPhotoUrl(userData.foto_url));

      if (isValidPhotoUrl(userData.foto_url)) {
        const fotoUrl = buildPhotoUrl(userData.foto_url);
        console.log("URL de foto construida:", fotoUrl);
        setPreviewUrl(fotoUrl);
      } else {
        console.log("No hay foto válida, usando avatar por defecto");
        setPreviewUrl(null);
      }

      // Cargar materias del profesor
      try {
        const materiasData = await getMateriasProfesor();
        console.log("Materias del profesor cargadas:", materiasData);
        setMaterias(materiasData.materias || []);
      } catch (materiasError) {
        console.error("Error al cargar materias:", materiasError);
        // No mostrar error de materias como error crítico, solo log
      }
    } catch (error) {
      console.error("Error al cargar datos del usuario:", error);
      showMessage("Error al cargar los datos del usuario", "error");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith("image/")) {
        showMessage(
          "Por favor selecciona un archivo de imagen válido",
          "error"
        );
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showMessage("La imagen no puede ser mayor a 5MB", "error");
        return;
      }

      setSelectedFile(file);

      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar contraseñas si se proporcionan
    if (
      formData.contrasenia &&
      formData.contrasenia !== formData.confirmarContrasenia
    ) {
      showMessage("Las contraseñas no coinciden", "error");
      return;
    }

    try {
      // Preparar datos para enviar (sin confirmarContrasenia)
      const { confirmarContrasenia: _, ...dataToSend } = formData;

      // Si no hay contraseña nueva, no enviarla
      if (!dataToSend.contrasenia) {
        delete dataToSend.contrasenia;
      }

      // Actualizar datos básicos del perfil
      await actualizarPerfil(dataToSend);

      // Si hay una nueva foto, subirla
      if (selectedFile) {
        console.log("=== DEBUG FRONTEND FOTO ===");
        console.log("Subiendo foto para usuario ID:", user.id, "(tipo:", typeof user.id, ")");
        console.log("Usuario completo:", user);
        console.log("Token en localStorage:", localStorage.getItem("token"));
        
        const formDataPhoto = new FormData();
        formDataPhoto.append("foto", selectedFile);
        console.log("FormData creado:", formDataPhoto);
        console.log("Archivo seleccionado:", selectedFile);
        
        try {
          const fotoResponse = await actualizarFoto(user.id, formDataPhoto);
          console.log("Respuesta de subida de foto:", fotoResponse);
        } catch (error) {
          console.error("Error detallado al subir foto:", error);
          console.error("Error response:", error.response);
          console.error("Error status:", error.response?.status);
          console.error("Error data:", error.response?.data);
          throw error; // Re-lanzar el error para que sea manejado por el catch principal
        }
      }

      showMessage("Perfil actualizado exitosamente", "success");

      // Recargar datos del usuario
      await loadUserData();

      // Limpiar formulario
      setFormData((prev) => ({
        ...prev,
        contrasenia: "",
        confirmarContrasenia: "",
      }));
      setSelectedFile(null);
    } catch (err) {
      console.error("Error al actualizar perfil:", err);
      showMessage(
        "Error al actualizar el perfil. Inténtalo de nuevo.",
        "error"
      );
    }
  };

  const removePhoto = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    // Aquí podrías agregar lógica para eliminar la foto del servidor si es necesario
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando datos del usuario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-blue-800 mb-8">
          Editar Perfil
        </h1>

        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Mensaje de estado */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                messageType === "success"
                  ? "bg-green-50 border border-green-200 text-green-800"
                  : "bg-red-50 border border-red-200 text-red-800"
              }`}
            >
              {message}
            </div>
          )}

          {/* Error de la API */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
              Error: {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sección de foto */}
            <div className="border-b pb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Foto de Perfil
              </h2>

              <div className="flex items-center space-x-6">
                {/* Preview de la foto */}
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 border-4 border-blue-200">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg
                          className="w-16 h-16"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Botón para eliminar foto */}
                  {previewUrl && (
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Input de archivo */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seleccionar nueva foto
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Formatos permitidos: JPG, PNG, GIF. Tamaño máximo: 5MB
                  </p>
                </div>
              </div>
            </div>

            {/* Información básica */}
            <div className="border-b pb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Información Personal
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cédula *
                  </label>
                  <input
                    type="text"
                    name="cedula"
                    value={formData.cedula}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    name="correo"
                    value={formData.correo}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Cambio de contraseña */}
            <div className="pb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Cambiar Contraseña
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Deja estos campos vacíos si no quieres cambiar tu contraseña
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    name="contrasenia"
                    value={formData.contrasenia}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    name="confirmarContrasenia"
                    value={formData.confirmarContrasenia}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Sección de materias */}
            <div className="pb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Materias Asignadas
              </h2>
              
              {materias.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {materias.map((materia) => (
                    <div
                      key={materia.id}
                      className="bg-blue-50 rounded-lg p-4 border border-blue-200"
                    >
                      <h3 className="font-semibold text-blue-800 text-lg">
                        {materia.nombre}
                      </h3>
                      <p className="text-blue-600 text-sm mt-1">
                        {materia.descripcion}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <p className="text-gray-600">
                    No tienes materias asignadas actualmente.
                  </p>
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading && (
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                )}
                {loading ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
