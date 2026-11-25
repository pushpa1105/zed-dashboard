import { CircleAlert, RotateCw } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Button } from '@/shared/ui/button';

/** Inline error for a failed widget; the rest of the dashboard keeps working. */
export function WidgetError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation('hr');
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-center">
      <CircleAlert className="size-5 text-destructive" />
      <p className="text-sm text-muted-foreground">{t('error.title')}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RotateCw /> {t('error.retry')}
      </Button>
    </div>
  );
}
