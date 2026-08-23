import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function AuthPage() {
  const [mode, setMode] = useState("login"); // 'login' | 'signup'
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, signup } = useAuth();
  const navigate = useNavigate();

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login({ email: form.email, password: form.password });
      } else {
        await signup(form);
      }
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <p className="auth-subtitle">
          {mode === "login"
            ? "Log in to report issues and upvote what matters."
            : "Join CivicPulse to start reporting issues in your area."}
        </p>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {mode === "signup" && (
            <div className="field">
              <label htmlFor="name">Full name</label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Kakul Mittal"
                required
              />
            </div>
          )}

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => updateField("password", e.target.value)}
              placeholder="At least 6 characters"
              minLength={6}
              required
            />
          </div>

          <button className="btn btn-primary btn-block" disabled={loading}>
            {loading
              ? "Please wait…"
              : mode === "login"
                ? "Log in"
                : "Create account"}
          </button>
        </form>

        <div className="auth-switch">
          {mode === "login" ? "New to CivicPulse?" : "Already have an account?"}
          <button
            onClick={() => {
              setError("");
              setMode(mode === "login" ? "signup" : "login");
            }}
          >
            {mode === "login" ? "Sign up" : "Log in"}
          </button>
        </div>
      </div>
    </div>
  );
}
