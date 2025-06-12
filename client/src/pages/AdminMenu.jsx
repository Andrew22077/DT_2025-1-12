import React from "react";
import { FaUserTie, FaUserGraduate, FaCog, FaChartBar } from "react-icons/fa";
import { FiFileText } from "react-icons/fi";
import { MdInsertChart } from "react-icons/md";
import backgroundImage from "../assets/campus-unbosque.jpg";

const menuItems = [
  { icon: <FaUserTie size={150} />, label: "Profesores" },
  { icon: <FaUserGraduate size={150} />, label: "Estudiantes" },
  { icon: <FiFileText size={150} />, label: "Informes" },
  { icon: <FaCog size={150} />, label: "Configuración" },
];

export default function MenuAdmin() {
  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-start justify-center p-8"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 bg-white/90 p-16 rounded-[40px] border-4 border-[#FFA500] shadow-2xl max-w-[1300px] w-full aspect-square max-h-[80vh]">
        {menuItems.map((item, index) => (
          <div
            key={index}
            className="flex flex-col items-center justify-center border-2 border-[#FFD580] rounded-3xl p-6 bg-[#FFF4E5] hover:bg-[#FFA500] transition-all"
          >
            <div className="text-[#000000]  mb-4">{item.icon}</div>
            <p className="font-bold text-xl text-[#333]">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
