import { useEffect, useRef, useState } from "react";
import "../styles/camera.css";

function describeError(err) {
  switch (err?.name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
      return "Camera permission was blocked. Click the camera/lock icon in your browser's address bar, allow camera access, then try again.";
    case "NotFoundError":
    case "DevicesNotFoundError":
      return "No camera was found on this device.";
    case "NotReadableError":
      return "The camera is being used by another app. Close it and try again.";
    default:
      return "Couldn't start the camera on this browser.";
  }
}

// A live in-app camera: opens the device camera (webcam on laptops, rear
// camera on phones), shows a preview, and turns the captured frame into a
// JPEG File that the form uploads exactly like a gallery photo.
export default function CameraCapture({ onCapture, onClose, onFallback }) {
  const videoRef = useRef(null);
  const [facing, setFacing] = useState("environment"); // 'environment' = rear, 'user' = front
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let stream = null;

    async function start() {
      setReady(false);
      setError("");
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facing } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => {});
          setReady(true);
        }
      } catch (err) {
        if (!cancelled) setError(describeError(err));
      }
    }

    start();

    // Cleanup: always release the camera (the "camera in use" light goes off).
    return () => {
      cancelled = true;
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [facing]);

  function handleCapture() {
    const video = videoRef.current;
    if (!video || !ready) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("Couldn't capture the photo. Please try again.");
          return;
        }
        const file = new File([blob], `issue-photo-${Date.now()}.jpg`, { type: "image/jpeg" });
        onCapture(file);
      },
      "image/jpeg",
      0.9
    );
  }

  return (
    <div className="camera-overlay" role="dialog" aria-modal="true" aria-label="Take a photo">
      <div className="camera-modal">
        <div className="camera-header">
          <strong>Take a photo</strong>
          <button type="button" className="camera-close" onClick={onClose} aria-label="Close camera">
            ✕
          </button>
        </div>

        {error ? (
          <div className="camera-error">
            <p>{error}</p>
            <div className="camera-error-actions">
              {onFallback && (
                <button type="button" className="btn btn-primary" onClick={onFallback}>
                  Open device camera app
                </button>
              )}
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="camera-stage">
              <video ref={videoRef} playsInline muted autoPlay className="camera-video" />
              {!ready && <div className="camera-loading">Starting camera…</div>}
            </div>
            <div className="camera-controls">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setFacing((f) => (f === "environment" ? "user" : "environment"))}
              >
                Flip camera
              </button>
              <button
                type="button"
                className="camera-shutter"
                onClick={handleCapture}
                disabled={!ready}
                aria-label="Capture photo"
              />
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
