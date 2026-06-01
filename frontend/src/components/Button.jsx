import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  type = 'button',
  variant = 'primary', // 'primary' | 'secondary' | 'danger' | 'emerald' | 'indigo'
  size = 'md', // 'sm' | 'md' | 'lg'
  isLoading = false,
  disabled = false,
  icon: Icon,
  onClick,
  className = '',
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-bold rounded-xl transition-all select-none cursor-pointer duration-200 disabled:opacity-60 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)]',
    secondary: 'border border-slate-800 text-slate-350 hover:text-slate-200 hover:bg-slate-850/60',
    danger: 'border border-rose-500/20 bg-rose-500/5 text-rose-400 hover:bg-rose-500/10',
    emerald: 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]',
    indigo: 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-slate-950 hover:shadow-[0_0_15px_rgba(99,102,241,0.4)]'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5 flex-shrink-0" />
      ) : Icon ? (
        <Icon className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
      ) : null}
      <span>{children}</span>
    </button>
  );
}
