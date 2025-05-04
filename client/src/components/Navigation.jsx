import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaInfoCircle, FaBars, FaSignInAlt, FaDesktop } from "react-icons/fa";

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-emerald-950 text-white px-6 py-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2 text-xl font-bold">
          <FaDesktop color="#91ff00" size={24} />
          <Link to="/">Universidad El Bosque</Link>
        </div>

        <div className="hidden md:flex space-x-6 items-center">
          <Link
            to="/information"
            className="flex items-center gap-1 hover:text-yellow-300 transition"
          >
            <FaInfoCircle color="#91ff00" /> Información
          </Link>
          <Link
            to="/menu"
            className="flex items-center gap-1 hover:text-yellow-300 transition"
          >
            <FaBars color="#91ff00" /> Menú
          </Link>
          <Link
            to="/login"
            className="flex items-center gap-1 hover:text-yellow-300 transition"
          >
            <FaSignInAlt color="#91ff00" /> Iniciar Sesión
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

      {isOpen && (
        <div className="md:hidden flex flex-col px-4 pt-2 pb-4 space-y-2 bg-green-700">
          <Link
            to="/information"
            className="flex items-center gap-2 hover:text-yellow-300 transition"
            onClick={() => setIsOpen(false)}
          >
            <FaInfoCircle color="#91ff00" /> Información
          </Link>
          <Link
            to="/menu"
            className="flex items-center gap-2 hover:text-yellow-300 transition"
            onClick={() => setIsOpen(false)}
          >
            <FaBars color="#91ff00" /> Menú
          </Link>
          <Link
            to="/login"
            className="flex items-center gap-2 hover:text-yellow-300 transition"
            onClick={() => setIsOpen(false)}
          >
            <FaSignInAlt color="#91ff00" /> Iniciar Sesión
          </Link>
        </div>
      )}
    </nav>
  );
}
