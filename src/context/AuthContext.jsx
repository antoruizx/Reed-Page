import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, tokenStore } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  // Al cargar la página, si hay token, preguntamos quién es
  useEffect(() => {
    if (!tokenStore.get()) {
      setReady(true);
      return;
    }
    api("/auth/me")
      .then(({ user }) => setUser(user))
      .catch(() => tokenStore.set(null))
      .finally(() => setReady(true));
  }, []);

  const handleSession = useCallback(({ token, user }) => {
    tokenStore.set(token);
    setUser(user);
    return user;
  }, []);

  const login = useCallback(
    (email, password) => api("/auth/login", { method: "POST", body: { email, password } }).then(handleSession),
    [handleSession]
  );

  const register = useCallback(
    (data) => api("/auth/register", { method: "POST", body: data }).then(handleSession),
    [handleSession]
  );

  const logout = useCallback(() => {
    tokenStore.set(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, ready, login, register, logout, setUser, isAdmin: user?.role === "admin" }),
    [user, ready, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
