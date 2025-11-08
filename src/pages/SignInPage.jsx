import { useState } from "react";
import axios from "axios";

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
      const res = await axios.post("http://localhost:8000/api/auth/register", form);
      setMessage("✅ Registro exitoso");
    } catch (err) {
      setMessage("❌ Error al registrar usuario");
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: "500px" }}>
      <h2 className="text-center mb-4">Crear Cuenta</h2>
      <form onSubmit={handleSubmit}>
        <input name="username" placeholder="Nombre completo" className="form-control mb-3" onChange={handleChange} />
        <input name="email" placeholder="Email" className="form-control mb-3" onChange={handleChange} />
        <input name="phone" placeholder="Número de teléfono" className="form-control mb-3" onChange={handleChange} />
        <input name="country" placeholder="País" className="form-control mb-3" onChange={handleChange} />
        <input name="province" placeholder="Provincia" className="form-control mb-3" onChange={handleChange} />
        <input name="password" type="password" placeholder="Contraseña" className="form-control mb-3" onChange={handleChange} />
        <input name="confirmPassword" type="password" placeholder="Repetir contraseña" className="form-control mb-3" onChange={handleChange} />
        <button className="btn btn-success w-100" type="submit">Registrarse</button>
      </form>
      {message && <p className="mt-3 text-center">{message}</p>}
    </div>
  );
}
