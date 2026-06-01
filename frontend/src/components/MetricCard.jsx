const accentMap = {
  blue: {
    icon: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50',
    border: 'border-l-blue-500 dark:border-l-blue-400',
  },
  green: {
    icon: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/50',
    border: 'border-l-green-500 dark:border-l-green-400',
  },
  indigo: {
    icon: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50',
    border: 'border-l-indigo-500 dark:border-l-indigo-400',
  },
  amber: {
    icon: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50',
    border: 'border-l-amber-500 dark:border-l-amber-400',
  },
};

export default function MetricCard({ title, value, icon: Icon, accent = 'blue' }) {
  const style = accentMap[accent] || accentMap.blue;

  return (
    <div className={`bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg border-l-2 ${style.border} p-5`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
        <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${style.icon}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50 tabular-nums">
        {value}
      </p>
    </div>
  );
}
