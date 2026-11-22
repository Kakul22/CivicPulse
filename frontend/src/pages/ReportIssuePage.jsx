import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api.js";
import LocationPicker from "../components/LocationPicker.jsx";
import CameraCapture from "../components/CameraCapture.jsx";

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
  const [location, setLocation] = useState(null); // { lat, lng }

  const [imagePreview, setImagePreview] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [showCamera, setShowCamera] = useState(false);

  // Duplicate detection state
  const [nearby, setNearby] = useState([]);
  const [supportedIds, setSupportedIds] = useState([]);
  const [supportingId, setSupportingId] = useState(null);
  const [supportMsg, setSupportMsg] = useState("");

  const galleryInputRef = useRef(null);

  // Whenever the pin or category changes, look for the same kind of unresolved
  // issue within 200 m. Debounced (500 ms) so dragging the pin doesn't fire a
  // request on every pixel; `cancelled` drops answers that arrive late.
  useEffect(() => {
    if (!location) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      api
        .getNearbyIssues({ lat: location.lat, lng: location.lng, category: form.category, radius: 200 }, token)
        .then((data) => {
          if (!cancelled) setNearby(data.issues);
        })
        .catch(() => {
          if (!cancelled) setNearby([]); // a failed check must never block reporting
        });
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [location, form.category, token]);

  async function handleSupport(issueId) {
    setSupportingId(issueId);
    try {
      const result = await api.toggleUpvote(issueId, token);
      // toggleUpvote is a toggle; we only call it for issues not yet supported,
      // so a result of upvoted === true is what we expect.
      if (result.upvoted) {
        setSupportedIds((prev) => [...prev, issueId]);
        setSupportMsg("Thanks. Your support was added to the existing report, so no new report is needed.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSupportingId(null);
    }
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleFileSelected(e) {
    uploadFile(e.target.files?.[0]);
  }

  function handleCameraCapture(file) {
    setShowCamera(false);
    uploadFile(file);
  }

  async function uploadFile(file) {
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
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!location) {
      setError("Please set a location — use your current location or tap the map.");
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
          latitude: location.lat,
          longitude: location.lng,
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

      {showCamera && (
        <CameraCapture onCapture={handleCameraCapture} onClose={() => setShowCamera(false)} />
      )}

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Photo</label>

          {!imagePreview && (
            <div className="photo-capture">
              <button
                type="button"
                className="photo-capture-btn"
                onClick={() => setShowCamera(true)}
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
          <LocationPicker value={location} onChange={setLocation} />
        </div>

        {supportMsg && <div className="duplicate-thanks">{supportMsg}</div>}

        {nearby.length > 0 && (
          <div className="duplicate-box">
            <h3>Similar issues already reported nearby</h3>
            <p className="field-hint">
              Is one of these the same problem? Supporting it helps the authority see how many people are affected.
            </p>
            {nearby.map((n) => {
              const alreadySupported = n.supported_by_me || supportedIds.includes(n.id);
              return (
                <div className="duplicate-item" key={n.id}>
                  <div>
                    <p className="duplicate-item-title">{n.title}</p>
                    <p className="duplicate-item-meta">
                      {n.distance_m} m away · {n.upvote_count} supporting
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    disabled={alreadySupported || supportingId === n.id}
                    onClick={() => handleSupport(n.id)}
                  >
                    {alreadySupported ? "Supported ✓" : supportingId === n.id ? "Saving…" : "I'm facing this too"}
                  </button>
                </div>
              );
            })}
            <p className="field-hint" style={{ marginTop: 10 }}>
              Different problem? Just continue and submit your report below.
            </p>
          </div>
        )}

        <button className="btn btn-primary btn-block" disabled={submitting || imageUploading}>
          {submitting ? "Submitting…" : "Submit report"}
        </button>
      </form>
    </div>
  );
}
