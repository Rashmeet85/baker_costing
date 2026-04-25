export function PageSkeleton({ fullScreen = false }) {
  return (
    <div className="app-shell" style={fullScreen ? { display: 'grid', alignItems: 'center' } : undefined}>
      <div className="stack">
        <div className="glass-card hero-card skeleton" style={{ height: 140 }} />
        <div className="glass-card surface-card skeleton" style={{ height: 180 }} />
        <div className="metrics">
          <div className="glass-card metric skeleton" style={{ height: 100 }} />
          <div className="glass-card metric skeleton" style={{ height: 100 }} />
        </div>
      </div>
    </div>
  );
}
