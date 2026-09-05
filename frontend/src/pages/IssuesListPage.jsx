import { useEffect, useState } from "react";
import { api } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import IssueCard from "../components/IssueCard.jsx";
import IssueMap from "../components/IssueMap.jsx";

const CATEGORIES = [
  { value: "", label: "All" },
  { value: "garbage", label: "Garbage" },
  { value: "road", label: "Road" },
  { value: "streetlight", label: "Streetlight" },
  { value: "water", label: "Water" },
  { value: "other", label: "Other" },
];

export default function IssuesListPage() {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("");
  const [view, setView] = useState("list"); // 'list' | 'map'

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    api
      .getIssues(category ? { category } : {})
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
  }, [category]);

  function handleUpvoteChange(issueId, newCount) {
    setIssues((prev) =>
      prev.map((i) => (i.id === issueId ? { ...i, upvote_count: newCount } : i))
    );
  }

  function handleStatusChange(issueId, newStatus) {
    setIssues((prev) =>
      prev.map((i) => (i.id === issueId ? { ...i, status: newStatus } : i))
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Issues near you</h1>
          <p>See what's been reported, and add your voice to what matters.</p>
        </div>
      </div>

      <div className="view-toggle">
        <button className={view === "list" ? "active" : ""} onClick={() => setView("list")}>
          List
        </button>
        <button className={view === "map" ? "active" : ""} onClick={() => setView("map")}>
          Map
        </button>
      </div>

      <div className="filter-bar">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            className={`chip ${category === c.value ? "active" : ""}`}
            onClick={() => setCategory(c.value)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {loading && <div className="loading-state">Loading issues…</div>}

      {error && <div className="form-error">{error}</div>}

      {!loading && !error && issues.length === 0 && (
        <div className="empty-state">
          <h3>No issues reported yet</h3>
          <p>Be the first to flag something in your area — it only takes a minute.</p>
        </div>
      )}

      {!loading && !error && issues.length > 0 && view === "map" && (
        <IssueMap issues={issues} />
      )}

      {!loading &&
        view === "list" &&
        issues.map((issue) => (
          <IssueCard
            key={issue.id}
            issue={issue}
            onUpvoteChange={handleUpvoteChange}
            editable={user?.role === "authority"}
            onStatusChange={handleStatusChange}
          />
        ))}
    </div>
  );
}
