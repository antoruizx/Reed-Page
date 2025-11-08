import { useState } from "react";
import axios from "axios";
import "../Styles/Login.css";

export default function LoginPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("http://localhost:8000/api/auth/login", form);

      if (res.data && res.data.token) {
        localStorage.setItem("token", res.data.token);
        setMessage("✅ Inicio de sesión exitoso");
      } else {
        setMessage("❌ Credenciales incorrectas");
      }
    } catch (err) {
      setMessage("❌ Error al iniciar sesión");
    }
  };

  return (
    <div className="login-section">
      <div className="login-container">
        <h2>Iniciar sesión</h2>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="tuemail@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label>Contraseña</label>
            <input
              type="password"
              name="password"
              placeholder="********"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="btn-login">
            Iniciar sesión
          </button>

          {message && <p className="message">{message}</p>}
        </form>

        <div className="signup-link">
          <p>¿Sos nuevo?</p>
          <a href="http://localhost:5173/signin" className="btn-register">
            ¡Registrate!
          </a>
        </div>
      </div>
    </div>
  );
}
