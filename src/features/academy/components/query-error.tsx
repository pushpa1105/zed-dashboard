import { RefreshCw, TriangleAlert } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';

/** Page-level load error with a retry button. */
export function QueryError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation('academy');
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
