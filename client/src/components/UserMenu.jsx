import { useState } from "react";
import { useAuth } from "../api/Auth";
import { Link } from "react-router-dom";
import {
  FaBars,
  FaHighlighter,
  FaSignInAlt,
  FaUserTie,
  FaInfoCircle,
  FaGlasses,
  FaUserGraduate,
} from "react-icons/fa";

const UserMenu = () => {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();

  const toggleMenu = () => setOpen(!open);

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center gap-2">
        <button
          onClick={toggleMenu}
          className="flex items-center bg-indigo-300 text-white px-3 py-1 rounded-full hover:bg-slate-500 transition"
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
        <div className="absolute right-0 mt-2 w-64 bg-slate-500 text-black border border-black rounded-md shadow-lg z-10">
          <ul>
            {/* Si no hay usuario logueado */}
            {!user && (
              <li className="p-3 hover:bg-slate-600 cursor-pointer">
                <Link
                  to="/login"
                  className="flex items-center gap-1 hover:text-emerald-400 transition"
                >
                  <FaSignInAlt color="#91ff00" />
                  <span className="select-none">Iniciar Sesión</span>
                </Link>
              </li>
            )}
            {user && (
              <>
                {!user.is_staff && (
                  <li className="p-3 hover:bg-slate-600 cursor-pointer">
                    <Link
                      to="/teacher-menu"
                      className="flex items-center gap-1 hover:text-white transition"
                    >
                      <FaGlasses color="white" /> Menú
                    </Link>
                  </li>
                )}
                {/*Lista Estudiantes*/}
                <li
                  className="p-3 hover:bg-slate-600 cursor-pointer flex items-center gap-2 hover:text-white transition"
                >
                  <Link
                    to="/student-list" // Enlace al TeacherList
                    className="flex items-center gap-1 hover:text-white transition"
                  >
                    <FaUserGraduate color="white" />
                    <span className="select-none">Lista Estudiantes</span>
                  </Link>
                </li>
                {user.is_staff && (
                  <li className="p-3 hover:bg-slate-600 cursor-pointer">
                    <Link
                      to="/teacher-list" // Enlace al TeacherList
                      className="flex items-center gap-1 hover:text-white transition"
                    >
                      <FaGlasses color="white" />
                      <span className="select-none">Lista de Profesores</span>
                    </Link>
                  </li>
                )}
                {user.is_staff && (
                  <li className="p-3 hover:bg-slate-600 cursor-pointer">
                    <Link
                      to="/admin-menu" // Enlace al TeacherList
                      className="flex items-center gap-1 hover:text-white transition"
                    >
                      <FaBars color="white" />
                      <span className="select-none">Menu Administrador</span>
                    </Link>
                  </li>
                )}
                <li className="p-3 hover:bg-slate-600 cursor-pointer">
                  <Link
                    to="/editar-perfil"
                    className="flex items-center gap-1 hover:text-white transition"
                  >
                    <FaHighlighter color="white" />
                    <span className="select-none">Editar Perfil</span>
                  </Link>
                </li>

                {/* Cerrar sesión */}
                <li
                  onClick={() => logout()}
                  className="p-3 hover:bg-slate-600 cursor-pointer flex items-center gap-2 hover:text-red-400 transition"
                >
                  <Link
                    to="/information" // Enlace al TeacherList
                    className="flex items-center gap-1 hover:text-red-400 transition"
                  >
                    <FaSignInAlt color="red" />
                    <span className="select-none">Cerrar sesión</span>
                  </Link>

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
