export default function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
