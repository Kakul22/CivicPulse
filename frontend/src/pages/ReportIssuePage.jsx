import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api.js";

const CATEGORIES = [
  { value: "garbage", label: "Garbage" },
  { value: "road", label: "Road" },
  { value: "streetlight", label: "Streetlight" },
  { value: "water", label: "Water" },
  { value: "other", label: "Other" },
];

export default function ReportIssuePage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "garbage",
    address: "",
  });
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Your browser doesn't support location. Enter an address instead.");
      return;
    }
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setLocating(false);
      },
      () => {
        setError("Couldn't get your location. You can still enter an address below.");
        setLocating(false);
      }
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!coords) {
      setError("Please share your location so we can pin this issue on the map.");
      return;
    }

    setSubmitting(true);
    try {
      await api.createIssue(
        {
          title: form.title,
          description: form.description,
          category: form.category,
          address: form.address || null,
          latitude: coords.latitude,
          longitude: coords.longitude,
        },
        token
      );
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Report an issue</h1>
          <p>Give enough detail that someone else could find and understand it.</p>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            placeholder="e.g. Overflowing garbage bin near the park gate"
            maxLength={150}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="What's the issue? How long has it been there?"
            required
          />
        </div>

        <div className="field">
          <label>Category</label>
          <div className="category-picker">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                className={`category-option ${form.category === c.value ? "selected" : ""}`}
                onClick={() => updateField("category", c.value)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label htmlFor="address">Address or landmark (optional)</label>
          <input
            id="address"
            type="text"
            value={form.address}
            onChange={(e) => updateField("address", e.target.value)}
            placeholder="e.g. Near Sector 12 market"
          />
        </div>

        <div className="field">
          <label>Location</label>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={useMyLocation}
            disabled={locating}
          >
            {locating
              ? "Getting location…"
              : coords
                ? "📍 Location captured — tap to refresh"
                : "📍 Use my current location"}
          </button>
          <span className="field-hint">
            We use this to pin the issue accurately for others nearby.
          </span>
        </div>

        <button className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? "Submitting…" : "Submit report"}
        </button>
      </form>
    </div>
  );
}
