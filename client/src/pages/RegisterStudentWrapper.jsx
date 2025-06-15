// src/components/RegisterStudentWrapper.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import RegisterStudentPage from "./RegisterStudentPage";
import { getEstudiante } from "../api/UserApi";

const RegisterStudentWrapper = () => {
  const { id } = useParams();
  const [estudiante, setEstudiante] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getEstudiante(id);
        setEstudiante(res);
      } catch (error) {
        console.error("Error al cargar estudiante:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) return <p>Cargando datos del estudiante...</p>;

  return <RegisterStudentPage editing={true} estudiante={estudiante} />;
};

export default RegisterStudentWrapper;