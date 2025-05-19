import { useState } from "react";
import { useAuth } from "../api/Auth";
import { Link } from "react-router-dom";
import { FaBars, FaHighlighter, FaSignInAlt, FaUserTie, FaInfoCircle } from "react-icons/fa";

const UserMenu = () => {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();

  const toggleMenu = () => setOpen(!open);

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center gap-2">
        <button
          onClick={toggleMenu}
          className="flex items-center bg-lime-500 text-white px-3 py-1 rounded-full hover:bg-neutral-700 transition"
        >
          <span className="mr-2">
            <FaBars color="#022c22" />
          </span>
          <span className="bg-sky-50 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
            <FaUserTie color="#022c22" />
          </span>
        </button>
      </div>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-emerald-900 text-white border border-emerald-950 rounded-md shadow-lg z-10">
          <ul>
            <li className="p-3 hover:bg-emerald-950 cursor-pointer">
              <Link
                to="/menu"
                className="flex items-center gap-1 hover:text-yellow-300 transition"
              >
                <FaBars color="#91ff00" /> Menú
              </Link>
            </li>

            {/* Si no hay usuario logueado */}
            {!user && (
              <li className="p-3 hover:bg-emerald-950 cursor-pointer">
                <Link
                  to="/login"
                  className="flex items-center gap-1 hover:text-yellow-300 transition"
                >
                  <FaSignInAlt color="#91ff00" />
                  <span className="select-none">Iniciar Sesión</span>
                </Link>
              </li>
            )}

            {user && (
              <li className="p-3 hover:bg-emerald-950 cursor-pointer">
                <Link
                  to="/editar-perfil"
                  className="flex items-center gap-1 hover:text-yellow-300 transition"
                >
                  <FaHighlighter color="#91ff00" />
                  <span className="select-none">Editar Perfil</span>
                </Link>
              </li>
            )}


            {/* Si hay usuario logueado */}
            {user && (
              <>
                {/* Si el usuario es staff, mostrar la opción "Teacher List" */}
                {user.is_staff && (
                  <li className="p-3 hover:bg-emerald-950 cursor-pointer">
                    <Link
                      to="/teacher-list" // Enlace al TeacherList
                      className="flex items-center gap-1 hover:text-yellow-300 transition"
                    >
                      <FaInfoCircle color="#91ff00" />
                      <span className="select-none">Lista de Profesores</span>
                    </Link>
                  </li>
                )}

                {/* Cerrar sesión */}
                <li
                  onClick={() => logout()}
                  className="p-3 hover:bg-emerald-950 cursor-pointer flex items-center gap-2 hover:text-red-400 transition"
                >
                  <FaSignInAlt color="white" />
                  <span className="select-none">Cerrar sesión</span>
                </li>
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
