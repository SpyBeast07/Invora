import React from 'react';

export default function MetricCard({ title, value, icon: Icon, colorClass, borderClass }) {
  return (
    <div className={`
      relative p-6 rounded-2xl border bg-slate-900/40 backdrop-blur-md overflow-hidden hover:-translate-y-1 transition-all duration-300 group
      ${borderClass || 'border-slate-800/40'}
    `}>
      {/* Decorative Glow effect on Hover */}
      <div className={`
        absolute -right-12 -bottom-12 w-32 h-32 rounded-full opacity-5 blur-2xl group-hover:opacity-10 transition-opacity duration-300
        ${colorClass || 'bg-cyan-500'}
      `} />

      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <span className="text-sm font-medium text-slate-400 select-none">
            {title}
          </span>
          <div className="text-3xl font-bold tracking-tight text-slate-100">
            {value}
          </div>
        </div>

        {/* Icon Widget */}
        <div className={`
          flex items-center justify-center w-12 h-12 rounded-xl border bg-slate-950/40
          ${borderClass || 'border-slate-800/40'}
        `}>
          <Icon className={`w-5 h-5 ${colorClass || 'text-cyan-400'} group-hover:scale-110 transition-transform duration-300`} />
        </div>
      </div>
    </div>
  );
}
