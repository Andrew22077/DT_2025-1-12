import React from "react";
import { Link } from "react-router-dom";
import backgroundImage from "../assets/campus-unbosque.jpg";
import profesoresImg from "../assets/profesores.jpg";
import estudiantesImg from "../assets/estudiantes.jpg";
import informesImg from "../assets/informes.jpg";
import configuracionImg from "../assets/configuracion.png";

const menuItems = [
  {
    image: profesoresImg,
    label: "Profesores",
    link: "/teacher-list",
  },
  {
    image: estudiantesImg,
    label: "Estudiantes",
    link: "/student-list",
  },
  {
    image: informesImg,
    label: "Informes",
    link: "/informes",
  },
  {
    image: configuracionImg,
    label: "Configuración",
    link: "/editar-perfil",
  },
];

export default function MenuAdmin() {
  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-start justify-center p-8"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 bg-white/90 p-16 rounded-[40px] border-4 border-[#3399FF] shadow-2xl max-w-[1000px] w-full aspect-square max-h-[80vh]">
        {menuItems.map((item, index) => (
          <Link
            key={index}
            to={item.link}
            className="flex flex-col items-center justify-center border-2 border-[#99CCFF] rounded-[30px] p-6 bg-[#E6F2FF] hover:bg-[#3399FF] transition-all cursor-pointer transform hover:scale-105 active:scale-95"
          >
            <img src={item.image} alt={item.label} className="" />
            <p className="font-bold text-xl text-[#003366]">{item.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
