import { Menu, Sun, Moon } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useTheme } from './ThemeContext';

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/products': 'Products',
  '/customers': 'Customers',
  '/orders': 'Orders',
};

export default function Navbar({ onMenuToggle }) {
  const { theme, toggleTheme } = useTheme();
  const { pathname } = useLocation();
  const pageTitle = PAGE_TITLES[pathname] || 'Invora';

  return (
    <header className="h-14 flex items-center justify-between px-4 lg:px-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-1.5 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:block">Invora</span>
          <span className="text-xs text-slate-300 dark:text-slate-600 hidden sm:block">/</span>
          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{pageTitle}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-700" />

        <div className="flex items-center gap-2 pl-1">
          <div className="w-7 h-7 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-semibold text-white">IO</span>
          </div>
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300 hidden md:block">
            Operator
          </span>
        </div>
      </div>
    </header>
  );
}
