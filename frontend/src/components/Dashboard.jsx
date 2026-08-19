import { useState, useEffect, useCallback } from 'react';
import {
  getTasks, getSummary, createTask, updateTask,
  updateTaskStatus, deleteTask, logout,
} from '../api/api';
import { useToast } from './Toast';
import ConfirmModal from './ConfirmModal';
import StatsCards from './StatsCards';
import TaskForm from './TaskForm';
import TaskList from './TaskList';

// This is the "container" component: it OWNS the data (tasks, summary) and
// all the functions that change that data. Child components (TaskForm, TaskList,
// StatsCards) are "dumb" - they just display what they're given and call back
// up to here when the user does something.
function Dashboard({ user, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sortBy, setSortBy] = useState('due_date');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const addToast = useToast();

  // useCallback so this function reference is stable across renders
  const loadData = useCallback(async () => {
    const filters = {};
    if (search) filters.search = search;
    if (statusFilter) filters.status = statusFilter;
    if (priorityFilter) filters.priority = priorityFilter;

    const [taskData, summaryData] = await Promise.all([getTasks(filters), getSummary()]);

    // Client-side sorting
    const sorted = [...taskData].sort((a, b) => {
      if (sortBy === 'due_date') {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date) - new Date(b.due_date);
      }
      if (sortBy === 'priority') {
        const order = { High: 0, Medium: 1, Low: 2 };
        return order[a.priority] - order[b.priority];
      }
      if (sortBy === 'status') {
        const order = { Pending: 0, 'In Progress': 1, Completed: 2 };
        return order[a.status] - order[b.status];
      }
      if (sortBy === 'newest') {
        return new Date(b.created_at) - new Date(a.created_at);
      }
      return 0;
    });

    setTasks(sorted);
    setSummary(summaryData);
  }, [search, statusFilter, priorityFilter, sortBy]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e) => {
      // Ctrl+N or Cmd+N to toggle new task form
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setShowForm((prev) => !prev);
        setEditingTask(null);
      }
      // Escape to close form
      if (e.key === 'Escape') {
        setShowForm(false);
        setEditingTask(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const handleAddOrUpdate = async (taskInput) => {
    try {
      if (editingTask) {
        await updateTask(editingTask.id, taskInput);
        setEditingTask(null);
        addToast('Task updated successfully', 'success');
      } else {
        await createTask(taskInput);
        setShowForm(false);
        addToast('Task created!', 'success');
      }
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to save task', 'error');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateTaskStatus(id, status);
      loadData();
      if (status === 'Completed') {
        addToast('Task completed! 🎉', 'success');
      }
    } catch (err) {
      addToast('Failed to update status', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTask(deleteTarget);
      setDeleteTarget(null);
      loadData();
      addToast('Task deleted', 'info');
    } catch (err) {
      addToast('Failed to delete task', 'error');
    }
  };

  const handleLogout = async () => {
    await logout();
    onLogout();
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const userInitial = user.username ? user.username.charAt(0).toUpperCase() : '?';

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>TaskFlow</h1>
        <div className="user-info">
          <div className="user-badge">
            <div className="user-avatar">{userInitial}</div>
            <span>{user.username}</span>
          </div>
          <button onClick={handleLogout}>Log out</button>
        </div>
      </header>

      <StatsCards summary={summary} />

      {/* Add task button or form */}
      {!showForm && !editingTask ? (
        <button
          className="task-form"
          onClick={() => setShowForm(true)}
          style={{
            cursor: 'pointer',
            justifyContent: 'center',
            color: 'var(--text-dim)',
            fontSize: '0.9rem',
            border: '1px dashed var(--border)',
            background: 'transparent',
          }}
        >
          + Add new task &nbsp;
          <kbd style={{
            background: 'var(--surface-hover)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            padding: '0.1rem 0.4rem',
            fontSize: '0.72rem',
            color: 'var(--text-dim)',
          }}>Ctrl+N</kbd>
        </button>
      ) : (
        <TaskForm
          onSubmit={handleAddOrUpdate}
          editingTask={editingTask}
          onCancelEdit={() => { setEditingTask(null); setShowForm(false); }}
        />
      )}

      <div className="filters">
        <input
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
          <option value="">All priorities</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="due_date">Sort: Due Date</option>
          <option value="priority">Sort: Priority</option>
          <option value="status">Sort: Status</option>
          <option value="newest">Sort: Newest</option>
        </select>
      </div>

      <div className="section-header">
        <span className="section-title">Tasks</span>
        <span className="task-count">{tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}</span>
      </div>

      <TaskList
        tasks={tasks}
        onStatusChange={handleStatusChange}
        onEdit={handleEdit}
        onDelete={(id) => setDeleteTarget(id)}
      />

      {deleteTarget && (
        <ConfirmModal
          title="Delete Task"
          message="Are you sure you want to permanently delete this task? This action cannot be undone."
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <div className="keyboard-hint">
        <span><kbd>Ctrl+N</kbd> New task</span>
        <span><kbd>Esc</kbd> Close form</span>
      </div>
    </div>
  );
}

export default Dashboard;
