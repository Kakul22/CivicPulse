# CivicPulse

A civic issue reporting platform. Spot a pothole, an overflowing bin, or a dead streetlight — report it with a photo and a pinned location, and track it until it's resolved.

**🔗 Live demo:** [civic-pulse-eight-vert.vercel.app](https://civic-pulse-eight-vert.vercel.app)

Built as a full-stack learning project: React frontend, Node/Express backend, PostgreSQL database (Neon), deployed on Vercel + Render.

---

## What it does

**For citizens:**
- Sign up and log in
- Report an issue with a photo (camera capture or gallery upload), category, description, and an exact location — either your current GPS position or a pin you drop/drag on the map
- Browse all reported issues as a list or on an interactive map
- Filter issues by category (garbage, road, streetlight, water, other)
- Upvote issues you're also facing, so patterns become visible instead of scattered complaints
- Comment on an issue to add context ("I'm facing this too — happened again today")
- Track your own reports on a personal "My Reports" dashboard
- Mark your own reported issue's status as it moves from **Reported → In Progress → Resolved**

**For government/authority accounts:**
- A separate account type, chosen at signup
- A dashboard showing every reported issue, with live counts by status
- See the reporter's name and email for accountability
- Update the status of *any* issue, not just ones they filed
- No "Report an issue" clutter in their view — the interface adapts to the role

---

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React (Vite) + React Router, deployed on Vercel |
| Backend | Node.js + Express, deployed on Render |
| Database | PostgreSQL, hosted on [Neon](https://neon.tech) |
| Auth | JWT (JSON Web Tokens) + bcrypt password hashing, with citizen/authority roles |
| Image storage | Cloudinary (permanent cloud storage, survives redeploys) |
| Maps | Leaflet + OpenStreetMap (free, no API key needed) |
| DB driver | `@neondatabase/serverless` — connects over WebSocket/HTTPS instead of raw Postgres TCP, so it works even on networks that block port 5432 |

---

## Project structure

```
civicpulse/
├── backend/
│   ├── src/
│   │   ├── config/        # database connection + schema.sql
│   │   ├── middleware/     # JWT auth middleware
│   │   ├── routes/        # auth, issues, upload endpoints
│   │   └── server.js
└── frontend/
    └── src/
        ├── components/     # Navbar, IssueCard, LocationPicker, IssueMap, etc.
        ├── context/         # AuthContext
        ├── pages/           # Landing, Issues list, Report form, My Reports, Auth
        ├── styles/          # global.css (design system)
        └── utils/           # map pin icon
```

---

## Running it locally

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env    # fill in DATABASE_URL, JWT_SECRET, and Cloudinary credentials
npm run dev
```

Runs on `http://localhost:5000`. Health check: `GET /api/health`.

**Database setup:** create a free Postgres project on [neon.tech](https://neon.tech), copy the connection string into `.env`, then run `src/config/schema.sql` in Neon's SQL Editor to create the tables.

**Image uploads:** create a free account on [cloudinary.com](https://cloudinary.com), copy your cloud name, API key, and API secret into `.env`.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env    # defaults to http://localhost:5000/api
npm run dev
```

Runs on `http://localhost:5173`. **The backend must also be running** — the frontend can't do anything without it.

---

## Design notes

The visual language is "municipal signage": deep pine-ink plaques with marigold-amber signal text, warm bone paper for content, and a forest-teal secondary accent. Status badges are styled after an official permit/inspection stamp — dashed border, slight rotation — as the app's signature visual detail.

Typography: Space Grotesk for headings, Inter for body text, IBM Plex Mono for counts and category tags.

---

## API overview

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | No | Create an account (citizen or authority) |
| POST | `/api/auth/login` | No | Log in |
| GET | `/api/issues` | No | List issues (filter with `?category=`) |
| GET | `/api/issues/mine` | Yes | Issues reported by the logged-in user |
| POST | `/api/issues` | Yes | Report a new issue |
| POST | `/api/issues/:id/upvote` | Yes | Toggle upvote |
| PATCH | `/api/issues/:id/status` | Yes (owner or authority) | Update status |
| GET | `/api/issues/:id/comments` | No | List comments |
| POST | `/api/issues/:id/comments` | Yes | Add a comment |
| POST | `/api/upload` | Yes | Upload an issue photo to Cloudinary |

---

## Roadmap

- [x] Auth, issue reporting, upvotes, comments
- [x] Photo capture/upload (Cloudinary)
- [x] Interactive map (view + location picker)
- [x] Owner-controlled status updates
- [x] Government/authority accounts with a dedicated dashboard
- [x] Live deployment (Vercel + Render + Neon)
- [ ] Persistent login (currently session is in-memory only — refreshing logs you out)
- [ ] Email/SMS notifications when an issue's status changes
- [ ] Pagination for large issue lists

---

Built by Kakul Mittal as a hands-on project to learn full-stack development, a real Git branch → PR → merge workflow, and end-to-end deployment.
