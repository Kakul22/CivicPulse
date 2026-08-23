# CivicPulse — Backend

Local issue reporting platform. This is the API server (Phase 1).

## What's built so far

- **Auth**: signup / login with JWT tokens (passwords hashed with bcrypt)
- **Issues**: create, list (with filters), get one, upvote (toggle), update status
- **Database**: PostgreSQL schema for users, issues, upvotes

## Setup (do this today)

### 1. Get a free Postgres database
Go to [neon.tech](https://neon.tech) → sign up free → create a project → copy the connection string it gives you (looks like `postgresql://user:pass@host/db`).

### 2. Configure environment
```bash
cp .env.example .env
```
Open `.env` and paste your Neon connection string into `DATABASE_URL`. Set `JWT_SECRET` to any random long string (e.g. mash your keyboard).

### 3. Create the tables
Run the schema against your database. Easiest way: open your Neon dashboard's SQL editor and paste the contents of `src/config/schema.sql`, then run it.

### 4. Install and run
```bash
npm install
npm run dev
```
Server runs at `http://localhost:5000`. Test it's alive:
```bash
curl http://localhost:5000/api/health
```

## API endpoints (what exists right now)

| Method | Endpoint | Auth required | What it does |
|--------|----------|---------------|---------------|
| POST | `/api/auth/signup` | No | Create account, returns token |
| POST | `/api/auth/login` | No | Login, returns token |
| GET | `/api/issues` | No | List all issues (filter with `?category=` or `?status=`) |
| GET | `/api/issues/:id` | No | Get one issue |
| POST | `/api/issues` | Yes | Report a new issue |
| POST | `/api/issues/:id/upvote` | Yes | Toggle upvote on an issue |
| PATCH | `/api/issues/:id/status` | Yes | Change status (reported/in_progress/resolved) |

For protected routes, send header: `Authorization: Bearer <token>`

## Next (Phase 2)
Frontend in React — issue submit form + list view.
