import { createContext, useContext, useState, useCallback } from "react";
import { api } from "../api.js";

const AuthContext = createContext(null);
const STORAGE_KEY = "civicpulse_auth";

// A JWT is three base64url parts: header.payload.signature. The payload
// contains `exp` (expiry, in seconds). We read it so we never restore a
// session that the server would reject anyway.
function isTokenExpired(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

function loadStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { user: null, token: null };
    const { user, token } = JSON.parse(raw);
    if (!user || !token || isTokenExpired(token)) {
      localStorage.removeItem(STORAGE_KEY);
      return { user: null, token: null };
    }
    return { user, token };
  } catch {
    return { user: null, token: null };
  }
}

function saveAuth(user, token) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, token }));
  } catch {
    // storage can be blocked (private mode) — app still works, just not persistent
  }
}

function clearAuth() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }) {
  // Lazy initialiser: runs once on first render, so a page refresh restores the session.
  const [auth, setAuth] = useState(loadStoredAuth);

  const signup = useCallback(async ({ name, email, password, role }) => {
    const data = await api.signup({ name, email, password, role });
    setAuth({ user: data.user, token: data.token });
    saveAuth(data.user, data.token);
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const data = await api.login({ email, password });
    setAuth({ user: data.user, token: data.token });
    saveAuth(data.user, data.token);
  }, []);

  const logout = useCallback(() => {
    setAuth({ user: null, token: null });
    clearAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user: auth.user, token: auth.token, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside an AuthProvider");
  return ctx;
}
