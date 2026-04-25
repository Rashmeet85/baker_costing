export function SectionCard({ children, className = '' }) {
  return <section className={`glass-card surface-card ${className}`.trim()}>{children}</section>;
}
