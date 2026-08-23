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
  getMyIssues: (token) => request("/issues/mine", { token }),
  createIssue: (payload, token) =>
    request("/issues", { method: "POST", body: payload, token }),
  toggleUpvote: (issueId, token) =>
    request(`/issues/${issueId}/upvote`, { method: "POST", token }),
  updateStatus: (issueId, status, token) =>
    request(`/issues/${issueId}/status`, { method: "PATCH", body: { status }, token }),

  getComments: (issueId) => request(`/issues/${issueId}/comments`),
  addComment: (issueId, text, token) =>
    request(`/issues/${issueId}/comments`, { method: "POST", body: { text }, token }),

  // Image upload uses FormData, not JSON — bypasses the request() helper above.
  uploadImage: async (file, token) => {
    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch(`${API_BASE}/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || "Image upload failed. Please try again.");
    }
    return data;
  },
};
