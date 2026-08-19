const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const requireAuth = require('../middleware/requireAuth');

// Every route below uses requireAuth, so req.session.userId is guaranteed
// to exist by the time the handler runs. That's how we make sure a user
// only ever touches THEIR OWN tasks (we always filter by user_id).

// POST /todo - Create a new task
router.post('/', requireAuth, async (req, res) => {
  const { title, description, priority, dueDate } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });

  try {
    const [result] = await pool.query(
      'INSERT INTO tasks (user_id, title, description, priority, due_date, status) VALUES (?, ?, ?, ?, ?, ?)',
      [req.session.userId, title, description || null, priority || 'Medium', dueDate || null, 'Pending']
    );
    const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// GET /todo - Retrieve all tasks for the logged-in user
// Supports optional ?status=&priority=&search= query params for filtering/search
router.get('/', requireAuth, async (req, res) => {
  const { status, priority, search } = req.query;

  let sql = 'SELECT * FROM tasks WHERE user_id = ?';
  const params = [req.session.userId];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (priority) {
    sql += ' AND priority = ?';
    params.push(priority);
  }
  if (search) {
    sql += ' AND title LIKE ?';
    params.push(`%${search}%`);
  }
  sql += ' ORDER BY due_date IS NULL, due_date ASC';

  try {
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET /todo/summary - Dashboard analytics (total, pending, completed, overdue, % complete)
// Defined BEFORE /:id so Express doesn't mistake "summary" for an :id param.
router.get('/summary', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tasks WHERE user_id = ?', [req.session.userId]);
    const total = rows.length;
    const completed = rows.filter(t => t.status === 'Completed').length;
    const pending = rows.filter(t => t.status === 'Pending').length;
    const inProgress = rows.filter(t => t.status === 'In Progress').length;
    const today = new Date().toISOString().split('T')[0];
    const overdue = rows.filter(t => t.due_date && t.due_date.toISOString().split('T')[0] < today && t.status !== 'Completed').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    res.json({ total, pending, inProgress, completed, overdue, completionRate });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

// PUT /todo/:id - Update task details (title, priority, due date)
router.put('/:id', requireAuth, async (req, res) => {
  const { title, description, priority, dueDate } = req.body;
  try {
    // The "AND user_id = ?" is critical: it stops user A from editing user B's task
    // even if they guessed/knew user B's task id.
    const [result] = await pool.query(
      'UPDATE tasks SET title = ?, description = ?, priority = ?, due_date = ? WHERE id = ? AND user_id = ?',
      [title, description || null, priority, dueDate, req.params.id, req.session.userId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Task not found' });

    const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// PUT /todo/:id/status - Change only the status (Pending / In Progress / Completed)
router.put('/:id/status', requireAuth, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['Pending', 'In Progress', 'Completed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const [result] = await pool.query(
      'UPDATE tasks SET status = ? WHERE id = ? AND user_id = ?',
      [status, req.params.id, req.session.userId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Task not found' });

    const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// DELETE /todo/:id - Permanently remove a task
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM tasks WHERE id = ? AND user_id = ?',
      [req.params.id, req.session.userId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = router;
