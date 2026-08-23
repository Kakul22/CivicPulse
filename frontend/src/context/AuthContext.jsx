import { createContext, useContext, useState, useCallback } from "react";
import { api } from "../api.js";

const AuthContext = createContext(null);

// NOTE: we keep the token in React state only (no localStorage), so a full
// page refresh will log the user out. That's fine for now — the priority
// is getting the app working end to end first.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const signup = useCallback(async ({ name, email, password }) => {
    const data = await api.signup({ name, email, password });
    setUser(data.user);
    setToken(data.token);
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const data = await api.login({ email, password });
    setUser(data.user);
    setToken(data.token);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside an AuthProvider");
  return ctx;
}
