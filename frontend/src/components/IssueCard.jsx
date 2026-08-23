import { useState } from "react";
import StatusStamp from "./StatusStamp.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api.js";

const CATEGORY_LABELS = {
  garbage: "Garbage",
  road: "Road",
  streetlight: "Streetlight",
  water: "Water",
  other: "Other",
};

function timeAgo(dateString) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function IssueCard({ issue, onUpvoteChange }) {
  const { token } = useAuth();
  const [count, setCount] = useState(issue.upvote_count);
  const [busy, setBusy] = useState(false);

  async function handleUpvote() {
    if (!token || busy) return;
    setBusy(true);
    try {
      const result = await api.toggleUpvote(issue.id, token);
      setCount(result.upvote_count);
      onUpvoteChange?.(issue.id, result.upvote_count);
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="issue-card">
      <div className="issue-card-top">
        <h3 className="issue-title">{issue.title}</h3>
        <StatusStamp status={issue.status} />
      </div>

      <p className="issue-desc">{issue.description}</p>

      <div className="issue-meta">
        <div className="issue-meta-left">
          <span className="issue-category">
            {CATEGORY_LABELS[issue.category] || issue.category}
          </span>
          <span>{issue.address || "Location pinned"}</span>
          <span>·</span>
          <span>{timeAgo(issue.created_at)}</span>
        </div>

        <button
          className="upvote-btn"
          onClick={handleUpvote}
          disabled={!token || busy}
          title={token ? "Upvote this issue" : "Log in to upvote"}
        >
          ▲ {count}
        </button>
      </div>
    </article>
  );
}
