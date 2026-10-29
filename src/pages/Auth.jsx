import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { usePageTitle } from "../components/usePageTitle";

function AuthShell({ title, children, aside }) {
  return (
    <div className="auth-page">
      <div className="auth-photo" aria-hidden="true">
        <img src="/img/products/buzo-arena.jpg" alt="" />
      </div>
      <div className="auth-panel">
        <h1 className="page-title">{title}</h1>
        {children}
        <div className="auth-aside">{aside}</div>
      </div>
    </div>
  );
}

function useAfterAuth() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;
  return (user) => navigate(from || (user.role === "admin" ? "/admin" : "/cuenta"), { replace: true });
}

export function Login() {
  usePageTitle("Iniciar sesión");
  const { login, user } = useAuth();
  const location = useLocation();
  const goNext = useAfterAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [state, setState] = useState({ sending: false, error: null });

  if (user && !state.sending) return <Navigate to="/cuenta" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setState({ sending: true, error: null });
    try {
      goNext(await login(form.email, form.password));
    } catch (err) {
      setState({ sending: false, error: err.message });
    }
  };

  return (
    <AuthShell
      title="Iniciar sesión"
      aside={
        <p>
          ¿Primera vez en Reed?{" "}
          <Link to="/registro" state={location.state} className="link">
            Creá tu cuenta
          </Link>
        </p>
      }
    >
      <form className="form-grid" onSubmit={submit}>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" className="input" type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="password">Contraseña</label>
          <input id="password" className="input" type="password" autoComplete="current-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        {state.error && (
          <p className="alert alert-error" role="alert">
            {state.error}
          </p>
        )}
        <button className="btn btn-dark btn-block" disabled={state.sending}>
          {state.sending ? "Ingresando…" : "Iniciar sesión"}
        </button>
      </form>
    </AuthShell>
  );
}

export function Register() {
  usePageTitle("Crear cuenta");
  const { register, user } = useAuth();
  const goNext = useAfterAuth();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [state, setState] = useState({ sending: false, error: null, fields: {} });

  if (user && !state.sending) return <Navigate to="/cuenta" replace />;

  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) {
      return setState({ sending: false, error: null, fields: { password: "Usá al menos 8 caracteres" } });
    }
    if (form.password !== form.confirm) {
      return setState({ sending: false, error: null, fields: { confirm: "Las contraseñas no coinciden" } });
    }
    setState({ sending: true, error: null, fields: {} });
    try {
      const { confirm: _confirm, ...data } = form;
      goNext(await register(data));
    } catch (err) {
      setState({ sending: false, error: err.message, fields: err.details || {} });
    }
  };

  const f = state.fields;

  return (
    <AuthShell
      title="Crear cuenta"
      aside={
        <p>
          ¿Ya tenés cuenta?{" "}
          <Link to="/ingresar" className="link">
            Iniciá sesión
          </Link>
        </p>
      }
    >
      <form className="form-grid" onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="name">Nombre y apellido</label>
          <input id="name" name="name" className="input" autoComplete="name" required value={form.name} onChange={set} />
        </div>
        <div className="form-row">
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" className="input" type="email" autoComplete="email" required value={form.email} onChange={set} aria-invalid={!!f.email} />
            {f.email && <span className="error-text">{f.email}</span>}
          </div>
          <div className="field">
            <label htmlFor="phone">Teléfono (opcional)</label>
            <input id="phone" name="phone" className="input" type="tel" autoComplete="tel" value={form.phone} onChange={set} />
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input id="password" name="password" className="input" type="password" autoComplete="new-password" required value={form.password} onChange={set} aria-invalid={!!f.password} />
            {f.password ? <span className="error-text">{f.password}</span> : <span className="hint">Mínimo 8 caracteres</span>}
          </div>
          <div className="field">
            <label htmlFor="confirm">Repetí la contraseña</label>
            <input id="confirm" name="confirm" className="input" type="password" autoComplete="new-password" required value={form.confirm} onChange={set} aria-invalid={!!f.confirm} />
            {f.confirm && <span className="error-text">{f.confirm}</span>}
          </div>
        </div>
        {state.error && (
          <p className="alert alert-error" role="alert">
            {state.error}
          </p>
        )}
        <button className="btn btn-dark btn-block" disabled={state.sending}>
          {state.sending ? "Creando tu cuenta…" : "Crear cuenta"}
        </button>
      </form>
    </AuthShell>
  );
}
