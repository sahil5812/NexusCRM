export default function Card({ children, className = '', glow = '' }) {
  return (
    <div className={`glass-card ${glow} ${className}`.trim()}>
      {children}
    </div>
  );
}
