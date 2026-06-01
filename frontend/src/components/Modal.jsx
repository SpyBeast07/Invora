import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'md', footer }) {
  if (!isOpen) return null;

  const maxWidthMap = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 dark:bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`
          w-full ${maxWidthMap[maxWidth] || maxWidthMap.md}
          bg-white dark:bg-slate-800
          rounded-lg border border-slate-200 dark:border-slate-700
          flex flex-col max-h-[90vh]
        `}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-700 shrink-0">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>

        {footer && (
          <div className="flex items-center justify-end gap-2 px-5 pb-5 pt-3 border-t border-slate-100 dark:border-slate-700 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
