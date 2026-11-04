import clsx from 'clsx';
import { Wrench, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import type { Role } from '../types';
import { NAV_ITEMS } from './navigation';

interface SidebarProps {
  role: Role;
  mobileOpen: boolean;
  onClose: () => void;
}

function Brand() {
  return (
    <div className="flex items-center gap-2 px-2">
      <span className="rounded-lg bg-indigo-600 p-1.5 text-white">
        <Wrench className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="text-lg font-semibold tracking-tight text-white">WrenchWise</span>
    </div>
  );
}

function NavList({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  return (
    <nav aria-label="Main" className="mt-8 space-y-1">
      {NAV_ITEMS[role].map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white',
            )
          }
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

export function Sidebar({ role, mobileOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Desktop: fixed column */}
      <aside className="hidden w-60 shrink-0 bg-slate-900 px-3 py-5 lg:fixed lg:inset-y-0 lg:block">
        <Brand />
        <NavList role={role} />
      </aside>

      {/* Mobile: drawer */}
      <div className={clsx('fixed inset-0 z-40 lg:hidden', !mobileOpen && 'pointer-events-none')} aria-hidden={!mobileOpen}>
        <div
          className={clsx('absolute inset-0 bg-slate-900/50 transition-opacity', mobileOpen ? 'opacity-100' : 'opacity-0')}
          onClick={onClose}
        />
        <aside
          className={clsx(
            'absolute inset-y-0 left-0 w-64 max-w-[80vw] bg-slate-900 px-3 py-5 transition-transform',
            mobileOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="flex items-center justify-between">
            <Brand />
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
              aria-label="Close navigation"
              tabIndex={mobileOpen ? 0 : -1}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <NavList role={role} onNavigate={onClose} />
        </aside>
      </div>
    </>
  );
}
