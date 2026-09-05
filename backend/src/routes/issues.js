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

// PATCH /api/issues/:id/status - update status. Only the person who reported
// the issue can change its status, since they're the one who can confirm
// it's actually been fixed.
router.patch('/:id/status', requireAuth, async (req, res) => {
  try {
    const { status } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    const existing = await pool.query('SELECT user_id FROM issues WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    const isOwner = existing.rows[0].user_id === req.user.id;
    const isAuthority = req.user.role === 'authority';
    if (!isOwner && !isAuthority) {
      return res.status(403).json({ error: 'Only the reporter or an authority account can update this issue\'s status' });
    }

    const result = await pool.query(
      'UPDATE issues SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );

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
