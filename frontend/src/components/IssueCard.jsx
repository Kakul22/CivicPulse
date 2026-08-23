import { useState } from "react";
import { Link } from "react-router-dom";
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

const STATUS_OPTIONS = [
  { value: "reported", label: "Reported" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
];

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

// `editable` — pass true only on pages where the current user is guaranteed
// to be the reporter (e.g. My Reports), since only the reporter is allowed
// to change an issue's status.
export default function IssueCard({ issue, onUpvoteChange, editable = false, onStatusChange }) {
  const { token } = useAuth();
  const [count, setCount] = useState(issue.upvote_count);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(issue.status);
  const [statusSaving, setStatusSaving] = useState(false);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [postingComment, setPostingComment] = useState(false);

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

  async function handleStatusChange(e) {
    const newStatus = e.target.value;
    const previous = status;
    setStatus(newStatus);
    setStatusSaving(true);
    try {
      await api.updateStatus(issue.id, newStatus, token);
      onStatusChange?.(issue.id, newStatus);
    } catch (err) {
      console.error(err);
      setStatus(previous);
    } finally {
      setStatusSaving(false);
    }
  }

  async function toggleComments() {
    const next = !showComments;
    setShowComments(next);
    if (next && comments === null) {
      setCommentsLoading(true);
      try {
        const data = await api.getComments(issue.id);
        setComments(data.comments);
      } catch (err) {
        console.error(err);
        setComments([]);
      } finally {
        setCommentsLoading(false);
      }
    }
  }

  async function handleAddComment(e) {
    e.preventDefault();
    if (!token || !commentText.trim() || postingComment) return;
    setPostingComment(true);
    try {
      const data = await api.addComment(issue.id, commentText.trim(), token);
      setComments((prev) => [...(prev || []), data.comment]);
      setCommentText("");
    } catch (err) {
      console.error(err);
    } finally {
      setPostingComment(false);
    }
  }

  return (
    <article className="issue-card">
      {issue.image_url && (
        <img className="issue-card-photo" src={issue.image_url} alt={issue.title} />
      )}

      <div className="issue-card-body">
        <div className="issue-card-top">
          <h3 className="issue-title">{issue.title}</h3>
          <StatusStamp status={status} />
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

          <div style={{ display: "flex", gap: "8px" }}>
            <button className="upvote-btn" onClick={toggleComments} title="View and add comments">
              💬 {comments ? comments.length : issue.comment_count ?? ""}
            </button>
            <button
              className="upvote-btn"
              onClick={handleUpvote}
              disabled={!token || busy}
              title={token ? "I'm facing this too" : "Log in to support this"}
            >
              ▲ {count}
            </button>
          </div>
        </div>

        {editable && (
          <div className="status-control">
            <label htmlFor={`status-${issue.id}`}>Update status:</label>
            <select
              id={`status-${issue.id}`}
              className="status-select"
              value={status}
              onChange={handleStatusChange}
              disabled={statusSaving}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {statusSaving && <span className="field-hint">Saving…</span>}
          </div>
        )}

        {showComments && (
          <div className="comments-section">
            {commentsLoading && <p className="field-hint">Loading comments…</p>}

            {!commentsLoading && comments && comments.length === 0 && (
              <p className="field-hint">No comments yet — be the first to add context.</p>
            )}

            {!commentsLoading &&
              comments &&
              comments.map((c) => (
                <div className="comment-item" key={c.id}>
                  <span className="comment-author">{c.author_name || "Someone"}</span>
                  <p className="comment-text">{c.text}</p>
                </div>
              ))}

            {token ? (
              <form className="comment-form" onSubmit={handleAddComment}>
                <input
                  type="text"
                  placeholder="I'm facing this too — add details…"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  maxLength={500}
                />
                <button className="btn btn-ghost" disabled={postingComment || !commentText.trim()}>
                  {postingComment ? "Posting…" : "Post"}
                </button>
              </form>
            ) : (
              <p className="field-hint">
                <Link to="/login" style={{ color: "var(--teal)", fontWeight: 600 }}>
                  Log in
                </Link>{" "}
                to add a comment or support this issue.
              </p>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
