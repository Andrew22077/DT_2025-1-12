import React from "react";
import logoUnbosque from "../assets/Logo_Unbosque.png";
import logoGAC from "../assets/logo-GAC.jpg";

const students = [
  {
    cedula: "1032323323",
    nombre: "Juan Olivera",
    correo: "12@unbosque.edu.co",
  },
  {
    cedula: "100232132",
    nombre: "Victor Ortiz",
    correo: "12@unbosuque.edu.co",
  },
  {
    cedula: "13232233",
    nombre: "Brayan Holguin",
    correo: "12@unbosque.edu.co",
  },
  {
    cedula: "132132234",
    nombre: "Andres Arquez",
    correo: "12@unbosque.edu.co",
  },
];
export default function Menu() {
  return (
    <div className="min-h-screen bg-[#F8F9F5] p-6 rounded-[40px] flex flex-row gap-6">
      {/* Tabla de estudiantes */}
      <div className="w-2/3 bg-white border border-[#D9D9D9] rounded-xl shadow-sm overflow-auto">
        <table className="min-w-full table-auto text-sm text-left">
          <thead className="bg-[#3A5D23] text-white">
            <tr>
              <th className="px-4 py-3">Cédula</th>
              <th className="px-4 py-3">Nombre Estu</th>
              <th className="px-4 py-3">Correo</th>
              <th className="px-4 py-3">Realizar Prueba de Competencias</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s, index) => (
              <tr key={index} className="even:bg-[#F1F1F1]">
                <td className="px-4 py-2">{s.cedula}</td>
                <td className="px-4 py-2">{s.nombre}</td>
                <td className="px-4 py-2">{s.correo}</td>
                <td className="px-4 py-2">
                  <button className="bg-[#F28E20] text-white px-4 py-1.5 rounded-md shadow hover:bg-[#d97414] transition-all">
                    Botón
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Panel de imágenes */}
      <div className="w-1/3 flex flex-col gap-6">
        <div className="bg-white border border-[#D9D9D9] rounded-xl h-52 flex items-center justify-center shadow-sm p-4">
          <img
            src={logoGAC}
            alt="Global Accreditation Center"
            className="h-full max-h-40 object-contain"
          />
        </div>
        <div className="bg-white border border-[#D9D9D9] rounded-xl h-52 flex items-center justify-center shadow-sm p-4">
          <img
            src={logoUnbosque}
            alt="Universidad El Bosque"
            className="h-full max-h-40 object-contain"
          />
        </div>
      </div>
    </div>
  );
}
