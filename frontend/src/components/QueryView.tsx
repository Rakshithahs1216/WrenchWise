import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { ErrorState } from './ErrorState';

interface QueryViewProps<T> {
  query: UseQueryResult<T>;
  loading: ReactNode;
  /** Rendered instead of children when `isEmpty(data)` is true. */
  empty?: ReactNode;
  isEmpty?: (data: T) => boolean;
  children: (data: T) => ReactNode;
}

/** Renders the loading skeleton, an error with retry, an empty state, or the data. */
export function QueryView<T>({ query, loading, empty, isEmpty, children }: QueryViewProps<T>) {
  if (query.isPending) return <>{loading}</>;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  if (empty && isEmpty?.(query.data)) return <>{empty}</>;
  return <>{children(query.data)}</>;
}
