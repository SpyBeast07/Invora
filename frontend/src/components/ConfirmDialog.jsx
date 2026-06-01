import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import Button from './Button';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = false,
  isLoading = false
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-3xl border border-slate-800/60 bg-slate-900 p-6 space-y-5 shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-lg cursor-pointer"
          disabled={isLoading}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4 pt-1">
          <div className={`p-3 rounded-2xl border flex-shrink-0
            ${isDanger 
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' 
              : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
            }
          `}>
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-100 leading-tight select-none">
              {title}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed select-text">
              {message}
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-3 justify-end text-sm select-none">
          <Button 
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button 
            variant={isDanger ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
