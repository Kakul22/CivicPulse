# CivicPulse — Frontend

React app for reporting and browsing local civic issues. Talks to the backend API.

## What's built

- **Auth**: signup/login (session kept in memory — refreshing the page logs you out for now)
- **Issues list**: browse all reported issues, filter by category, upvote
- **Report form**: submit a new issue with title, description, category, and your current location (via the browser's geolocation)

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure the API URL
```bash
cp .env.example .env
```
The default (`http://localhost:5000/api`) already matches the backend from Phase 1 — no changes needed unless your backend runs elsewhere.

### 3. Run it
```bash
npm run dev
```
Opens at `http://localhost:5173`. **Make sure the backend server is also running** (`npm run dev` inside `backend/`) — the frontend can't do anything without it.

## Design notes

- Palette: deep teal-green as the trusted primary color, warm amber as the caution/status accent, soft paper background — a municipal, trustworthy feel without looking like a generic dashboard.
- The status badges ("Reported" / "In progress" / "Resolved") are styled like an official permit stamp — dashed border, slight rotation — as the one signature visual element.
- Typography: Space Grotesk for headings, Inter for body text, IBM Plex Mono for counts and category tags.

## Next (Phase 3)
Add the map view (Leaflet + OpenStreetMap) so issues show as pins instead of just a list.
