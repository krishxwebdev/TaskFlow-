// Renders ONE task row with priority accent, description preview, and status badge.
function TaskItem({ task, onStatusChange, onEdit, onDelete }) {
  const isOverdue =
    task.due_date &&
    task.status !== 'Completed' &&
    new Date(task.due_date) < new Date(new Date().toDateString());

  const statusClass = task.status.toLowerCase().replace(' ', '-');

  return (
    <div className={`task-item priority-${task.priority.toLowerCase()} status-${statusClass}`}>
      <div className="task-main">
        <span className="task-title">{task.title}</span>
        {task.description && (
          <span className="task-description">{task.description}</span>
        )}
        <div className="task-meta">
          <span className={`badge badge-${task.priority.toLowerCase()}`}>{task.priority}</span>
          <span className={`status-badge ${statusClass}`}>{task.status}</span>
          {task.due_date && (
            <span className={`due-date ${isOverdue ? 'overdue' : ''}`}>
              📅 {task.due_date.split('T')[0]}
              {isOverdue && ' (Overdue)'}
            </span>
          )}
        </div>
      </div>

      <div className="task-actions">
        <select
          value={task.status}
          onChange={(e) => onStatusChange(task.id, e.target.value)}
        >
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
        <button onClick={() => onEdit(task)}>Edit</button>
        <button className="danger" onClick={() => onDelete(task.id)}>Delete</button>
      </div>
    </div>
  );
}

export default TaskItem;
