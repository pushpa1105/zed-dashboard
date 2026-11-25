import { ArrowUpRight } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Gauge } from '@/shared/components/charts/gauge';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { TrendBadge } from '@/shared/components/dashboard/trend-badge';
import { Button } from '@/shared/ui/button';

import { count } from '../lib/format';
import type { FinanceOverview } from '../model/overview';

import { GLASS } from './glass';

export function SuccessCard({ success }: { success: FinanceOverview['success'] }) {
  const { t } = useTranslation('erp', { keyPrefix: 'finance' });

  return (
    <SectionCard
      className={GLASS}
      title={t('success.title')}
      description={t('success.description')}
      action={
        <Button variant="outline" size="icon-sm" aria-label={t('actions.open')}>
          <ArrowUpRight />
        </Button>
      }
    >
      <div className="flex justify-center pb-1">
        <TrendBadge delta={success.delta} />
      </div>
      <Gauge value={success.rate} display={`${success.rate.toFixed(1)}%`} />
      <p className="mt-3 text-center text-xs text-muted-foreground">
        {t('success.vsLast', { delta: success.delta.toFixed(1) })}
      </p>
      <dl className="mt-5 grid grid-cols-2 divide-x rounded-xl bg-muted/50 py-3 text-center">
        <div>
          <dt className="text-xs text-muted-foreground">{t('success.total')}</dt>
          <dd className="text-lg font-semibold tabular-nums">{count(success.total)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{t('success.processing')}</dt>
          <dd className="text-lg font-semibold tabular-nums">{count(success.processing)}</dd>
        </div>
      </dl>
    </SectionCard>
  );
}
