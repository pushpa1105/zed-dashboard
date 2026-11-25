import { TrendingDown, TrendingUp } from 'lucide-react';

import { Trans, useTranslation } from '@/core/i18n/use-translation';
import { cn } from '@/shared/lib/cn';

import type { AnalyticsOverview } from '../model/overview';

/** Flat KPI card: label, number, outlined trend chip, and a one-line context hint. */
export function KpiCards({ kpis }: { kpis: AnalyticsOverview['kpis'] }) {
  const { t } = useTranslation('analytics', { keyPrefix: 'home' });

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi) => {
        const up = kpi.delta >= 0;
        const Icon = up ? TrendingUp : TrendingDown;
        return (
          <div key={kpi.key} className="space-y-2 rounded-lg border bg-card p-5">
            <p className="text-sm text-muted-foreground">{t(`kpis.${kpi.key}`)}</p>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-2xl font-semibold tabular-nums">
                {kpi.value.toLocaleString('en-US')}
              </p>
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium tabular-nums',
                  up
                    ? 'border-primary/40 bg-primary/5 text-primary'
                    : 'border-warning/50 bg-warning/10 text-foreground/80',
                )}
              >
                <Icon className="size-3.5" aria-hidden />
                {Math.abs(kpi.delta)}%
              </span>
            </div>
            <p className="pt-2 text-xs text-muted-foreground">
              <Trans
                t={t}
                i18nKey="kpis.extra"
                values={{ value: kpi.extra.toLocaleString('en-US') }}
                components={{
                  1: <span className={cn('font-medium', up ? 'text-primary' : 'text-warning')} />,
                }}
              />
            </p>
          </div>
        );
      })}
    </div>
  );
}
