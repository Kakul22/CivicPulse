import { Router } from 'express';
import pool from '../config/db.js';

const router = Router();
const VALID_CATEGORIES = ['garbage', 'road', 'streetlight', 'water', 'other'];

// GET /api/nearby?lat=..&lng=..&category=..&radius=..
// Returns up to 5 UNRESOLVED issues within `radius` metres (default 200m,
// max 1km), closest first. Used by the report form to warn about duplicates.
router.get('/', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radius = Math.min(parseFloat(req.query.radius) || 200, 1000);
    const category = VALID_CATEGORIES.includes(req.query.category) ? req.query.category : null;

    if (Number.isNaN(lat) || Number.isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ error: 'Valid lat and lng are required' });
    }

    // Haversine formula: great-circle distance between two lat/lng points on
    // a sphere (Earth radius = 6,371,000 m). LEAST/GREATEST clamp the value
    // into [-1, 1] so floating-point rounding can never make acos() fail.
    const result = await pool.query(
      `SELECT * FROM (
         SELECT id, title, category, status, upvote_count, address, image_url, created_at,
                6371000 * acos(LEAST(1, GREATEST(-1,
                  cos(radians($1)) * cos(radians(latitude)) * cos(radians(longitude) - radians($2))
                  + sin(radians($1)) * sin(radians(latitude))
                ))) AS distance_m
         FROM issues
         WHERE status <> 'resolved'
           AND ($3::text IS NULL OR category = $3)
       ) nearby
       WHERE distance_m <= $4
       ORDER BY distance_m ASC
       LIMIT 5`,
      [lat, lng, category, radius]
    );

    const issues = result.rows.map((r) => ({ ...r, distance_m: Math.round(r.distance_m) }));
    res.json({ issues });
  } catch (err) {
    console.error('Nearby issues error:', err);
    res.status(500).json({ error: 'Failed to look up nearby issues' });
  }
});

export default router;
