import { useEffect, useRef, useState } from "react";

const MAX_WIDTH = 1600; // keeps the JPEG well under the 5 MB upload limit

// In-app camera. The old `<input capture>` trick only opens a camera on
// phones; desktop browsers ignore it and show a normal file picker.
// getUserMedia gives us a real live camera everywhere (HTTPS or localhost).
export default function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fallbackInputRef = useRef(null);

  const [facing, setFacing] = useState("environment"); // rear camera first
  const [status, setStatus] = useState("starting"); // starting | ready | error
  const [errorMsg, setErrorMsg] = useState("");
  const [canSwitch, setCanSwitch] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      setStatus("starting");

      if (!navigator.mediaDevices?.getUserMedia) {
        setErrorMsg("Camera isn't available in this browser (it needs HTTPS or localhost).");
        setStatus("error");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facing }, width: { ideal: 1920 } },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setStatus("ready");

        // Device names are only visible after permission is granted.
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (!cancelled) setCanSwitch(devices.filter((d) => d.kind === "videoinput").length > 1);
      } catch (err) {
        if (cancelled) return;
        if (err.name === "NotAllowedError" || err.name === "SecurityError") {
          setErrorMsg("Camera permission was blocked. Allow camera access in your browser's address bar and try again.");
        } else if (err.name === "NotFoundError" || err.name === "OverconstrainedError") {
          setErrorMsg("No camera was found on this device.");
        } else if (err.name === "NotReadableError") {
          setErrorMsg("The camera is being used by another app. Close it and try again.");
        } else {
          setErrorMsg("Couldn't start the camera.");
        }
        setStatus("error");
      }
    }

    start();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [facing]);

  function handleCapture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    const scale = Math.min(1, MAX_WIDTH / video.videoWidth);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onCapture(new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.88
    );
  }

  function handleFallbackFile(e) {
    const file = e.target.files?.[0];
    if (file) onCapture(file);
  }

  return (
    <div className="camera-overlay" role="dialog" aria-modal="true" aria-label="Take a photo">
      <div className="camera-modal">
        <button type="button" className="camera-close" onClick={onClose} aria-label="Close camera">
          ✕
        </button>

        {status !== "error" && (
          <div className="camera-stage">
            <video ref={videoRef} className="camera-video" playsInline muted />
            {status === "starting" && <p className="camera-note">Starting camera…</p>}
          </div>
        )}

        {status === "error" && (
          <div className="camera-error">
            <p>{errorMsg}</p>
            {/* On a phone this opens the phone's own camera app. */}
            <button type="button" className="btn btn-ghost" onClick={() => fallbackInputRef.current?.click()}>
              Open device camera app
            </button>
          </div>
        )}

        <input
          ref={fallbackInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: "none" }}
          onChange={handleFallbackFile}
        />

        {status === "ready" && (
          <div className="camera-controls">
            {canSwitch ? (
              <button
                type="button"
                className="camera-side-btn"
                onClick={() => setFacing((f) => (f === "environment" ? "user" : "environment"))}
              >
                Flip
              </button>
            ) : (
              <span className="camera-side-btn camera-side-spacer" />
            )}
            <button type="button" className="camera-shutter" onClick={handleCapture} aria-label="Capture photo" />
            <button type="button" className="camera-side-btn" onClick={onClose}>
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
