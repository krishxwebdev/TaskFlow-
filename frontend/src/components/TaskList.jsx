import TaskItem from './TaskItem';

function TaskList({ tasks, onStatusChange, onEdit, onDelete }) {
  if (tasks.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📝</div>
        <h3>No tasks yet</h3>
        <p>Create your first task to get started. Use the form above or press <kbd style={{ background: '#1b1c29', border: '1px solid #262838', borderRadius: '4px', padding: '0.1rem 0.3rem', fontSize: '0.75rem' }}>Ctrl+N</kbd></p>
      </div>
    );
  }

  return (
    <div className="task-list">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onStatusChange={onStatusChange}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

export default TaskList;
