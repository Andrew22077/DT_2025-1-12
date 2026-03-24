import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";

const AuthContext = createContext();
const API_URL = `${API_BASE_URL}/api`;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const clearSession = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("isStaff");
  };

  useEffect(() => {
    const bootstrapSession = async () => {
      const token = localStorage.getItem("token");
      if (!token || token === "undefined" || token === "null") {
        clearSession();
        setIsAuthReady(true);
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/perfil`, {
          headers: {
            Authorization: `Token ${token}`,
          },
        });
        const perfil = response.data || {};
        const userData = {
          correo: perfil.correo || "",
          is_staff: Boolean(perfil.is_staff),
          token,
        };
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("isStaff", String(userData.is_staff));
      } catch (error) {
        clearSession();
      } finally {
        setIsAuthReady(true);
      }
    };

    bootstrapSession();
  }, []);

  const login = async (correo, contrasenia) => {
    try {
      const response = await axios.post(`${API_URL}/login/`, {
        correo,
        contrasenia,
      });

      if (response.status === 200) {
        const token = response.data?.token;
        if (!token || typeof token !== "string") {
          throw new Error("Respuesta de login inválida (sin token)");
        }
        const perfil = response.data?.user || {};
        const acceso = Boolean(
          typeof response.data?.acceso !== "undefined"
            ? response.data.acceso
            : perfil.is_staff
        );

        const userData = {
          correo: perfil.correo || correo,
          is_staff: acceso,
          token,
        };

        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("token", token);
        localStorage.setItem("isStaff", String(acceso));

        return response.data;
      } else {
        throw new Error("Error de autenticación");
      }
    } catch (error) {
      console.error("Error al iniciar sesión", error);
      throw new Error("Correo o contraseña incorrectos");
    }
  };

  const logout = async () => {
    const token = localStorage.getItem("token");

    try {
      if (token) {
        await axios.post(
          `${API_URL}/logout/`,
          {},
          {
            headers: {
              Authorization: `Token ${token}`,
            },
          }
        );
      }
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      clearSession();
    }
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    if (token) {
      return {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      };
    }
    return {
      "Content-Type": "application/json",
    };
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthReady, login, logout, getAuthHeaders }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
