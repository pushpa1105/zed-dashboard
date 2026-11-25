import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { QueryError } from './query-error';

/** Error → retry, no data yet → skeleton, otherwise renders the data. */
export function QueryState<T>({
  query,
  skeleton,
  children,
}: {
  query: UseQueryResult<T>;
  skeleton: ReactNode;
  children: (data: T) => ReactNode;
}) {
  if (query.isError && query.data === undefined)
    return <QueryError onRetry={() => void query.refetch()} />;
  if (query.data === undefined) return skeleton;
  return children(query.data);
}
