import { ArrowUpRight } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';

import type { FinanceOverview } from '../model/overview';

import { GLASS } from './glass';

/** Company formation progress: stepped bar + ETA, like an onboarding tracker. */
export function FormationCard({ formation }: { formation: FinanceOverview['formation'] }) {
  const { t } = useTranslation('erp', { keyPrefix: 'finance' });

  return (
    <SectionCard
      className={GLASS}
      title={t('formation.title')}
      description={t('formation.inProgress')}
      action={
        <Button variant="outline" size="icon-sm" aria-label={t('actions.open')}>
          <ArrowUpRight />
        </Button>
      }
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <div
            className="relative h-9 overflow-hidden rounded-lg bg-muted ring-1 ring-border/60 ring-inset"
            role="progressbar"
            aria-valuenow={formation.progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-lg bg-primary/85 bg-[repeating-linear-gradient(135deg,transparent_0_8px,color-mix(in_oklch,var(--primary-foreground)_14%,transparent)_8px_16px)] transition-[width] duration-700"
              style={{ width: `${formation.progress}%` }}
            />
            <span className="absolute inset-y-0 right-3 flex items-center text-xs font-medium tabular-nums">
              {formation.progress}%
            </span>
          </div>
          <div className="flex gap-1" aria-hidden>
            {Array.from({ length: formation.steps }, (_, i) => (
              <span
                key={i}
                className={cn(
                  'h-1 flex-1 rounded-full',
                  i < formation.step ? 'bg-primary' : 'bg-border',
                )}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {t('formation.step', { step: formation.step, steps: formation.steps })}
          </p>
        </div>
        <div className="space-y-0.5">
          <p className="text-sm font-medium">{t('formation.estimated')}</p>
          <p className="text-xs text-muted-foreground">
            {t('formation.businessDays', { count: formation.businessDays })}
          </p>
        </div>
        <Button className="w-full" variant="secondary">
          {t('formation.view')}
        </Button>
      </div>
    </SectionCard>
  );
}
