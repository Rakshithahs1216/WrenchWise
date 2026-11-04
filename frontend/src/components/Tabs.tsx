import clsx from 'clsx';

interface Tab<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface TabsProps<T extends string> {
  tabs: Tab<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}

export function Tabs<T extends string>({ tabs, value, onChange, label }: TabsProps<T>) {
  return (
    <div role="tablist" aria-label={label} className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={clsx(
              'inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              active ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white hover:text-slate-900',
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={clsx(
                  'rounded-full px-1.5 text-xs tabular-nums',
                  active ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600',
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
