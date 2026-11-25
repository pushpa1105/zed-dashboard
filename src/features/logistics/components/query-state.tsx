import type { ReactNode } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { ErrorState } from '@/shared/components/display/error-state';

/** Error panel with retry, shared by every logistics page. */
export function LoadError({ onRetry, className }: { onRetry: () => void; className?: string }) {
  const { t } = useTranslation('logistics');
  return (
    <ErrorState
      title={t('error.title')}
      description={t('error.description')}
      retryLabel={t('error.retry')}
      onRetry={onRetry}
      className={className}
    />
  );
}

/** Renders children once data is there; a skeleton or error otherwise. */
export function QueryBoundary<T>({
  query,
  skeleton,
  children,
}: {
  query: { data: T | undefined; isPending: boolean; isError: boolean; refetch: () => unknown };
  skeleton: ReactNode;
  children: (data: T) => ReactNode;
}) {
  if (query.isError) return <LoadError onRetry={() => void query.refetch()} />;
  if (query.isPending || query.data === undefined) return <>{skeleton}</>;
  return <>{children(query.data)}</>;
}
