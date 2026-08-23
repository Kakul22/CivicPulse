import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import StatusStamp from "../components/StatusStamp.jsx";

function SkylineIllustration() {
  return (
    <svg
      className="hero-skyline"
      width="420"
      height="240"
      viewBox="0 0 420 240"
      fill="none"
    >
      <rect x="10" y="120" width="46" height="110" fill="#1e3a30" />
      <rect x="66" y="80" width="38" height="150" fill="#254539" />
      <rect x="114" y="140" width="52" height="90" fill="#1e3a30" />
      <rect x="176" y="60" width="42" height="170" fill="#2a5044" />
      <rect x="228" y="100" width="34" height="130" fill="#1e3a30" />
      <rect x="272" y="150" width="60" height="80" fill="#254539" />
      <rect x="342" y="90" width="40" height="140" fill="#2a5044" />
      {/* windows */}
      {Array.from({ length: 24 }).map((_, i) => (
        <rect
          key={i}
          x={20 + (i % 6) * 60}
          y={140 + Math.floor(i / 6) * 20}
          width="6"
          height="8"
          fill="#f0a93b"
          opacity="0.55"
        />
      ))}
      {/* pin */}
      <g transform="translate(150, 20)">
        <path
          d="M20 0C11 0 4 7 4 16c0 12 16 30 16 30s16-18 16-30c0-9-7-16-16-16Z"
          fill="#f0a93b"
        />
        <circle cx="20" cy="16" r="6" fill="#14231d" />
      </g>
    </svg>
  );
}

const STEPS = [
  {
    title: "Spot something off",
    desc: "A pothole, an overflowing bin, a dead streetlight — snap a photo right where it is.",
  },
  {
    title: "Drop a pin, report it",
    desc: "Your location is captured automatically so the right people know exactly where to look.",
  },
  {
    title: "Watch it get resolved",
    desc: "Track the status as it moves from Reported to In Progress to Resolved.",
  },
];

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <>
      <section className="hero">
        <SkylineIllustration />
        <div className="hero-inner">
          <span className="hero-eyebrow">Local issue reporting</span>
          <h1>
            Your city is listening. <em>Make sure it hears this.</em>
          </h1>
          <p className="hero-sub">
            CivicPulse turns the pothole outside your gate or the streetlight
            that's been out for weeks into something official — pinned,
            photographed, and impossible to ignore.
          </p>

          <div className="hero-actions">
            <Link
              to={user ? "/report" : "/login"}
              className="btn btn-on-ink btn-lg"
            >
              Report an issue
            </Link>
            <Link to="/issues" className="btn btn-outline-on-ink btn-lg">
              Browse what's reported
            </Link>
          </div>

          <div className="hero-plaques">
            <div className="hero-plaque">
              <div className="hero-plaque-label">Evidence</div>
              <div className="hero-plaque-value">Photo attached to every report</div>
            </div>
            <div className="hero-plaque">
              <div className="hero-plaque-label">Location</div>
              <div className="hero-plaque-value">Auto-pinned, no guessing</div>
            </div>
            <div className="hero-plaque">
              <div className="hero-plaque-label">Momentum</div>
              <div className="hero-plaque-value">Upvotes surface what matters</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <span className="section-eyebrow">How it works</span>
          <h2>Three steps, no bureaucracy</h2>
          <p>No forms to hunt down, no office to visit. Report it from wherever you're standing.</p>
        </div>

        <div className="steps-grid">
          {STEPS.map((step, i) => (
            <div className="step-card" key={step.title}>
              <div className="step-number">{i + 1}</div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section section-tight">
        <div className="feature-strip">
          <div className="feature-list">
            <div className="feature-item">
              <div className="feature-icon">📷</div>
              <div>
                <h4>Camera built right in</h4>
                <p>Take a photo on the spot or upload one from your gallery — either way, it's attached to the report.</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">📍</div>
              <div>
                <h4>Precise, automatic location</h4>
                <p>Your device's GPS pins the exact spot, so nobody has to guess which street you mean.</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">▲</div>
              <div>
                <h4>Upvotes show what's urgent</h4>
                <p>When ten people flag the same pothole, it stops being one complaint and starts being a pattern.</p>
              </div>
            </div>
          </div>

          <div className="stamp-showcase">
            <span className="section-eyebrow" style={{ marginBottom: 0 }}>
              Every report is tracked
            </span>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <StatusStamp status="reported" />
              <StatusStamp status="in_progress" />
              <StatusStamp status="resolved" />
            </div>
            <p style={{ fontSize: "13.5px", color: "var(--ink-soft)", marginTop: "4px" }}>
              Issues move through these three stages so everyone — you included — can see exactly where things stand.
            </p>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingBottom: 0 }}>
        <div className="cta-band">
          <h2>Seen something today?</h2>
          <p>It takes under a minute to report it — and it starts a paper trail that's hard to ignore.</p>
          <Link to={user ? "/report" : "/login"} className="btn btn-on-ink btn-lg">
            Report an issue
          </Link>
        </div>
      </section>

      <footer className="footer">CivicPulse — built to make local problems visible.</footer>
    </>
  );
}
