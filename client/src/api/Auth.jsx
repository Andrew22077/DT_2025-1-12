import { createContext, useContext, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";

const AuthContext = createContext();
const API_URL = `${API_BASE_URL}/api`;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

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
        const acceso = Boolean(response.data?.acceso);

        const userData = {
          correo,
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
      await axios.post(
        `${API_URL}/logout/`,
        {},
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );

      setUser(null);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("isStaff");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
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
    <AuthContext.Provider value={{ user, login, logout, getAuthHeaders }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
