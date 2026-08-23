const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function request(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || "Something went wrong. Please try again.");
  }

  return data;
}

export const api = {
  signup: (payload) => request("/auth/signup", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),

  getIssues: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return request(`/issues${params ? `?${params}` : ""}`);
  },
  createIssue: (payload, token) =>
    request("/issues", { method: "POST", body: payload, token }),
  toggleUpvote: (issueId, token) =>
    request(`/issues/${issueId}/upvote`, { method: "POST", token }),
};
