import { createContext, useContext, useState } from "react";
import axios from "axios";

const AuthContext = createContext();
const API_URL = "http://localhost:8000/api";

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
        // Guardar toda la información relevante del usuario
        const userData = {
          correo,
          is_staff: response.data.acceso, // Asegúrate de que `acceso` se corresponda con `is_staff`
          token: response.data.token,
        };

        // Guardar en el estado y localStorage
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("isStaff", response.data.acceso);

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

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
