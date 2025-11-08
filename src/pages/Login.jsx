import { useState } from "react";
import axios from "axios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:8000/api/auth/login", {
        email,
        password,
      }, { withCredentials: true });
      setMessage("✅ Login exitoso");
      localStorage.setItem("token", res.data.token);
    } catch (err) {
      setMessage("❌ Credenciales incorrectas");
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: "400px" }}>
      <h2 className="text-center mb-4">Iniciar Sesión</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label>Email</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label>Contraseña</label>
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button className="btn btn-primary w-100" type="submit">
          Entrar
        </button>
      </form>
      {message && <p className="mt-3 text-center">{message}</p>}
    </div>
  );
}
