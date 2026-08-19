const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// JWT token helpers — token stored in localStorage so it survives page refresh
// and works across different domains (Vercel frontend → Render backend).
const getToken = () => localStorage.getItem('tf_token');
const setToken = (t) => localStorage.setItem('tf_token', t);
const clearToken = () => localStorage.removeItem('tf_token');

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      // Attach JWT on every request if we have one
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong');
  }
  return data;
}

// ---- Auth ----
export const login = async (employeeId, password) => {
  const data = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ employeeId, password }),
  });
  setToken(data.token); // save the JWT
  return data;
};

export const register = async (username, employeeId, password, email = '') => {
  const data = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, employeeId, password, email }),
  });
  setToken(data.token);
  return data;
};

export const checkSession = () => request('/api/auth/me');

export const logout = () => {
  clearToken(); // just delete the token — no server call needed
  return Promise.resolve();
};

// ---- Tasks ----
export const getTasks = (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  return request(`/todo${params ? `?${params}` : ''}`);
};

export const getSummary = () => request('/todo/summary');

export const createTask = (task) =>
  request('/todo', { method: 'POST', body: JSON.stringify(task) });

export const updateTask = (id, task) =>
  request(`/todo/${id}`, { method: 'PUT', body: JSON.stringify(task) });

export const updateTaskStatus = (id, status) =>
  request(`/todo/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });

export const deleteTask = (id) =>
  request(`/todo/${id}`, { method: 'DELETE' });

// ---- Read-only admin dashboard ----
const withQuery = (path, params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null)
  ).toString();
  return request(`${path}${query ? `?${query}` : ''}`);
};

export const getAdminOverview = () => request('/api/admin/overview');
export const getAdminUsers = (params) => withQuery('/api/admin/users', params);
export const getAdminUser = (id, params) => withQuery(`/api/admin/users/${id}`, params);
export const getAdminTasks = (params) => withQuery('/api/admin/tasks', params);
