import { Router } from 'express';
import pool from '../config/db.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = Router();

const VALID_CATEGORIES = ['garbage', 'road', 'streetlight', 'water', 'other'];
const VALID_STATUSES = ['reported', 'in_progress', 'resolved'];

// GET /api/issues - list all issues, optionally filtered
// Query params: category, status, lat, lng, radiusKm
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, status } = req.query;
    const conditions = [];
    const values = [];

    if (category) {
      values.push(category);
      conditions.push(`category = $${values.length}`);
    }
    if (status) {
      values.push(status);
      conditions.push(`status = $${values.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await pool.query(
      `SELECT i.*, u.name AS reporter_name, u.email AS reporter_email,
              (SELECT COUNT(*) FROM comments c WHERE c.issue_id = i.id)::int AS comment_count
       FROM issues i
       LEFT JOIN users u ON i.user_id = u.id
       ${whereClause}
       ORDER BY i.created_at DESC`,
      values
    );

    // Only authority accounts get to see the reporter's contact email —
    // regular citizens browsing the list shouldn't see each other's emails.
    const issues = result.rows.map((issue) => {
      if (req.user?.role !== 'authority') {
        const { reporter_email, ...rest } = issue;
        return rest;
      }
      return issue;
    });

    res.json({ issues });
  } catch (err) {
    console.error('List issues error:', err);
    res.status(500).json({ error: 'Failed to fetch issues' });
  }
});

// GET /api/issues/nearby?lat=..&lng=..&category=..&radius=200
// Finds UNRESOLVED issues of the same category within `radius` metres, so the
// report form can warn about duplicates. Distance is computed in SQL with the
// Haversine formula, so we never load the whole table into Node.
// NOTE: defined before GET /:id so "nearby" isn't treated as an issue id.
router.get('/nearby', requireAuth, async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radius = req.query.radius === undefined ? 200 : Number(req.query.radius);
    const category = req.query.category;

    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ error: 'Valid lat and lng are required' });
    }
    if (!Number.isFinite(radius) || radius <= 0 || radius > 1000) {
      return res.status(400).json({ error: 'radius must be between 1 and 1000 metres' });
    }
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: `category must be one of: ${VALID_CATEGORIES.join(', ')}` });
    }

    // Bounding box first (cheap, can use the lat/lng index), exact Haversine after.
    const latDelta = radius / 111320;
    const lngDelta = radius / (111320 * Math.max(Math.cos((lat * Math.PI) / 180), 0.01));

    const result = await pool.query(
      `SELECT * FROM (
         SELECT i.id, i.title, i.category, i.status, i.upvote_count, i.address, i.image_url, i.created_at,
                EXISTS (SELECT 1 FROM upvotes u WHERE u.issue_id = i.id AND u.user_id = $7) AS supported_by_me,
                6371000 * 2 * ASIN(SQRT(LEAST(1,
                  POWER(SIN(RADIANS(i.latitude - $1::float8) / 2), 2) +
                  COS(RADIANS($1::float8)) * COS(RADIANS(i.latitude)) *
                  POWER(SIN(RADIANS(i.longitude - $2::float8) / 2), 2)
                ))) AS distance_m
         FROM issues i
         WHERE i.category = $3
           AND i.status <> 'resolved'
           AND i.latitude BETWEEN $1::float8 - $4::float8 AND $1::float8 + $4::float8
           AND i.longitude BETWEEN $2::float8 - $5::float8 AND $2::float8 + $5::float8
       ) t
       WHERE t.distance_m <= $6
       ORDER BY t.distance_m ASC
       LIMIT 5`,
      [lat, lng, category, latDelta, lngDelta, radius, req.user.id]
    );

    res.json({
      issues: result.rows.map((r) => ({ ...r, distance_m: Math.round(r.distance_m) })),
    });
  } catch (err) {
    console.error('Nearby issues error:', err);
    res.status(500).json({ error: 'Failed to check nearby issues' });
  }
});

// GET /api/issues/mine - issues reported by the logged-in user (for their dashboard)
// NOTE: this must be defined before GET /:id, otherwise Express will try to
// match "mine" as an issue id.
router.get('/mine', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT i.*,
              (SELECT COUNT(*) FROM comments c WHERE c.issue_id = i.id)::int AS comment_count
       FROM issues i WHERE i.user_id = $1 ORDER BY i.created_at DESC`,
      [req.user.id]
    );
    res.json({ issues: result.rows });
  } catch (err) {
    console.error('Get my issues error:', err);
    res.status(500).json({ error: 'Failed to fetch your issues' });
  }
});

// GET /api/issues/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT i.*, u.name AS reporter_name
       FROM issues i
       LEFT JOIN users u ON i.user_id = u.id
       WHERE i.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    res.json({ issue: result.rows[0] });
  } catch (err) {
    console.error('Get issue error:', err);
    res.status(500).json({ error: 'Failed to fetch issue' });
  }
});

// POST /api/issues - create a new issue (requires login)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, description, category, image_url, latitude, longitude, address } = req.body;

    if (!title || !description || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        error: 'title, description, latitude and longitude are required',
      });
    }

    const finalCategory = VALID_CATEGORIES.includes(category) ? category : 'other';

    const result = await pool.query(
      `INSERT INTO issues (user_id, title, description, category, image_url, latitude, longitude, address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [req.user.id, title, description, finalCategory, image_url || null, latitude, longitude, address || null]
    );

    res.status(201).json({ issue: result.rows[0] });
  } catch (err) {
    console.error('Create issue error:', err);
    res.status(500).json({ error: 'Failed to create issue' });
  }
});

// POST /api/issues/:id/upvote - toggle upvote (requires login)
router.post('/:id/upvote', requireAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    const issueId = req.params.id;
    const userId = req.user.id;

    await client.query('BEGIN');

    const existing = await client.query(
      'SELECT id FROM upvotes WHERE issue_id = $1 AND user_id = $2',
      [issueId, userId]
    );

    let upvoted;
    if (existing.rows.length > 0) {
      // already upvoted -> remove it (toggle off)
      await client.query('DELETE FROM upvotes WHERE issue_id = $1 AND user_id = $2', [issueId, userId]);
      await client.query('UPDATE issues SET upvote_count = upvote_count - 1 WHERE id = $1', [issueId]);
      upvoted = false;
    } else {
      await client.query('INSERT INTO upvotes (issue_id, user_id) VALUES ($1, $2)', [issueId, userId]);
      await client.query('UPDATE issues SET upvote_count = upvote_count + 1 WHERE id = $1', [issueId]);
      upvoted = true;
    }

    const updated = await client.query('SELECT upvote_count FROM issues WHERE id = $1', [issueId]);

    await client.query('COMMIT');

    res.json({ upvoted, upvote_count: updated.rows[0].upvote_count });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Upvote error:', err);
    res.status(500).json({ error: 'Failed to update upvote' });
  } finally {
    client.release();
  }
});

// PATCH /api/issues/:id/status - update status.
// Only authority accounts may change status. Citizens report and support
// issues, but they can't mark their own report "resolved".
router.patch('/:id/status', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'authority') {
      return res.status(403).json({ error: 'Only authority accounts can update an issue\'s status' });
    }

    const { status } = req.body;
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    const result = await pool.query(
      'UPDATE issues SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    res.json({ issue: result.rows[0] });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// GET /api/issues/:id/comments - list comments on an issue, newest last
router.get('/:id/comments', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, u.name AS author_name
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.issue_id = $1
       ORDER BY c.created_at ASC`,
      [req.params.id]
    );
    res.json({ comments: result.rows });
  } catch (err) {
    console.error('List comments error:', err);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// POST /api/issues/:id/comments - add a comment ("support" text) to an issue
router.post('/:id/comments', requireAuth, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const result = await pool.query(
      `INSERT INTO comments (issue_id, user_id, text)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.params.id, req.user.id, text.trim()]
    );

    const userResult = await pool.query('SELECT name FROM users WHERE id = $1', [req.user.id]);
    const comment = { ...result.rows[0], author_name: userResult.rows[0]?.name || 'Someone' };
    res.status(201).json({ comment });
  } catch (err) {
    console.error('Add comment error:', err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

export default router;
