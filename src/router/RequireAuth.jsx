// router/RequireAuth.jsx
import { Navigate } from "react-router-dom";
import axios from "axios";
import { useEffect, useState } from "react";

function RequireAuth({ children }) {
  const [authorized, setAuthorized] = useState(null);

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setAuthorized(false);
        return;
      }
      try {
        const res = await axios.get("http://localhost:8000/api/auth/verify", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAuthorized(true);
      } catch {
        setAuthorized(false);
      }
    };
    verifyToken();
  }, []);

  if (authorized === null) return <p>Cargando...</p>;
  return authorized ? children : <Navigate to="/login" />;
}

export default RequireAuth;
