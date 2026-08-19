const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const requireAuth = require('../middleware/requireAuth');

// POST /todo - Create a new task
router.post('/', requireAuth, async (req, res) => {
  const { title, description, priority, dueDate } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });

  try {
    // PostgreSQL: RETURNING * gives us the full inserted row immediately
    const result = await pool.query(
      'INSERT INTO tasks (user_id, title, description, priority, due_date, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.session.userId, title, description || null, priority || 'Medium', dueDate || null, 'Pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// GET /todo - Retrieve all tasks for the logged-in user
// Supports optional ?status=&priority=&search= query params
router.get('/', requireAuth, async (req, res) => {
  const { status, priority, search } = req.query;

  // PostgreSQL uses $1, $2... placeholders instead of ?
  let sql = 'SELECT * FROM tasks WHERE user_id = $1';
  const params = [req.session.userId];
  let idx = 2;

  if (status) {
    sql += ` AND status = $${idx++}`;
    params.push(status);
  }
  if (priority) {
    sql += ` AND priority = $${idx++}`;
    params.push(priority);
  }
  if (search) {
    sql += ` AND title ILIKE $${idx++}`;  // ILIKE = case-insensitive LIKE in PostgreSQL
    params.push(`%${search}%`);
  }
  // NULL dates sorted last
  sql += ' ORDER BY due_date IS NULL, due_date ASC';

  try {
    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET /todo/summary - Dashboard analytics
// Defined BEFORE /:id so Express doesn't mistake "summary" for an :id param.
router.get('/summary', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tasks WHERE user_id = $1',
      [req.session.userId]
    );
    const rows = result.rows;
    const total = rows.length;
    const completed = rows.filter(t => t.status === 'Completed').length;
    const pending = rows.filter(t => t.status === 'Pending').length;
    const inProgress = rows.filter(t => t.status === 'In Progress').length;
    const today = new Date().toISOString().split('T')[0];
    const overdue = rows.filter(t => {
      if (!t.due_date || t.status === 'Completed') return false;
      const due = new Date(t.due_date).toISOString().split('T')[0];
      return due < today;
    }).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    res.json({ total, pending, inProgress, completed, overdue, completionRate });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

// PUT /todo/:id - Update task details
router.put('/:id', requireAuth, async (req, res) => {
  const { title, description, priority, dueDate } = req.body;
  try {
    const result = await pool.query(
      'UPDATE tasks SET title = $1, description = $2, priority = $3, due_date = $4 WHERE id = $5 AND user_id = $6 RETURNING *',
      [title, description || null, priority, dueDate || null, req.params.id, req.session.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// PUT /todo/:id/status - Change only the status
router.put('/:id/status', requireAuth, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['Pending', 'In Progress', 'Completed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const result = await pool.query(
      'UPDATE tasks SET status = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [status, req.params.id, req.session.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// DELETE /todo/:id - Permanently remove a task
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.session.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = router;
