import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getAdminOverview,
  getAdminTasks,
  getAdminUser,
  getAdminUsers,
  logout,
} from '../api/api';

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Completed'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High'];

function formatDate(value, includeTime = false) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(undefined, includeTime
    ? { dateStyle: 'medium', timeStyle: 'short' }
    : { dateStyle: 'medium' }).format(date);
}

function isOverdue(task) {
  if (!task.due_date || task.status === 'Completed') return false;
  const due = String(task.due_date).slice(0, 10);
  const today = new Date();
  const localToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return due < localToday;
}

function go(path) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function EmptyState({ title, message }) {
  return (
    <div className="admin-empty">
      <span aria-hidden="true">◇</span>
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="admin-error" role="alert">
      <strong>Something went wrong</strong>
      <span>{message}</span>
      <button onClick={onRetry}>Try again</button>
    </div>
  );
}

function LoadingState() {
  return <div className="admin-loading" role="status"><div className="spinner" /> Loading dashboard data…</div>;
}

function Pagination({ pagination, onPage }) {
  if (!pagination || pagination.totalPages <= 1) return null;
  return (
    <nav className="admin-pagination" aria-label="Pagination">
      <button disabled={pagination.page <= 1} onClick={() => onPage(pagination.page - 1)}>Previous</button>
      <span>Page {pagination.page} of {pagination.totalPages} · {pagination.total} results</span>
      <button disabled={pagination.page >= pagination.totalPages} onClick={() => onPage(pagination.page + 1)}>Next</button>
    </nav>
  );
}

function PageHeader({ eyebrow, title, description, action }) {
  return (
    <header className="admin-page-header">
      <div>
        <span className="admin-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </header>
  );
}

function OverviewPage() {
  const [state, setState] = useState({ loading: true, data: null, error: '' });
  const load = () => {
    setState((current) => ({ ...current, loading: true, error: '' }));
    getAdminOverview()
      .then((data) => setState({ loading: false, data, error: '' }))
      .catch((err) => setState({ loading: false, data: null, error: err.message }));
  };
  useEffect(load, []);

  if (state.loading) return <LoadingState />;
  if (state.error) return <ErrorState message={state.error} onRetry={load} />;
  const cards = [
    ['Registered users', state.data.total_users, 'people'],
    ['Total tasks', state.data.total_tasks, 'all'],
    ['Completed', state.data.completed_tasks, 'done'],
    ['Pending', state.data.pending_tasks, 'waiting'],
    ['Created today', state.data.tasks_created_today, 'today'],
  ];
  return (
    <>
      <PageHeader eyebrow="Admin overview" title="Workspace pulse" description="A read-only snapshot of TaskFlow activity." />
      <section className="admin-stats" aria-label="TaskFlow summary">
        {cards.map(([label, value, hint]) => (
          <article className="admin-stat" key={label}>
            <span className="admin-stat-hint">{hint}</span>
            <strong>{value}</strong>
            <span>{label}</span>
          </article>
        ))}
      </section>
      <section className="admin-callout">
        <div><span className="callout-dot" /> System visibility</div>
        <p>Use Users to investigate an individual account, or Tasks to review work across the organization.</p>
      </section>
    </>
  );
}

function UsersPage() {
  const [filters, setFilters] = useState({ search: '', sort: 'registered', order: 'desc', page: 1, limit: 20 });
  const [state, setState] = useState({ loading: true, data: [], pagination: null, error: '' });
  const load = useCallback(() => {
    setState((current) => ({ ...current, loading: true, error: '' }));
    getAdminUsers(filters)
      .then((result) => setState({ loading: false, data: result.data, pagination: result.pagination, error: '' }))
      .catch((err) => setState({ loading: false, data: [], pagination: null, error: err.message }));
  }, [filters]);
  useEffect(load, [load]);
  const update = (key, value) => setFilters((current) => ({ ...current, [key]: value, page: key === 'page' ? value : 1 }));

  return (
    <>
      <PageHeader eyebrow="Directory" title="Users" description="Account profiles and aggregated task activity." />
      <div className="admin-toolbar">
        <label className="admin-search"><span className="sr-only">Search users</span><input value={filters.search} onChange={(e) => update('search', e.target.value)} placeholder="Search name or email" /></label>
        <label><span>Sort</span><select value={filters.sort} onChange={(e) => update('sort', e.target.value)}>
          <option value="registered">Registration date</option><option value="name">Name</option><option value="email">Email</option>
          <option value="role">Role</option><option value="totalTasks">Total tasks</option><option value="completedTasks">Completed tasks</option><option value="pendingTasks">Pending tasks</option>
        </select></label>
        <label><span>Order</span><select value={filters.order} onChange={(e) => update('order', e.target.value)}><option value="desc">Descending</option><option value="asc">Ascending</option></select></label>
      </div>
      {state.loading ? <LoadingState /> : state.error ? <ErrorState message={state.error} onRetry={load} /> : state.data.length === 0 ? (
        <EmptyState title="No users found" message="Try a different name or email." />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Registered</th><th>Total</th><th>Completed</th><th>Pending</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>{state.data.map((user) => <tr key={user.id}>
              <td data-label="Name"><strong>{user.username}</strong></td><td data-label="Email">{user.email || '—'}</td>
              <td data-label="Role"><span className={`role-pill ${user.role}`}>{user.role}</span></td><td data-label="Registered">{formatDate(user.created_at)}</td>
              <td data-label="Total">{user.total_tasks}</td><td data-label="Completed">{user.completed_tasks}</td><td data-label="Pending">{user.pending_tasks}</td>
              <td><button className="table-link" onClick={() => go(`/admin/users/${user.id}`)} aria-label={`Open ${user.username}'s details`}>Open →</button></td>
            </tr>)}</tbody>
          </table>
        </div>
      )}
      <Pagination pagination={state.pagination} onPage={(page) => update('page', page)} />
    </>
  );
}

function TaskBadges({ task }) {
  return <><span className={`status-badge ${task.status.toLowerCase().replace(' ', '-')}`}>{task.status}</span><span className={`badge badge-${task.priority.toLowerCase()}`}>{task.priority}</span></>;
}

function UserDetailsPage({ userId }) {
  const [filters, setFilters] = useState({ status: '', priority: '', dateFrom: '', dateTo: '', sort: 'created', order: 'desc', page: 1, limit: 20 });
  const [state, setState] = useState({ loading: true, user: null, tasks: [], pagination: null, error: '' });
  const load = useCallback(() => {
    setState((current) => ({ ...current, loading: true, error: '' }));
    getAdminUser(userId, filters)
      .then((result) => setState({ loading: false, user: result.user, tasks: result.tasks.data, pagination: result.tasks.pagination, error: '' }))
      .catch((err) => setState({ loading: false, user: null, tasks: [], pagination: null, error: err.message }));
  }, [filters, userId]);
  useEffect(load, [load]);
  const update = (key, value) => setFilters((current) => ({ ...current, [key]: value, page: key === 'page' ? value : 1 }));

  if (state.loading) return <LoadingState />;
  if (state.error) return <ErrorState message={state.error} onRetry={load} />;
  return (
    <>
      <PageHeader eyebrow="User details" title={state.user.username} description={state.user.email || 'No email provided'} action={<button className="admin-secondary" onClick={() => go('/admin/users')}>← All users</button>} />
      <section className="profile-card">
        <div className="profile-avatar">{state.user.username.charAt(0).toUpperCase()}</div>
        <dl><div><dt>Employee ID</dt><dd>{state.user.employee_id}</dd></div><div><dt>Role</dt><dd><span className={`role-pill ${state.user.role}`}>{state.user.role}</span></dd></div><div><dt>Joined</dt><dd>{formatDate(state.user.created_at)}</dd></div></dl>
        <div className="profile-counts"><span><strong>{state.user.total_tasks}</strong>Total</span><span><strong>{state.user.completed_tasks}</strong>Completed</span><span><strong>{state.user.pending_tasks}</strong>Pending</span></div>
      </section>
      <div className="admin-toolbar admin-toolbar-wide">
        <label><span>Status</span><select value={filters.status} onChange={(e) => update('status', e.target.value)}><option value="">All statuses</option>{STATUS_OPTIONS.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label><span>Priority</span><select value={filters.priority} onChange={(e) => update('priority', e.target.value)}><option value="">All priorities</option>{PRIORITY_OPTIONS.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label><span>Created from</span><input type="date" value={filters.dateFrom} onChange={(e) => update('dateFrom', e.target.value)} /></label>
        <label><span>Created to</span><input type="date" value={filters.dateTo} onChange={(e) => update('dateTo', e.target.value)} /></label>
        <label><span>Sort</span><select value={filters.sort} onChange={(e) => update('sort', e.target.value)}><option value="created">Created</option><option value="updated">Updated</option><option value="dueDate">Due date</option><option value="title">Title</option><option value="status">Status</option><option value="priority">Priority</option></select></label>
      </div>
      {state.tasks.length === 0 ? <EmptyState title="No tasks found" message="This user has no tasks matching the current filters." /> : <TaskCards tasks={state.tasks} showOwner={false} />}
      <Pagination pagination={state.pagination} onPage={(page) => update('page', page)} />
    </>
  );
}

function TaskCards({ tasks, showOwner }) {
  return <section className="admin-task-list" aria-label="Tasks">{tasks.map((task) => {
    const overdue = isOverdue(task);
    return <article className={`admin-task-card ${overdue ? 'is-overdue' : ''}`} key={task.id}>
      <div className="admin-task-heading"><div><h3>{task.title}</h3>{showOwner && <button className="owner-link" onClick={() => go(`/admin/users/${task.owner_id}`)}>{task.owner_name} · {task.owner_email || 'No email'}</button>}</div><div className="admin-badges"><TaskBadges task={task} /></div></div>
      <p className={!task.description ? 'muted' : ''}>{task.description || 'No description'}</p>
      <dl className="task-dates"><div><dt>Due</dt><dd className={overdue ? 'overdue-text' : ''}>{formatDate(task.due_date)}{overdue ? ' · Overdue' : ''}</dd></div><div><dt>Created</dt><dd>{formatDate(task.created_at, true)}</dd></div><div><dt>Updated</dt><dd>{formatDate(task.updated_at, true)}</dd></div></dl>
    </article>;
  })}</section>;
}

function TasksPage() {
  const [filters, setFilters] = useState({ search: '', owner: '', status: '', priority: '', dueFrom: '', dueTo: '', sort: 'created', order: 'desc', page: 1, limit: 20 });
  const [state, setState] = useState({ loading: true, data: [], pagination: null, error: '' });
  const load = useCallback(() => {
    setState((current) => ({ ...current, loading: true, error: '' }));
    getAdminTasks(filters)
      .then((result) => setState({ loading: false, data: result.data, pagination: result.pagination, error: '' }))
      .catch((err) => setState({ loading: false, data: [], pagination: null, error: err.message }));
  }, [filters]);
  useEffect(load, [load]);
  const update = (key, value) => setFilters((current) => ({ ...current, [key]: value, page: key === 'page' ? value : 1 }));

  return (
    <>
      <PageHeader eyebrow="Organization" title="All tasks" description="Read-only task visibility across every TaskFlow account." />
      <div className="admin-toolbar admin-toolbar-wide">
        <label className="admin-search"><span className="sr-only">Search tasks or owners</span><input value={filters.search} onChange={(e) => update('search', e.target.value)} placeholder="Search task, owner, or email" /></label>
        <label><span>Owner</span><input value={filters.owner} onChange={(e) => update('owner', e.target.value)} placeholder="Name or email" /></label>
        <label><span>Status</span><select value={filters.status} onChange={(e) => update('status', e.target.value)}><option value="">All statuses</option>{STATUS_OPTIONS.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label><span>Priority</span><select value={filters.priority} onChange={(e) => update('priority', e.target.value)}><option value="">All priorities</option>{PRIORITY_OPTIONS.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label><span>Due from</span><input type="date" value={filters.dueFrom} onChange={(e) => update('dueFrom', e.target.value)} /></label>
        <label><span>Due to</span><input type="date" value={filters.dueTo} onChange={(e) => update('dueTo', e.target.value)} /></label>
        <label><span>Sort</span><select value={filters.sort} onChange={(e) => update('sort', e.target.value)}><option value="created">Created</option><option value="updated">Updated</option><option value="dueDate">Due date</option><option value="title">Title</option><option value="owner">Owner</option><option value="status">Status</option><option value="priority">Priority</option></select></label>
      </div>
      {state.loading ? <LoadingState /> : state.error ? <ErrorState message={state.error} onRetry={load} /> : state.data.length === 0 ? <EmptyState title="No tasks found" message="No tasks match the current filters." /> : <TaskCards tasks={state.data} showOwner />}
      <Pagination pagination={state.pagination} onPage={(page) => update('page', page)} />
    </>
  );
}

function AdminDashboard({ user, onLogout, path }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const route = useMemo(() => {
    const detail = path.match(/^\/admin\/users\/(\d+)\/?$/);
    if (detail) return { page: 'user', userId: detail[1] };
    if (path.startsWith('/admin/users')) return { page: 'users' };
    if (path.startsWith('/admin/tasks')) return { page: 'tasks' };
    return { page: 'overview' };
  }, [path]);
  const navigate = (destination) => { setMenuOpen(false); go(destination); };
  const handleLogout = async () => { await logout(); onLogout(); go('/'); };
  const links = [['overview', '/admin', 'Overview'], ['users', '/admin/users', 'Users'], ['tasks', '/admin/tasks', 'Tasks']];

  return (
    <div className="admin-shell">
      <button className="admin-menu-button" aria-expanded={menuOpen} aria-controls="admin-sidebar" onClick={() => setMenuOpen((open) => !open)}>☰ <span>Menu</span></button>
      {menuOpen && <button className="admin-sidebar-scrim" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}
      <aside className={`admin-sidebar ${menuOpen ? 'is-open' : ''}`} id="admin-sidebar">
        <div className="admin-brand"><span>TF</span><div><strong>TaskFlow</strong><small>Admin console</small></div></div>
        <nav aria-label="Admin navigation">{links.map(([key, destination, label]) => <button className={route.page === key || (key === 'users' && route.page === 'user') ? 'active' : ''} onClick={() => navigate(destination)} key={key}><span aria-hidden="true">{key === 'overview' ? '⌁' : key === 'users' ? '◎' : '✓'}</span>{label}</button>)}</nav>
        <div className="admin-sidebar-footer"><button onClick={() => navigate('/')}>← Back to TaskFlow</button><div><span className="profile-avatar small">{user.username.charAt(0).toUpperCase()}</span><div><strong>{user.username}</strong><small>Administrator</small></div></div><button onClick={handleLogout}>Log out</button></div>
      </aside>
      <main className="admin-content">
        {route.page === 'overview' && <OverviewPage />}
        {route.page === 'users' && <UsersPage />}
        {route.page === 'user' && <UserDetailsPage userId={route.userId} />}
        {route.page === 'tasks' && <TasksPage />}
      </main>
    </div>
  );
}

export default AdminDashboard;
