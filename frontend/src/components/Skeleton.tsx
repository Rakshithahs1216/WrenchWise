import clsx from 'clsx';

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('animate-pulse rounded-md bg-slate-200/80', className)} aria-hidden="true" />;
}

export function CardListSkeleton({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={clsx('space-y-3', className)} role="status" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card space-y-3 p-4">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="card divide-y divide-slate-100" role="status" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="ml-auto h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function StatTilesSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6" role="status" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card space-y-3 p-4">
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-7 w-1/3" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={clsx('card p-4', className)} role="status" aria-label="Loading chart">
      <Skeleton className="mb-4 h-4 w-40" />
      <Skeleton className="h-56 w-full" />
    </div>
  );
}
