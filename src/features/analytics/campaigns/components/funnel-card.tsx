import { useTranslation } from '@/core/i18n/use-translation';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { Skeleton } from '@/shared/ui/skeleton';

import { compact } from '../lib/format';
import type { MarketingOverview } from '../model/marketing';

/**
 * Horizontal funnel: each stage is a bar whose width is its share of the
 * first stage, centered so the narrowing reads as a funnel. The step
 * conversion sits beside each bar, so no value depends on color alone.
 */
function Funnel({ stages }: { stages: MarketingOverview['funnel'] }) {
  const { t } = useTranslation('analytics', { keyPrefix: 'campaigns' });
  const top = stages[0]?.value || 1;

  return (
    <ol className="space-y-2.5">
      {stages.map((stage, i) => {
        const share = stage.value / top;
        const prev = stages[i - 1]?.value;
        const step = prev ? (stage.value / prev) * 100 : null;
        return (
          <li key={stage.stage} className="grid grid-cols-[5.5rem_1fr] items-center gap-3">
            <span className="truncate text-xs text-muted-foreground">{stage.stage}</span>
            <div className="space-y-1">
              <div className="relative flex h-8 items-center justify-center rounded-md bg-muted/60">
                <div
                  className="h-full rounded-md"
                  style={{
                    width: `${Math.max(share * 100, 14)}%`,
                    background: `color-mix(in srgb, var(--chart-1) ${Math.round(100 - i * 14)}%, var(--chart-4))`,
                  }}
                />
                {/* Value sits above the bar so it never overflows a narrow stage. */}
                <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold tabular-nums">
                  <span className="rounded bg-card/90 px-1.5 py-0.5 text-foreground shadow-xs">
                    {compact(stage.value)}
                  </span>
                </span>
              </div>
              {step !== null && (
                <p className="text-[0.7rem] text-muted-foreground tabular-nums">
                  {t('funnel.ofPrevious', { value: step.toFixed(1) })}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function FunnelCard({ funnel }: { funnel?: MarketingOverview['funnel'] }) {
  const { t } = useTranslation('analytics', { keyPrefix: 'campaigns' });
  const first = funnel?.[0]?.value;
  const last = funnel?.at(-1)?.value;

  return (
    <SectionCard
      title={t('funnel.title')}
      description={t('funnel.description')}
      className="lg:col-span-4"
      footer={
        first && last ? (
          <div className="flex items-center justify-between">
            <span>{t('funnel.overall')}</span>
            <span className="font-medium text-foreground tabular-nums">
              {((last / first) * 100).toFixed(2)}%
            </span>
          </div>
        ) : undefined
      }
    >
      {funnel ? <Funnel stages={funnel} /> : <Skeleton className="h-64 w-full" />}
    </SectionCard>
  );
}
