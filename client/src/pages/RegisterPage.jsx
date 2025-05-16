import React, { useState, useEffect } from "react";
import { registerProfesor, updateProfesor } from "../api/UserApi";

const RegisterPage = ({ editing = false, profesor = null }) => {
  const [form, setForm] = useState({
    cedula: "",
    nombre: "",
    correo: "",
    contrasenia: "",
  });

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (editing && profesor) {
      setForm({
        cedula: profesor.cedula || "",
        nombre: profesor.nombre || "",
        correo: profesor.correo || "",
        contrasenia: "", // No se llena por seguridad
      });
    }
  }, [editing, profesor]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    try {
      if (editing && profesor?.id) {
        await updateProfesor(profesor.id, form);
        setMensaje("Profesor actualizado con éxito.");
      } else {
        const data = await registerProfesor(form);
        setMensaje(data.mensaje || "Registro exitoso");
        setForm({ cedula: "", nombre: "", correo: "", contrasenia: "" });
      }
    } catch {
      setError("Ocurrió un error. Verifica los campos.");
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded shadow-md mt-10">
      <h2 className="text-2xl font-bold mb-4 text-center text-green-700">
        {editing ? "Editar Profesor" : "Registrar Profesor"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="cedula"
          placeholder="Cédula"
          value={form.cedula}
          onChange={handleChange}
          required
          className="w-full border px-3 py-2 rounded"
        />
        <input
          type="text"
          name="nombre"
          placeholder="Nombre"
          value={form.nombre}
          onChange={handleChange}
          required
          className="w-full border px-3 py-2 rounded"
        />
        <input
          type="email"
          name="correo"
          placeholder="Correo"
          value={form.correo}
          onChange={handleChange}
          required
          className="w-full border px-3 py-2 rounded"
        />
        {!editing && (
          <input
            type="password"
            name="contrasenia"
            placeholder="Contraseña"
            value={form.contrasenia}
            onChange={handleChange}
            required
            className="w-full border px-3 py-2 rounded"
          />
        )}
        <button
          type="submit"
          className="w-full bg-green-700 text-white py-2 rounded hover:bg-green-800"
        >
          {editing ? "Actualizar" : "Registrar"}
        </button>
      </form>

      {mensaje && <p className="text-green-600 mt-4">{mensaje}</p>}
      {error && <p className="text-red-600 mt-4">{error}</p>}
    </div>
  );
};

export default RegisterPage;
