import React from "react";
import "./Login.css";

const Login = () => {
  return (
    <div className="login-container">
      <h2 className="login-title">Iniciar Sesión</h2>
      <form className="login-form">
        <label>Email institucional</label>
        <input type="email" placeholder="ejemplo@unbosque.edu.co" required />

        <label>Contraseña</label>
        <input type="password" placeholder="••••••••" required />

        <button type="submit">Entrar</button>
      </form>
    </div>
  );
};

export default Login;
