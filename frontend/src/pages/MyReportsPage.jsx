import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api.js";
import IssueCard from "../components/IssueCard.jsx";

export default function MyReportsPage() {
  const { token } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api
      .getMyIssues(token)
      .then((data) => {
        if (!cancelled) setIssues(data.issues);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  function handleUpvoteChange(issueId, newCount) {
    setIssues((prev) =>
      prev.map((i) => (i.id === issueId ? { ...i, upvote_count: newCount } : i))
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>My reports</h1>
          <p>Everything you've flagged, and where it stands.</p>
        </div>
        <Link to="/report" className="btn btn-primary">
          Report an issue
        </Link>
      </div>

      {loading && <div className="loading-state">Loading your reports…</div>}
      {error && <div className="form-error">{error}</div>}

      {!loading && !error && issues.length === 0 && (
        <div className="empty-state">
          <h3>You haven't reported anything yet</h3>
          <p>Spotted a pothole or an overflowing bin today? Report it — it takes under a minute.</p>
        </div>
      )}

      {!loading &&
        issues.map((issue) => (
          <IssueCard key={issue.id} issue={issue} onUpvoteChange={handleUpvoteChange} />
        ))}
    </div>
  );
}
