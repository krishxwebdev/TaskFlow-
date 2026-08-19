const express = require('express');
const pool = require('../config/db');
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');
const {
  QueryValidationError,
  pagination,
  enumValue,
  dateValue,
  sortClause,
  searchValue,
  positiveInteger,
} = require('../utils/adminQuery');

const router = express.Router();
const STATUSES = ['Pending', 'In Progress', 'Completed'];
const PRIORITIES = ['Low', 'Medium', 'High'];

router.use(requireAuth, requireAdmin);

function queryError(res, err, message) {
  if (err instanceof QueryValidationError) return res.status(400).json({ error: err.message });
  console.error(message, err);
  return res.status(500).json({ error: message });
}

function pagedResponse(rows, page, limit) {
  const total = rows.length ? Number(rows[0].total_count) : 0;
  return {
    data: rows.map(({ total_count, ...row }) => row),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// GET /api/admin/overview
router.get('/overview', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM users) AS total_users,
        COUNT(*)::int AS total_tasks,
        COUNT(*) FILTER (WHERE status = 'Completed')::int AS completed_tasks,
        COUNT(*) FILTER (WHERE status = 'Pending')::int AS pending_tasks,
        COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE)::int AS tasks_created_today
      FROM tasks
    `);
    res.json(result.rows[0]);
  } catch (err) {
    queryError(res, err, 'Failed to fetch admin overview');
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const { page, limit, offset } = pagination(req.query);
    const search = searchValue(req.query.search);
    const orderBy = sortClause(req.query, {
      name: 'u.username', email: 'u.email', role: 'u.role', registered: 'u.created_at',
      totalTasks: 'total_tasks', completedTasks: 'completed_tasks', pendingTasks: 'pending_tasks',
    }, 'registered');
    const params = [];
    let where = '';
    if (search) {
      params.push(`%${search}%`);
      where = `WHERE u.username ILIKE $1 OR COALESCE(u.email, '') ILIKE $1`;
    }
    params.push(limit, offset);
    const limitParam = `$${params.length - 1}`;
    const offsetParam = `$${params.length}`;

    const result = await pool.query(`
      SELECT u.id, u.username, u.email, u.role, u.created_at,
        COUNT(t.id)::int AS total_tasks,
        COUNT(t.id) FILTER (WHERE t.status = 'Completed')::int AS completed_tasks,
        COUNT(t.id) FILTER (WHERE t.status = 'Pending')::int AS pending_tasks,
        COUNT(*) OVER()::int AS total_count
      FROM users u
      LEFT JOIN tasks t ON t.user_id = u.id
      ${where}
      GROUP BY u.id
      ORDER BY ${orderBy}, u.id ASC
      LIMIT ${limitParam} OFFSET ${offsetParam}
    `, params);
    res.json(pagedResponse(result.rows, page, limit));
  } catch (err) {
    queryError(res, err, 'Failed to fetch users');
  }
});

// GET /api/admin/users/:id
router.get('/users/:id', async (req, res) => {
  try {
    const userId = positiveInteger(req.params.id, undefined);
    const { page, limit, offset } = pagination(req.query);
    const status = enumValue(req.query.status, STATUSES, 'status');
    const priority = enumValue(req.query.priority, PRIORITIES, 'priority');
    const dateFrom = dateValue(req.query.dateFrom, 'start date');
    const dateTo = dateValue(req.query.dateTo, 'end date');
    if (dateFrom && dateTo && dateFrom > dateTo) throw new QueryValidationError('Start date must not be after end date');
    const orderBy = sortClause(req.query, {
      created: 't.created_at', updated: 't.updated_at', dueDate: 't.due_date',
      title: 't.title', status: 't.status', priority: 't.priority',
    }, 'created');

    const profileResult = await pool.query(`
      SELECT u.id, u.username, u.employee_id, u.email, u.role, u.created_at,
        COUNT(t.id)::int AS total_tasks,
        COUNT(t.id) FILTER (WHERE t.status = 'Completed')::int AS completed_tasks,
        COUNT(t.id) FILTER (WHERE t.status = 'Pending')::int AS pending_tasks
      FROM users u LEFT JOIN tasks t ON t.user_id = u.id
      WHERE u.id = $1 GROUP BY u.id
    `, [userId]);
    if (!profileResult.rows[0]) return res.status(404).json({ error: 'User not found' });

    const params = [userId];
    const conditions = ['t.user_id = $1'];
    const add = (value, expression) => {
      if (value) { params.push(value); conditions.push(expression.replace('?', `$${params.length}`)); }
    };
    add(status, 't.status = ?');
    add(priority, 't.priority = ?');
    add(dateFrom, 't.created_at::date >= ?');
    add(dateTo, 't.created_at::date <= ?');
    params.push(limit, offset);
    const result = await pool.query(`
      SELECT t.id, t.title, t.description, t.status, t.priority, t.due_date,
        t.created_at, t.updated_at, COUNT(*) OVER()::int AS total_count
      FROM tasks t WHERE ${conditions.join(' AND ')}
      ORDER BY ${orderBy} NULLS LAST, t.id ASC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);

    res.json({ user: profileResult.rows[0], tasks: pagedResponse(result.rows, page, limit) });
  } catch (err) {
    queryError(res, err, 'Failed to fetch user details');
  }
});

// GET /api/admin/tasks (read-only by design)
router.get('/tasks', async (req, res) => {
  try {
    const { page, limit, offset } = pagination(req.query);
    const search = searchValue(req.query.search);
    const owner = searchValue(req.query.owner);
    const ownerId = req.query.ownerId ? positiveInteger(req.query.ownerId, undefined) : undefined;
    const status = enumValue(req.query.status, STATUSES, 'status');
    const priority = enumValue(req.query.priority, PRIORITIES, 'priority');
    const dueFrom = dateValue(req.query.dueFrom, 'due start date');
    const dueTo = dateValue(req.query.dueTo, 'due end date');
    if (dueFrom && dueTo && dueFrom > dueTo) throw new QueryValidationError('Due start date must not be after due end date');
    const orderBy = sortClause(req.query, {
      created: 't.created_at', updated: 't.updated_at', dueDate: 't.due_date', title: 't.title',
      owner: 'u.username', status: 't.status', priority: 't.priority',
    }, 'created');

    const params = [];
    const conditions = [];
    const add = (value, expression) => {
      if (value) { params.push(value); conditions.push(expression.replace('?', `$${params.length}`)); }
    };
    add(search && `%${search}%`, `(t.title ILIKE ? OR COALESCE(t.description, '') ILIKE ? OR u.username ILIKE ? OR COALESCE(u.email, '') ILIKE ?)`);
    if (search) {
      const p = `$${params.length}`;
      conditions[conditions.length - 1] = `(t.title ILIKE ${p} OR COALESCE(t.description, '') ILIKE ${p} OR u.username ILIKE ${p} OR COALESCE(u.email, '') ILIKE ${p})`;
    }
    add(owner && `%${owner}%`, `(u.username ILIKE ? OR COALESCE(u.email, '') ILIKE ?)`);
    if (owner) {
      const p = `$${params.length}`;
      conditions[conditions.length - 1] = `(u.username ILIKE ${p} OR COALESCE(u.email, '') ILIKE ${p})`;
    }
    add(ownerId, 't.user_id = ?');
    add(status, 't.status = ?');
    add(priority, 't.priority = ?');
    add(dueFrom, 't.due_date >= ?');
    add(dueTo, 't.due_date <= ?');
    params.push(limit, offset);
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(`
      SELECT t.id, t.title, t.description, t.status, t.priority, t.due_date,
        t.created_at, t.updated_at, u.id AS owner_id, u.username AS owner_name,
        u.email AS owner_email, COUNT(*) OVER()::int AS total_count
      FROM tasks t JOIN users u ON u.id = t.user_id
      ${where}
      ORDER BY ${orderBy} NULLS LAST, t.id ASC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);
    res.json(pagedResponse(result.rows, page, limit));
  } catch (err) {
    queryError(res, err, 'Failed to fetch tasks');
  }
});

module.exports = router;
