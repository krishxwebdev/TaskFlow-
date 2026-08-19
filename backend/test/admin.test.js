const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'admin-test-secret';

const calls = [];
const fakePool = {
  async query(sql, params = []) {
    const normalized = sql.replace(/\s+/g, ' ').trim();
    calls.push({ sql: normalized, params });

    if (normalized.includes('SELECT id, username, email, role FROM users WHERE id')) {
      if (params[0] === 1) return { rows: [{ id: 1, username: 'Ada', email: 'ada@example.com', role: 'admin' }] };
      if (params[0] === 2) return { rows: [{ id: 2, username: 'Lin', email: 'lin@example.com', role: 'user' }] };
      return { rows: [] };
    }
    if (normalized.includes('(SELECT COUNT(*)::int FROM users)')) {
      return { rows: [{ total_users: 2, total_tasks: 4, completed_tasks: 2, pending_tasks: 1, tasks_created_today: 1 }] };
    }
    if (normalized.includes('FROM users u LEFT JOIN tasks t') && normalized.includes('COUNT(*) OVER()')) {
      return { rows: [{ id: 2, username: 'Lin', email: 'lin@example.com', role: 'user', created_at: '2026-01-01', total_tasks: 3, completed_tasks: 2, pending_tasks: 1, total_count: 11 }] };
    }
    if (normalized.includes('FROM users u LEFT JOIN tasks t') && normalized.includes('WHERE u.id = $1')) {
      return { rows: [{ id: 2, username: 'Lin', employee_id: 'EMP2', email: 'lin@example.com', role: 'user', created_at: '2026-01-01', total_tasks: 1, completed_tasks: 0, pending_tasks: 1 }] };
    }
    if (normalized.includes('FROM tasks t WHERE')) {
      return { rows: [{ id: 7, title: 'Ship', description: null, status: 'Pending', priority: 'High', due_date: '2026-08-01', created_at: '2026-07-01', updated_at: '2026-07-02', total_count: 1 }] };
    }
    if (normalized.includes('FROM tasks t JOIN users u')) {
      return { rows: [{ id: 7, title: 'Ship', description: null, status: 'Pending', priority: 'High', due_date: '2026-08-01', created_at: '2026-07-01', updated_at: '2026-07-02', owner_id: 2, owner_name: 'Lin', owner_email: 'lin@example.com', total_count: 1 }] };
    }
    throw new Error(`Unexpected query: ${normalized}`);
  },
};

const dbPath = require.resolve('../config/db');
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: fakePool };
const app = require('../server');

const adminToken = jwt.sign({ id: 1, username: 'Ada' }, process.env.JWT_SECRET);
const userToken = jwt.sign({ id: 2, username: 'Lin' }, process.env.JWT_SECRET);
let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve, reject) => server.close((err) => err ? reject(err) : resolve()));
});

async function get(path, token) {
  return fetch(`${baseUrl}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
}

test('admin endpoints reject unauthenticated and normal users', async () => {
  const unauthenticated = await get('/api/admin/overview');
  assert.equal(unauthenticated.status, 401);
  const normalUser = await get('/api/admin/overview', userToken);
  assert.equal(normalUser.status, 403);
  assert.deepEqual(await normalUser.json(), { error: 'Administrator access required' });
});

test('overview returns aggregate counts without sensitive fields', async () => {
  const response = await get('/api/admin/overview', adminToken);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body, { total_users: 2, total_tasks: 4, completed_tasks: 2, pending_tasks: 1, tasks_created_today: 1 });
  assert.equal('password_hash' in body, false);
});

test('users endpoint applies validated search, sorting, and pagination', async () => {
  calls.length = 0;
  const response = await get('/api/admin/users?search=lin&page=2&limit=10&sort=name&order=asc', adminToken);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body.pagination, { page: 2, limit: 10, total: 11, totalPages: 2 });
  const query = calls.find((call) => call.sql.includes('COUNT(*) OVER()'));
  assert.match(query.sql, /ORDER BY u\.username ASC/);
  assert.deepEqual(query.params, ['%lin%', 10, 10]);
  assert.equal('password_hash' in body.data[0], false);
});

test('invalid pagination and filters return 400 before a data query', async () => {
  const badPage = await get('/api/admin/users?page=0', adminToken);
  assert.equal(badPage.status, 400);
  const badStatus = await get('/api/admin/tasks?status=Archived', adminToken);
  assert.equal(badStatus.status, 400);
  const badDateRange = await get('/api/admin/tasks?dueFrom=2026-09-01&dueTo=2026-08-01', adminToken);
  assert.equal(badDateRange.status, 400);
});

test('user details filters tasks with one profile aggregation and one paged query', async () => {
  calls.length = 0;
  const response = await get('/api/admin/users/2?status=Pending&priority=High&dateFrom=2026-01-01&page=1&limit=20', adminToken);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.user.username, 'Lin');
  assert.equal(body.tasks.data[0].title, 'Ship');
  const taskQuery = calls.find((call) => call.sql.includes('FROM tasks t WHERE'));
  assert.match(taskQuery.sql, /t\.status = \$2/);
  assert.match(taskQuery.sql, /t\.priority = \$3/);
  assert.deepEqual(taskQuery.params, [2, 'Pending', 'High', '2026-01-01', 20, 0]);
});

test('all-tasks endpoint joins owners and applies owner and due-date filters', async () => {
  calls.length = 0;
  const response = await get('/api/admin/tasks?owner=Lin&priority=High&dueFrom=2026-08-01&sort=dueDate&order=asc', adminToken);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.data[0].owner_email, 'lin@example.com');
  const query = calls.find((call) => call.sql.includes('FROM tasks t JOIN users u'));
  assert.match(query.sql, /JOIN users u ON u\.id = t\.user_id/);
  assert.match(query.sql, /ORDER BY t\.due_date ASC/);
  assert.match(query.sql, /u\.username ILIKE \$1/);
  assert.deepEqual(query.params, ['%Lin%', 'High', '2026-08-01', 20, 0]);
});
