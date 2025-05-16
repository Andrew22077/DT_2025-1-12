import { useState } from "react";
import campusBackground from "../assets/campus-unbosque.jpg";
import logoUnbosque from "../assets/Logo_Unbosque.png";
import logoGAC from "../assets/logo-GAC.jpg";
import logoPMI from "../assets/logo-PMI.png";

export function Menu() {
  const [activePanel, setActivePanel] = useState(null);

  const togglePanel = (panelName) => {
    setActivePanel((prev) => (prev === panelName ? null : panelName));
  };

  return (
    <div
      className="min-h-screen  flex items-center justify-center bg-cover bg-center bg-fixed p-4"
      style={{ backgroundImage: `url(${campusBackground})` }}
    >
      <div className="bg-white border-2 items-start border-orange-500 rounded-2xl shadow-xl p-8 max-w-6xl w-full mt-5">
        <h2 className="text-xl font-semibold text-green-700 mt-4 mb-2 text-center">
          🎯 Propósito de la Plataforma
        </h2>
        <p className="text-center">
          Esta herramienta permite evaluar de forma automatizada las
          competencias adquiridas por los estudiantes, apoyando la mejora
          continua y la alineación con estándares de acreditación internacional.
        </p>
        <br />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="text-center">
            <img
              src={logoGAC}
              alt="Global Accreditation Center"
              className="w-32 h-auto mx-auto cursor-pointer hover:scale-110 transition-transform duration-300"
              onClick={() => togglePanel("gac")}
            />
            {activePanel === "gac" && (
              <div className="text-gray-700 mt-4 text-left">
                <h2 className="text-xl font-semibold text-green-700 mb-2">
                  📌 ¿Qué es el GAC?
                </h2>
                <p>
                  El Global Accreditation Center (GAC) es el organismo de
                  acreditación del Project Management Institute (PMI) que
                  certifica programas académicos en gerencia de proyectos a
                  nivel mundial. Garantiza que los programas acreditados cumplan
                  con estándares rigurosos de formación profesional en dirección
                  de proyectos.
                </p>
              </div>
            )}
          </div>
          <div className="text-center">
            <img
              src={logoPMI}
              alt="Project Management Institute"
              className="w-32 h-auto mx-auto cursor-pointer hover:scale-110 transition-transform duration-300"
              onClick={() => togglePanel("pmi")}
            />
            {activePanel === "pmi" && (
              <div className="text-gray-700 mt-4 text-left">
                <h2 className="text-xl font-semibold text-green-700 mb-2">
                  📌 ¿Qué es el PMI?
                </h2>
                <p>
                  El Project Management Institute (PMI) es la organización líder
                  global en estándares, certificaciones y desarrollo profesional
                  en gestión de proyectos. Establece marcos de referencia
                  reconocidos internacionalmente para asegurar la calidad en la
                  gestión de proyectos.
                </p>
              </div>
            )}
          </div>
          <div className="text-center">
            <img
              src={logoUnbosque}
              alt="Universidad El Bosque"
              className="w-32 h-auto mx-auto cursor-pointer hover:scale-110 transition-transform duration-300"
              onClick={() => togglePanel("unbosque")}
            />
            {activePanel === "unbosque" && (
              <div className="text-gray-700 mt-4 text-left">
                <h2 className="text-xl font-semibold text-green-700 mb-2">
                  🏛️ Universidad El Bosque
                </h2>
                <p>
                  La Universidad El Bosque es una institución de educación
                  superior colombiana, reconocida por su compromiso con la
                  innovación, la investigación y la formación integral de
                  profesionales con enfoque en sostenibilidad y responsabilidad
                  social.
                </p>
              </div>
            )}
          </div>
          <div className="text-center">
            <div
              className="w-32 h-32 mx-auto bg-orange-100 rounded-xl flex items-center justify-center cursor-pointer hover:bg-orange-200 transition"
              onClick={() => togglePanel("gerencias")}
            >
              <span className="text-lg font-semibold text-green-800 text-center">
                🎓 Gerencias
              </span>
            </div>
            {activePanel === "gerencias" && (
              <div className="text-gray-700 mt-4 text-left">
                <h2 className="text-xl font-semibold text-green-700 mb-2">
                  🎓 Especialización y Maestría en Gerencia de Proyectos
                </h2>
                <p>
                  Diseñados para formar líderes capaces de gestionar proyectos
                  complejos en entornos dinámicos. Estos programas siguen los
                  lineamientos del PMI y GAC, desarrollando competencias
                  técnicas, estratégicas y personales.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
