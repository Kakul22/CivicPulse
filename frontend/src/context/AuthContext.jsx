import { createContext, useContext, useState, useCallback } from "react";
import { api } from "../api.js";

const AuthContext = createContext(null);

const STORAGE_KEY = "civicpulse_auth";

// JWT = header.payload.signature. The payload (base64url JSON) holds `exp`,
// the expiry time in seconds. We read it so we never restore a dead session.
function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return !payload.exp || payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

function loadSavedSession() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved?.token && saved?.user && !isTokenExpired(saved.token)) return saved;
  } catch {
    // corrupted or blocked storage: treat as logged out
  }
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  return { user: null, token: null };
}

function saveSession(session) {
  try {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // private mode etc: app still works, just won't persist
  }
}

export function AuthProvider({ children }) {
  // Lazy initialiser: runs once, synchronously, so protected pages don't
  // flash a redirect to /login before the saved session is read.
  const [session, setSession] = useState(loadSavedSession);

  const applySession = useCallback((data) => {
    const next = { user: data.user, token: data.token };
    setSession(next);
    saveSession(next);
  }, []);

  const signup = useCallback(
    async ({ name, email, password, role }) => {
      applySession(await api.signup({ name, email, password, role }));
    },
    [applySession]
  );

  const login = useCallback(
    async ({ email, password }) => {
      applySession(await api.login({ email, password }));
    },
    [applySession]
  );

  const logout = useCallback(() => {
    setSession({ user: null, token: null });
    saveSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user: session.user, token: session.token, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside an AuthProvider");
  return ctx;
}
