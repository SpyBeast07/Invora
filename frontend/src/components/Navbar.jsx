import React from 'react';
import { Menu, Bell, Shield, CloudLightning } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';

export default function Navbar({ onMenuToggle }) {
  // Integrate active backend health checking dynamically!
  const { data: healthData } = useQuery({
    queryKey: ['backendHealth'],
    queryFn: () => apiService.getDashboard().catch(() => null), // If fails, returns null gracefully
    refetchInterval: 15000, // Ping every 15s to verify live state!
  });

  const isOnline = !!healthData;

  return (
    <header className="flex items-center justify-between h-16 px-6 border-b border-slate-800/40 bg-slate-900/50 backdrop-blur-md sticky top-0 z-30">
      {/* Mobile Hamburger Toggler */}
      <button 
        onClick={onMenuToggle}
        className="p-1 text-slate-400 hover:text-slate-200 lg:hidden rounded-lg hover:bg-slate-800/40 transition-colors"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Page Context (Empty or Welcome section) */}
      <div className="hidden sm:flex sm:items-center sm:gap-2 text-slate-400 text-sm">
        <span>Invora Management Console</span>
        <span className="text-slate-600">/</span>
        <span className="text-slate-200">v1.0.0</span>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-4">
        {/* Real-time Health check status indicator badge */}
        <div className={`
          flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold select-none border transition-all duration-300
          ${isOnline 
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
            : 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse'
          }
        `}>
          <CloudLightning className="w-3.5 h-3.5" />
          <span>{isOnline ? 'Active' : 'Offline'}</span>
        </div>

        {/* Action icons */}
        <button className="relative p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-xl transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.6)]" />
        </button>

        {/* User profile avatar info */}
        <div className="flex items-center gap-3 border-l border-slate-800/60 pl-4">
          <div className="flex flex-col text-right hidden md:flex">
            <span className="text-xs font-semibold text-slate-200 leading-3">Invora Operator</span>
            <span className="text-[10px] text-slate-500 font-medium">Administrator</span>
          </div>
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-800 text-slate-300 border border-slate-700/50">
            <Shield className="w-4 h-4 text-cyan-400" />
          </div>
        </div>
      </div>
    </header>
  );
}
