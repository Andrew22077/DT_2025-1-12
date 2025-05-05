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
    const response = await axios.post(`${API_URL}/login/`, {
      correo,
      contrasenia,
    });

    // Guardar datos
    const userData = { correo }; // Puedes agregar más si lo deseas
    setUser(userData);

    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", response.data.token);
    localStorage.setItem("isStaff", response.data.acceso);

    return response.data;
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
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }

    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("isStaff");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para consumir el contexto
export const useAuth = () => useContext(AuthContext);
