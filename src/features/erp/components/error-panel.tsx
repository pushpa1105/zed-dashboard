import { RotateCcw, TriangleAlert } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';

/** Inline "couldn't load" state with a retry button. */
export function ErrorPanel({ onRetry, className }: { onRetry: () => void; className?: string }) {
  const { t } = useTranslation('erp', { keyPrefix: 'common' });
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center',
        className,
      )}
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <TriangleAlert className="size-5" />
      </span>
      <div className="space-y-1">
        <p className="font-medium">{t('errorTitle')}</p>
        <p className="text-sm text-muted-foreground">{t('errorDescription')}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RotateCcw /> {t('retry')}
      </Button>
    </div>
  );
}
