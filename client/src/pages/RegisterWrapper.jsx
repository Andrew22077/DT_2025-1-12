// src/components/RegisterWrapper.js
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import RegisterPage from "./RegisterPage";
import { getProfesor } from "../api/UserApi";

const RegisterWrapper = () => {
  const { id } = useParams();
  const [profesor, setProfesor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getProfesor(id);
        setProfesor(res);
      } catch (error) {
        console.error("Error al cargar profesor:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) return <p>Cargando datos del profesor...</p>;

  return <RegisterPage editing={true} profesor={profesor} />;
};

export default RegisterWrapper;
