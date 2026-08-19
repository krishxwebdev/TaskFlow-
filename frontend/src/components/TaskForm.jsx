import { useState, useEffect, useRef } from 'react';

// This ONE form is reused for both "Add Task" and "Edit Task".
// Now includes a description field.
function TaskForm({ onSubmit, editingTask, onCancelEdit }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('');
  const titleRef = useRef(null);

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description || '');
      setPriority(editingTask.priority);
      setDueDate(editingTask.due_date ? editingTask.due_date.split('T')[0] : '');
    } else {
      setTitle('');
      setDescription('');
      setPriority('Medium');
      setDueDate('');
    }
    // Auto-focus the title input
    setTimeout(() => titleRef.current?.focus(), 100);
  }, [editingTask]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({ title, description, priority, dueDate: dueDate || null });
    if (!editingTask) {
      setTitle('');
      setDescription('');
      setPriority('Medium');
      setDueDate('');
    }
  };

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <input
        ref={titleRef}
        placeholder="Task title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <select value={priority} onChange={(e) => setPriority(e.target.value)}>
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
      </select>
      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
      />
      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={1}
      />
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button type="submit">{editingTask ? 'Save changes' : 'Add task'}</button>
        <button type="button" className="secondary" onClick={onCancelEdit}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default TaskForm;
