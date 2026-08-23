import { useState, useRef } from "react";
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

  const [imagePreview, setImagePreview] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

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

  async function handleFileSelected(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImagePreview(URL.createObjectURL(file));
    setError("");
    setImageUploading(true);
    try {
      const { url } = await api.uploadImage(file, token);
      setImageUrl(url);
    } catch (err) {
      setError(err.message);
      setImagePreview(null);
    } finally {
      setImageUploading(false);
    }
  }

  function removeImage() {
    setImagePreview(null);
    setImageUrl(null);
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
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
          image_url: imageUrl || null,
        },
        token
      );
      navigate("/my-reports");
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
          <label>Photo</label>

          {!imagePreview && (
            <div className="photo-capture">
              <button
                type="button"
                className="photo-capture-btn"
                onClick={() => cameraInputRef.current?.click()}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 8a2 2 0 0 1 2-2h1.5l1-1.6A1 1 0 0 1 9.35 4h5.3a1 1 0 0 1 .85.4L16.5 6H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <circle cx="12" cy="13" r="3.3" stroke="currentColor" strokeWidth="1.6" />
                </svg>
                Take a photo
              </button>
              <button
                type="button"
                className="photo-capture-btn"
                onClick={() => galleryInputRef.current?.click()}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
                  <path d="m3 16 5-5 4 4 3-3 6 6" stroke="currentColor" strokeWidth="1.6" />
                  <circle cx="8" cy="9" r="1.4" fill="currentColor" />
                </svg>
                Choose from gallery
              </button>
            </div>
          )}

          {/* capture="environment" opens the rear camera on mobile devices */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: "none" }}
            onChange={handleFileSelected}
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFileSelected}
          />

          {imagePreview && (
            <div className="image-preview-wrap">
              <img className="image-preview" src={imagePreview} alt="Issue preview" />
              <button type="button" className="image-preview-remove" onClick={removeImage}>
                ✕
              </button>
            </div>
          )}
          {imageUploading && <p className="image-uploading-note">Uploading photo…</p>}
        </div>

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

        <button className="btn btn-primary btn-block" disabled={submitting || imageUploading}>
          {submitting ? "Submitting…" : "Submit report"}
        </button>
      </form>
    </div>
  );
}
