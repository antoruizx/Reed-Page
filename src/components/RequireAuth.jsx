import { Navigate, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";

export default function RequireAuth({ children, admin = false }) {
  const { user, ready, isAdmin } = useAuth();
  const location = useLocation();

  if (!ready) return <div className="spinner" role="status" aria-label="Cargando" />;
  if (!user) {
    return <Navigate to="/ingresar" replace state={{ from: location.pathname + location.search }} />;
  }
  if (admin && !isAdmin) return <Navigate to="/" replace />;
  return children;
}
