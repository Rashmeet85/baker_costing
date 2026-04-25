export function EmptyState({ title, body }) {
  return (
    <div className="glass-card surface-card">
      <div className="stack-sm">
        <strong>{title}</strong>
        <span className="muted">{body}</span>
      </div>
    </div>
  );
}
