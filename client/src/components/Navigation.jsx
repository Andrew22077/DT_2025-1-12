import { useState } from "react";
import { Link } from "react-router-dom";

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-green-800 text-white px-6 py-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-xl font-bold">
          <Link to="/">Universidad El Bosque</Link>
        </div>
        <div className="hidden md:flex space-x-6">
          <Link to="/information" className="hover:text-yellow-300 transition">
            Información
          </Link>
          <Link to="/menu" className="hover:text-yellow-300 transition">
            Menú
          </Link>
          <Link to="/login" className="hover:text-yellow-300 transition">
            Iniciar Sesion
          </Link>
        </div>
        <button
          className="md:hidden focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
            />
          </svg>
        </button>
      </div>

      {/* Menú desplegable móvil */}
      {isOpen && (
        <div className="md:hidden flex flex-col px-4 pt-2 pb-4 space-y-2 bg-green-700">
          <Link
            to="/information"
            className="hover:text-yellow-300 transition"
            onClick={() => setIsOpen(false)}
          >
            Información
          </Link>
          <Link
            to="/menu"
            className="hover:text-yellow-300 transition"
            onClick={() => setIsOpen(false)}
          >
            Menú
          </Link>
          <Link
            to="/contact"
            className="hover:text-yellow-300 transition"
            onClick={() => setIsOpen(false)}
          >
            Contacto
          </Link>
        </div>
      )}
    </nav>
  );
}
