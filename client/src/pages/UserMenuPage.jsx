import React from "react";
import { Link } from "react-router-dom";
import backgroundImage from "../assets/campus-unbosque.jpg";

import estudiantesImg from "../assets/estudiantes.jpg";
import informesImg from "../assets/informes.jpg";
import configuracionImg from "../assets/configuracion.png";

const menuItems = [
  { label: "Estudiantes", image: estudiantesImg, link: "/student-list" },
  { label: "Resultados", image: informesImg, link: "/resultados-estudiantes" },
  { label: "Editar Perfil", image: configuracionImg, link: "/editar-perfil" },
  { label: "Evaluar", image: informesImg, link: "/evaluacion-estudiantes" }, // Usando la misma imagen por ahora
];

export default function TeacherMenu() {
  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-center p-8"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="bg-white/90 p-12 rounded-[40px] border-4 border-[#3399FF] shadow-2xl w-full max-w-[900px]">
        {/* Grid de 4 botones en 2x2 */}
        <div className="grid grid-cols-2 gap-6">
          {menuItems.map((item, index) => (
            <Link
              key={index}
              to={item.link}
              className="flex flex-col items-center justify-center border-2 border-[#99CCFF] rounded-2xl p-6 bg-[#E6F2FF] hover:bg-[#3399FF] transition hover:scale-105 active:scale-95"
            >
              <img
                src={item.image}
                alt={item.label}
                className="w-[300px] h-[200px] object-contain mb-4 rounded-[20px] shadow-lg hover:shadow-2xl transition-shadow duration-300 transform hover:scale-105 active:scale-95"
              />
              <p className="text-lg font-bold text-[#003366]">{item.label}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
