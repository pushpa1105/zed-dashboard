import { RefreshCw, TriangleAlert } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { cn } from '@/shared/lib/cn';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

import { GLASS } from './glass';

export function FinanceSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-3" aria-busy="true">
      <div className="space-y-4 lg:col-span-2">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className={cn('h-36 rounded-2xl', GLASS)} />
          ))}
        </div>
        <Skeleton className={cn('h-96 rounded-xl', GLASS)} />
      </div>
      <div className="space-y-4">
        <Skeleton className={cn('h-72 rounded-xl', GLASS)} />
        <Skeleton className={cn('h-80 rounded-xl', GLASS)} />
      </div>
    </div>
  );
}

export function FinanceError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation('erp', { keyPrefix: 'finance' });
  return (
    <Alert variant="destructive">
      <TriangleAlert />
      <AlertTitle>{t('error.title')}</AlertTitle>
      <AlertDescription>{t('error.description')}</AlertDescription>
      <AlertAction>
        <Button size="sm" variant="outline" onClick={onRetry}>
          <RefreshCw /> {t('error.retry')}
        </Button>
      </AlertAction>
    </Alert>
  );
}
