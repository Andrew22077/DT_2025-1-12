import React, { useState, useEffect } from "react";
import { actualizarPerfilUsuario, getCurrentUser } from "../api/UserApi";

// Definir colores desde los proporcionados
const colors = {
  primary100: "#4CAF50",
  primary200: "#2a9235",
  primary300: "#0a490a",
  accent100: "#FFC107",
  accent200: "#916400",
  text100: "#333333",
  text200: "#5c5c5c",
  bg100: "#e6fbe3",
  bg200: "#dcf1d9",
  bg300: "#b4c8b1"
};

const EditarPerfil = () => {
  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    contrasenia: "",
  });
  
  const [userInfo, setUserInfo] = useState({
    cedula: "",
    nombre: "",
    correo: "",
    is_active: true,
    is_staff: false,
    fecha_registro: "",
  });
  
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  // Obtener información del usuario actual
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        setLoading(true);
        const userData = await getCurrentUser();
        
        if (userData) {
          setUserInfo({
            cedula: userData.cedula || "No disponible",
            nombre: userData.nombre || "",
            correo: userData.correo || "",
            is_active: userData.is_active !== undefined ? userData.is_active : true,
            is_staff: userData.is_staff || false,
            fecha_registro: userData.created_at || userData.date_joined || new Date().toISOString(),
          });

          setFormData({
            nombre: userData.nombre || "",
            correo: userData.correo || "",
            contrasenia: "",
          });
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error al obtener datos del usuario:", err);
        setError("Error al cargar los datos del perfil. Verifica tu sesión.");
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    try {
      const data = { ...formData };
      if (data.contrasenia === "") delete data.contrasenia;
      
      const updatedUser = await actualizarPerfilUsuario(data);
      
      // Recargar los datos del usuario después de actualizar
      const refreshedUser = await getCurrentUser();
      setUserInfo({
        cedula: refreshedUser.cedula || "No disponible",
        nombre: refreshedUser.nombre || "",
        correo: refreshedUser.correo || "",
        is_active: refreshedUser.is_active !== undefined ? refreshedUser.is_active : true,
        is_staff: refreshedUser.is_staff || false,
        fecha_registro: refreshedUser.created_at || refreshedUser.date_joined || new Date().toISOString(),
      });

      setMensaje("Perfil actualizado con éxito.");
      
      // Limpiar contraseña del formulario
      setFormData(prev => ({ ...prev, contrasenia: "" }));
      
    } catch (err) {
      setError("Error al actualizar perfil. Verifica los campos.");
      console.error(err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No disponible";
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen p-6 flex items-center justify-center"
        style={{ backgroundColor: colors.bg100 }}
      >
        <p style={{ color: colors.primary300 }}>Cargando información del perfil...</p>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen p-6 flex items-center justify-center"
      style={{ backgroundColor: colors.bg100 }}
    >
      <div className="rounded-lg shadow-lg w-full max-w-5xl flex overflow-hidden">
        {/* Lado Izquierdo - Formulario */}
        <div 
          className="w-1/3 p-6 flex flex-col items-center"
          style={{ backgroundColor: colors.primary100 }}
        >
          <div 
            className="w-24 h-24 rounded-full mb-4 flex items-center justify-center"
            style={{ 
              backgroundColor: colors.bg100,
              border: `4px solid ${colors.primary200}`
            }}
          >
            <img
              src={`https://www.gravatar.com/avatar/${userInfo.correo}?d=identicon&s=96`}
              alt={userInfo.nombre}
              className="w-20 h-20 rounded-full object-cover"
            />
          </div>
          
          <h2 
            className="text-xl font-semibold mb-2 text-center"
            style={{ color: colors.bg100 }}
          >
            {userInfo.nombre}
          </h2>

          <div className="mb-4 text-center">
            <span 
              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                userInfo.is_staff 
                  ? 'bg-yellow-500 text-white' 
                  : 'bg-blue-500 text-white'
              }`}
            >
              {userInfo.is_staff ? 'Administrador' : 'Profesor'}
            </span>
            
            <span 
              className={`inline-block ml-2 px-3 py-1 rounded-full text-xs font-semibold ${
                userInfo.is_active 
                  ? 'bg-green-600 text-white' 
                  : 'bg-red-500 text-white'
              }`}
            >
              {userInfo.is_active ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          
          <form onSubmit={handleSubmit} className="w-full">
            {mensaje && (
              <div 
                className="mb-3 p-2 rounded text-center"
                style={{ backgroundColor: colors.bg100, color: colors.primary300 }}
              >
                {mensaje}
              </div>
            )}
            
            {error && (
              <div 
                className="mb-3 p-2 rounded text-center"
                style={{ backgroundColor: "#FFECEC", color: "#D32F2F" }}
              >
                {error}
              </div>
            )}

            <div className="mb-3">
              <label 
                htmlFor="nombre" 
                className="block font-medium mb-1"
                style={{ color: colors.bg100 }}
              >
                Nombre
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className="p-2 w-full rounded focus:outline-none"
                style={{ 
                  border: `1px solid ${colors.bg200}`,
                  backgroundColor: colors.bg100,
                  color: colors.text100
                }}
                required
              />
            </div>

            <div className="mb-3">
              <label 
                htmlFor="correo" 
                className="block font-medium mb-1"
                style={{ color: colors.bg100 }}
              >
                Correo electrónico
              </label>
              <input
                type="email"
                id="correo"
                name="correo"
                value={formData.correo}
                onChange={handleChange}
                className="p-2 w-full rounded focus:outline-none"
                style={{ 
                  border: `1px solid ${colors.bg200}`,
                  backgroundColor: colors.bg100,
                  color: colors.text100
                }}
                required
              />
            </div>

            <div className="mb-4">
              <label 
                htmlFor="contrasenia" 
                className="block font-medium mb-1"
                style={{ color: colors.bg100 }}
              >
                Nueva Contraseña (opcional)
              </label>
              <input
                type="password"
                id="contrasenia"
                name="contrasenia"
                value={formData.contrasenia}
                onChange={handleChange}
                className="p-2 w-full rounded focus:outline-none"
                style={{ 
                  border: `1px solid ${colors.bg200}`,
                  backgroundColor: colors.bg100,
                  color: colors.text100
                }}
                placeholder="Dejar en blanco si no deseas cambiarla"
              />
            </div>

            <button
              type="submit"
              className="text-amber-50 mt-1 block w-full px-3 py-2 border border-green-300 rounded-md bg-green-700 hover:bg-emerald-800 focus:outline-none focus:ring-orange-400 focus:border-orange-400 transition-colors"
            >
              Guardar Cambios
            </button>
          </form>
        </div>

        {/* Lado Derecho - Información detallada del perfil */}
        <div 
          className="w-2/3 p-8"
          style={{ backgroundColor: colors.bg200 }}
        >
          <h1 
            className="text-2xl font-bold mb-6"
            style={{ color: colors.primary300 }}
          >
            Información del Perfil
          </h1>
          
          {/* Información Personal */}
          <div 
            className="rounded-lg p-6 shadow-md mb-6"
            style={{ backgroundColor: colors.bg100 }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: colors.primary300 }}>
              Datos Personales
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-medium" style={{ color: colors.text100 }}>Cédula:</p>
                <p style={{ color: colors.text200 }}>{userInfo.cedula}</p>
              </div>
              <div>
                <p className="font-medium" style={{ color: colors.text100 }}>Nombre Completo:</p>
                <p style={{ color: colors.text200 }}>{userInfo.nombre}</p>
              </div>
              <div>
                <p className="font-medium" style={{ color: colors.text100 }}>Correo Electrónico:</p>
                <p style={{ color: colors.text200 }}>{userInfo.correo}</p>
              </div>
              <div>
                <p className="font-medium" style={{ color: colors.text100 }}>Fecha de Registro:</p>
                <p style={{ color: colors.text200 }}>{formatDate(userInfo.fecha_registro)}</p>
              </div>
            </div>
          </div>

          {/* Estado de la Cuenta */}
          <div 
            className="rounded-lg p-6 shadow-md mb-6"
            style={{ backgroundColor: colors.bg100 }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: colors.primary300 }}>
              Estado de la Cuenta
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span style={{ color: colors.text100 }}>Estado de la cuenta:</span>
                <span 
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    userInfo.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {userInfo.is_active ? 'Activa' : 'Inactiva'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span style={{ color: colors.text100 }}>Permisos de administrador:</span>
                <span 
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    userInfo.is_staff 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {userInfo.is_staff ? 'Administrador' : 'Usuario estándar'}
                </span>
              </div>
            </div>
          </div>

          {/* Información adicional */}
          <div
            className="p-4 rounded-lg"
            style={{ backgroundColor: colors.bg100 }}
          >
            <h3 className="text-lg font-semibold mb-3" style={{ color: colors.primary300 }}>
              Configuración de Perfil
            </h3>
            <ul 
              className="list-disc pl-5 space-y-2"
              style={{ color: colors.text200 }}
            >
              <li>Puedes actualizar tu nombre y correo electrónico en cualquier momento</li>
              <li>Para cambiar tu contraseña, completa el campo correspondiente</li>
              <li>Los cambios se guardarán inmediatamente al hacer clic en "Guardar Cambios"</li>
              <li>Tu avatar se genera automáticamente basado en tu correo electrónico</li>
              {userInfo.is_staff && (
                <li className="text-yellow-700 font-medium">Como administrador, tienes acceso completo al sistema</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditarPerfil;