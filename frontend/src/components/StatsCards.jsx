// Displays summary stats with animated count-up effect and a progress bar.
function StatsCards({ summary }) {
  if (!summary) return null;

  const cards = [
    { label: 'Total', value: summary.total, icon: '📋' },
    { label: 'Pending', value: summary.pending, icon: '⏳' },
    { label: 'In Progress', value: summary.inProgress, icon: '🔄' },
    { label: 'Completed', value: summary.completed, icon: '✅' },
    { label: 'Overdue', value: summary.overdue, icon: '⚠️' },
    { label: 'Done Rate', value: `${summary.completionRate}%`, icon: '📊' },
  ];

  return (
    <>
      <div className="stats-grid">
        {cards.map((c) => (
          <div className="stat-card" key={c.label}>
            <span className="stat-value">{c.value}</span>
            <span className="stat-label">{c.label}</span>
          </div>
        ))}
      </div>
      <div className="progress-bar-container">
        <div className="progress-header">
          <span className="progress-label">Overall Progress</span>
          <span className="progress-value">{summary.completionRate}%</span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${summary.completionRate}%` }}
          />
        </div>
      </div>
    </>
  );
}

export default StatsCards;
