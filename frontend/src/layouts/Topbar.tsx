import { LogOut, Menu } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RoleBadge } from '../components/Badge';
import { Button } from '../components/Button';
import type { User } from '../types';
import { initials } from '../utils/format';

interface TopbarProps {
  user: User;
  onMenu: () => void;
  onLogout: () => Promise<void>;
}

export function Topbar({ user, onMenu, onLogout }: TopbarProps) {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await onLogout();
    } finally {
      navigate('/login', { replace: true });
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={onMenu}
        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="ml-auto flex min-w-0 items-center gap-3">
        <div className="hidden min-w-0 text-right sm:block">
          <p className="truncate text-sm font-medium text-slate-900">{user.name}</p>
          <p className="truncate text-xs text-slate-500">{user.email}</p>
        </div>
        <RoleBadge role={user.role} />
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700"
          title={user.name}
        >
          {initials(user.name)}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          loading={loggingOut}
          icon={<LogOut className="h-4 w-4" />}
          aria-label="Log out"
        >
          <span className="hidden sm:inline">Log out</span>
        </Button>
      </div>
    </header>
  );
}
