import { useState } from "react";
import axios from "axios";
import "../Styles/SignInPage.css"; 

export default function SignInPage() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    country: "",
    province: "",
    password: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      setMessage("❌ Las contraseñas no coinciden");
      return;
    }

    try {
      await axios.post("http://localhost:8000/api/auth/register", form);
      setMessage("✅ Registro exitoso");
    } catch (err) {
      setMessage("❌ Error al registrar usuario");
    }
  };

  return (
    <section className="signin-section">
      <div className="signin-container">
        <h2>Crear cuenta</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Nombre completo</label>
            <input
              name="username"
              type="text"
              placeholder="Ingresá tu nombre"
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label>Email</label>
            <input
              name="email"
              type="email"
              placeholder="Tu correo electrónico"
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label>Número de teléfono</label>
            <input
              name="phone"
              type="tel"
              placeholder="Ej: +54 11 5555 5555"
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label>País</label>
            <input
              name="country"
              type="text"
              placeholder="Ej: Argentina"
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label>Localidad</label>
            <input
              name="province"
              type="text"
              placeholder="Ej: Buenos Aires"
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label>Contraseña</label>
            <input
              name="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label>Repetir contraseña</label>
            <input
              name="confirmPassword"
              type="password"
              placeholder="Reingresá tu contraseña"
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="btn-signin">
            Registrarse
          </button>
        </form>

        {message && <p className="message">{message}</p>}

        <div className="login-link ">
          <p>¿Ya tenés cuenta?</p>
          <a href="/login" className="btn-login1">
            Iniciá sesión
          </a>
        </div>
      </div>
    </section>
  );
}
