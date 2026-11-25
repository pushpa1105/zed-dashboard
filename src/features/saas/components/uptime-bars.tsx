import { useTranslation } from '@/core/i18n/use-translation';
import { cn } from '@/shared/lib/cn';
import { formatDate } from '@/shared/lib/format';

import { uptimeOf } from '../lib/uptime';
import type { StatusComponent } from '../model/admin';

/** One bar per day; the color encodes downtime and each bar has a hover title. */
export function UptimeBars({ days }: { days: StatusComponent['days'] }) {
  const { t } = useTranslation('saas');
  return (
    <div className="space-y-1.5">
      <div
        className="flex h-8 gap-px"
        role="img"
        aria-label={t('status.uptimeLabel', {
          days: days.length,
          value: uptimeOf(days).toFixed(2),
        })}
      >
        {days.map((d) => (
          <span
            key={d.day}
            title={`${formatDate(d.day, 'MMM D')} · ${
              d.downtime ? t('status.downtime', { count: d.downtime }) : t('status.noDowntime')
            }`}
            className={cn(
              'flex-1 rounded-[2px] transition-opacity hover:opacity-70',
              d.downtime === 0 ? 'bg-success' : d.downtime < 30 ? 'bg-warning' : 'bg-destructive',
            )}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{t('status.daysAgo', { days: days.length })}</span>
        <span>{t('status.today')}</span>
      </div>
    </div>
  );
}
