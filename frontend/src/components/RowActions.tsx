import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface RowAction {
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
  /** Render as a router link instead of a button. */
  to?: string;
  danger?: boolean;
  disabled?: boolean;
  title?: string;
}

const BASE =
  'inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40';

/** Icon-only action buttons for table rows and cards (each has an accessible label). */
export function RowActions({ actions }: { actions: RowAction[] }) {
  return (
    <div className="flex items-center justify-end gap-0.5">
      {actions.map(({ label, icon: Icon, onClick, to, danger, disabled, title }) => {
        const className = clsx(BASE, danger ? 'hover:text-red-600' : 'hover:text-indigo-600');
        return to ? (
          <Link key={label} to={to} className={className} aria-label={label} title={title ?? label}>
            <Icon className="h-4 w-4" />
          </Link>
        ) : (
          <button
            key={label}
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={className}
            aria-label={label}
            title={title ?? label}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
