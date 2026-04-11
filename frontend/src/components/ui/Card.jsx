export default function Card({ title, children, className = "" }) {
  return (
    <div className={`card p-4 ${className}`}>
      {title && <h3 className="text-sm font-semibold mb-2">{title}</h3>}
      {children}
    </div>
  );
}

