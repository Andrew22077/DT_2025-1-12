import campusBackground from "../assets/campus-unbosque.jpg";
import logoUnbosque from "../assets/Logo_Unbosque.png";
import logoGAC from "../assets/logo-GAC.jpg";
import logoPMI from "../assets/logo-PMI.png";

export function Information() {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-fixed"
      style={{
        backgroundImage: `url(${campusBackground})`,
      }}
    >
      <div className="bg-white border-2 border-orange-500 rounded-lg shadow-lg p-8 max-w-4xl w-full mt-12">
        <h1 className="text-3xl font-bold text-green-800 mb-4">
          🧭 Herramienta para Medición de Competencias del GAC
        </h1>
        <p className="text-lg text-gray-700 mb-6">
          Esta plataforma está diseñada para medir y evaluar las competencias
          clave exigidas por el Global Accreditation Center (GAC) del Project
          Management Institute (PMI) en estudiantes de los programas de posgrado
          en gerencia de proyectos de la Universidad El Bosque. Su propósito es
          asegurar que los estudiantes desarrollen las capacidades necesarias
          para liderar proyectos de manera efectiva, alineándose con estándares
          internacionales de calidad.
        </p>

        <h2 className="text-2xl font-semibold text-green-700 mb-3">
          📌 ¿Qué es el GAC?
        </h2>
        <p className="text-lg text-gray-700 mb-6">
          El Global Accreditation Center (GAC) es el organismo de acreditación
          del Project Management Institute (PMI) que certifica programas
          académicos en gerencia de proyectos a nivel mundial. Garantiza que los
          programas acreditados cumplan con estándares rigurosos de formación
          profesional en dirección de proyectos, evaluando aspectos como el
          currículo, la calidad docente y los resultados de aprendizaje.
        </p>

        {/* Logo del GAC */}
        <div className="flex justify-center mb-6">
          <img
            src={logoGAC}
            alt="Global Accreditation Center"
            className="w-36 h-auto object-contain"
          />
        </div>

        <h2 className="text-2xl font-semibold text-green-700 mb-3">
          📌 ¿Qué es el PMI?
        </h2>
        <p className="text-lg text-gray-700 mb-6">
          El Project Management Institute (PMI) es la organización líder a nivel
          global en estándares, certificaciones y desarrollo profesional en
          gestión de proyectos. Con presencia en más de 200 países, el PMI
          establece marcos de referencia reconocidos internacionalmente para
          asegurar que los proyectos se gestionen con calidad, eficiencia y
          alineación estratégica.
        </p>

        {/* Logo del PMI */}
        <div className="flex justify-center mb-6">
          <img
            src={logoPMI}
            alt="Project Management Institute"
            className="w-36 h-auto object-contain"
          />
        </div>

        <h2 className="text-2xl font-semibold text-green-700 mb-3">
          🏛️ ¿Qué es la Universidad El Bosque?
        </h2>
        <p className="text-lg text-gray-700 mb-6">
          La Universidad El Bosque es una institución de educación superior en
          Colombia, reconocida por su compromiso con la innovación, la
          investigación y la formación integral de profesionales. Ofrece
          programas de pregrado, especialización y maestría en diversas áreas,
          destacándose por su enfoque en responsabilidad social y
          sostenibilidad.
        </p>

        {/* Logo de la Universidad El Bosque */}
        <div className="flex justify-center mb-6">
          <img
            src={logoUnbosque}
            alt="Universidad El Bosque"
            className="w-36 h-auto object-contain"
          />
        </div>

        <h2 className="text-2xl font-semibold text-green-700 mb-3">
          🎓 Especialización y Maestría en Gerencia de Proyectos
        </h2>
        <p className="text-lg text-gray-700 mb-6">
          Los programas de Especialización y Maestría en Gerencia de Proyectos
          de la Universidad El Bosque están diseñados para formar líderes
          capaces de gestionar proyectos complejos en entornos dinámicos. Estos
          programas abordan competencias técnicas, estratégicas y personales,
          siguiendo los lineamientos del PMI y del GAC, y preparan a los
          estudiantes para asumir retos en sectores públicos y privados.
        </p>

        <h2 className="text-2xl font-semibold text-green-700 mb-3">
          🎯 Propósito de la Plataforma
        </h2>
        <p className="text-lg text-gray-700 mb-6">
          Esta herramienta permite evaluar de forma automatizada y objetiva las
          competencias adquiridas por los estudiantes, generando informes
          detallados que apoyan tanto la mejora continua de los programas
          académicos como la alineación con los estándares de acreditación
          internacional. El objetivo final es garantizar que los egresados estén
          preparados para enfrentar los desafíos actuales de la gerencia de
          proyectos a nivel global.
        </p>
      </div>
    </div>
  );
}
