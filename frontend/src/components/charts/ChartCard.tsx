import clsx from 'clsx';
import type { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  description?: string;
  className?: string;
  /** Screen-reader table mirroring the chart's data. */
  table: { columns: string[]; rows: (string | number)[][] };
  /** Shown instead of the chart when there is nothing to plot. */
  isEmpty?: boolean;
  children: ReactNode;
}

export function ChartCard({ title, description, className, table, isEmpty, children }: ChartCardProps) {
  return (
    <section className={clsx('card flex flex-col p-4 sm:p-5', className)} aria-label={title}>
      <header className="mb-3">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {description && <p className="text-xs text-slate-500">{description}</p>}
      </header>
      {isEmpty ? (
        <div className="flex h-56 items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-500">
          No data to chart yet
        </div>
      ) : (
        <div className="h-64 w-full" aria-hidden="true">
          {children}
        </div>
      )}
      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            {table.columns.map((c) => (
              <th key={c} scope="col">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
