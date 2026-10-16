import { useState } from "react";
import StatusStamp from "./StatusStamp.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api.js";

// Shown on the report form when similar unresolved issues exist close to the
// pin the user dropped. Lets them support an existing report instead of
// creating a duplicate.
export default function NearbyIssues({ issues }) {
  const { token } = useAuth();
  const [supported, setSupported] = useState({}); // issueId -> new upvote count
  const [busyId, setBusyId] = useState(null);

  if (!issues || issues.length === 0) return null;

  async function handleSupport(issue) {
    if (busyId || supported[issue.id] !== undefined) return;
    setBusyId(issue.id);
    try {
      const result = await api.toggleUpvote(issue.id, token);
      setSupported((prev) => ({ ...prev, [issue.id]: result.upvote_count }));
    } catch (err) {
      console.error(err);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="nearby-box">
      <h4 className="nearby-title">Similar issues already reported nearby</h4>
      <p className="nearby-sub">
        Support one of these instead of filing a duplicate — more upvotes on one report
        help authorities prioritise it. If yours is genuinely different, just continue below.
      </p>

      {issues.map((issue) => {
        const done = supported[issue.id] !== undefined;
        return (
          <div className="nearby-item" key={issue.id}>
            <div className="nearby-item-main">
              <span className="nearby-item-title">{issue.title}</span>
              <span className="nearby-item-meta">
                {issue.distance_m} m away · ▲ {done ? supported[issue.id] : issue.upvote_count}
              </span>
            </div>
            <StatusStamp status={issue.status} />
            <button
              type="button"
              className="btn btn-ghost nearby-btn"
              onClick={() => handleSupport(issue)}
              disabled={done || busyId === issue.id}
            >
              {done ? "Supported ✓" : busyId === issue.id ? "…" : "I'm facing this too"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
