import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';

type Tone = 'slate' | 'indigo' | 'amber' | 'blue' | 'emerald' | 'red';

const TONES: Record<Tone, string> = {
  slate: 'bg-slate-100 text-slate-600',
  indigo: 'bg-indigo-50 text-indigo-600',
  amber: 'bg-amber-50 text-amber-600',
  blue: 'bg-blue-50 text-blue-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  red: 'bg-red-50 text-red-600',
};

interface StatTileProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: Tone;
  hint?: string;
}

export function StatTile({ label, value, icon: Icon, tone = 'slate', hint }: StatTileProps) {
  return (
    <div className="card flex items-start justify-between gap-3 p-4">
      <div className="min-w-0">
        <p className="truncate text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{value}</p>
        {hint && <p className="mt-0.5 truncate text-xs text-slate-500">{hint}</p>}
      </div>
      <span className={clsx('rounded-lg p-2', TONES[tone])} aria-hidden="true">
        <Icon className="h-5 w-5" />
      </span>
    </div>
  );
}
