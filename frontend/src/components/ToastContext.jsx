import React, { createContext, useContext, useState } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null); // { type, message }

  const showToast = (type, message) => {
    setToast({ type, message });
    // Auto dismiss after 4 seconds
    setTimeout(() => {
      setToast(current => current?.message === message ? null : current);
    }, 4000);
  };

  const toastHandlers = {
    success: (msg) => showToast('success', msg),
    error: (msg) => showToast('error', msg),
    dismiss: () => setToast(null)
  };

  return (
    <ToastContext.Provider value={toastHandlers}>
      {children}
      {toast && (
        <div className={`
          fixed top-20 right-6 z-[100] flex items-center gap-3 px-4 py-3.5 rounded-2xl border backdrop-blur-md shadow-2xl transition-all duration-500 animate-slide-in select-none max-w-sm
          ${toast.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
            : 'bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-[0_0_20px_rgba(239,68,68,0.15)]'
          }
        `}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <XCircle className="w-5 h-5 flex-shrink-0" />}
          <div className="text-xs font-semibold tracking-wide leading-relaxed">{toast.message}</div>
          <button 
            onClick={toastHandlers.dismiss}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 transition-colors ml-auto cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
