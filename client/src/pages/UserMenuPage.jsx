import React from "react";
import { Link } from "react-router-dom";
import backgroundImage from "../assets/campus-unbosque.jpg";

import estudiantesImg from "../assets/estudiantes.jpg";
import informesImg from "../assets/informes.jpg";
import configuracionImg from "../assets/configuracion.png";

const menuItemsTop = [
  { label: "Estudiantes", image: estudiantesImg, link: "/student-list" },
  { label: "Informes", image: informesImg, link: "/informes" },
];

export default function TeacherMenu() {
  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-center p-8"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="bg-white/90 p-12 rounded-[40px] border-4 border-[#3399FF] shadow-2xl w-full max-w-[900px]">
        {/* Parte superior: 2 ítems */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {menuItemsTop.map((item, index) => (
            <Link
              key={index}
              to={item.link}
              className="flex flex-col items-center justify-center border-2 border-[#99CCFF] rounded-2xl p-6 bg-[#E6F2FF] hover:bg-[#3399FF] transition hover:scale-105 active:scale-95"
            >
              <img
                src={item.image}
                alt={item.label}
                className="w-[1500px] h-[200px] object-contain mb-4 rounded-[20px] shadow-lg hover:shadow-2xl transition-shadow duration-300 transform hover:scale-105 active:scale-95"
              />
              <p className="text-lg font-bold text-[#003366]">{item.label}</p>
            </Link>
          ))}
        </div>

        <Link
          to="/editar-perfil"
          className="block text-center border-2 border-[#99CCFF] rounded-2xl p-6 bg-[#E6F2FF] hover:bg-[#3399FF] transition hover:scale-105 active:scale-95"
        >
          <img
            src={configuracionImg}
            alt="Configuración"
            className="w-[300px] h-[200px] mx-auto object-contain mb-4 rounded-[20px] shadow-lg hover:shadow-2xl transition-shadow duration-300 transform hover:scale-105 active:scale-95"
          />
          <p className="text-xl font-bold text-[#003366]">Configuración</p>
        </Link>
      </div>
    </div>
  );
}
