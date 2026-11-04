import type { ReactNode } from 'react';

/** One row of filters above a list; wraps on small screens. */
export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="card mb-4 grid gap-3 p-3 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-center">{children}</div>;
}
