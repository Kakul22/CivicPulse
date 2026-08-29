# CivicPulse

A civic issue reporting platform. Spot a pothole, an overflowing bin, or a dead streetlight — report it with a photo and a pinned location, and track it until it's resolved.

Built as a full-stack learning project: React frontend, Node/Express backend, PostgreSQL database (hosted on Neon), deployed as a real, working web app.

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

**Coming next:**
- A government/authority-side portal — a separate login for civic bodies to view reported issues in their jurisdiction, respond to them, and update status on the public's behalf once genuinely fixed

---

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React (Vite) + React Router |
| Backend | Node.js + Express |
| Database | PostgreSQL (hosted on [Neon](https://neon.tech)) |
| Auth | JWT (JSON Web Tokens) + bcrypt password hashing |
| Image storage | Local disk via Multer *(swap for Cloudinary/S3 before production deploy)* |
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
│   └── uploads/            # uploaded issue photos (gitignored)
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
cp .env.example .env    # fill in DATABASE_URL and JWT_SECRET
npm run dev
```

Runs on `http://localhost:5000`. Health check: `GET /api/health`.

**Database setup:** create a free Postgres project on [neon.tech](https://neon.tech), copy the connection string into `.env`, then run `src/config/schema.sql` in Neon's SQL Editor to create the tables.

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
| POST | `/api/auth/signup` | No | Create an account |
| POST | `/api/auth/login` | No | Log in |
| GET | `/api/issues` | No | List issues (filter with `?category=`) |
| GET | `/api/issues/mine` | Yes | Issues reported by the logged-in user |
| POST | `/api/issues` | Yes | Report a new issue |
| POST | `/api/issues/:id/upvote` | Yes | Toggle upvote |
| PATCH | `/api/issues/:id/status` | Yes (owner only) | Update status |
| GET | `/api/issues/:id/comments` | No | List comments |
| POST | `/api/issues/:id/comments` | Yes | Add a comment |
| POST | `/api/upload` | Yes | Upload an issue photo |

---

## Roadmap

- [x] Auth, issue reporting, upvotes, comments
- [x] Photo capture/upload
- [x] Interactive map (view + location picker)
- [x] Owner-controlled status updates
- [ ] Government/authority portal with jurisdiction-based issue views
- [ ] Cloud image storage (Cloudinary/S3) for production
- [ ] Persistent login (currently session is in-memory only)
- [ ] Deployment (Render/Vercel)

---

Built by Kakul Mittal as a hands-on project to learn full-stack development and a real Git branch → PR → merge workflow.
