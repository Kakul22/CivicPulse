const LABELS = {
  reported: "Reported",
  in_progress: "In progress",
  resolved: "Resolved",
};

export default function StatusStamp({ status }) {
  return (
    <span className={`status-stamp status-${status}`}>
      {LABELS[status] || status}
    </span>
  );
}
