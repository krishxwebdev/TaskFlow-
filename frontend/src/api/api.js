// One place that knows how to talk to the backend.
// Every component imports functions from here instead of calling fetch() directly.
// That way, if the backend URL ever changes, we only edit it in ONE place.

const BASE_URL = 'http://localhost:5000';

// A small wrapper around fetch() that:
// 1. Always sends/receives cookies (credentials: 'include') -> needed for sessions
// 2. Always sends/parses JSON
// 3. Throws an error if the response is not ok, so components can use try/catch
async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong');
  }
  return data;
}

// ---- Auth ----
export const login = (employeeId, password) =>
  request('/api/auth/login', { method: 'POST', body: JSON.stringify({ employeeId, password }) });

export const register = (username, employeeId, password) =>
  request('/api/auth/register', { method: 'POST', body: JSON.stringify({ username, employeeId, password }) });

export const checkSession = () => request('/api/auth/me');

export const logout = () => request('/api/auth/logout', { method: 'POST' });

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
