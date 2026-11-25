import { Landmark } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { ErrorState } from '@/shared/components/display/error-state';
import { StatusBadge } from '@/shared/components/display/status-badge';
import type { Tone } from '@/shared/components/display/tone';
import { formatDate } from '@/shared/lib/format';
import { Skeleton } from '@/shared/ui/skeleton';

import { usePayouts } from '../api/finance-api';
import { formatMoney } from '../lib/money';
import type { Payout } from '../model/finance';

const PAYOUT_TONE: Record<Payout['status'], Tone> = {
  paid: 'success',
  in_transit: 'info',
  scheduled: 'neutral',
};

/** Next bank deposit, schedule and the most recent payouts. */
export function PayoutsCard() {
  const { t, i18n } = useTranslation('ecommerce');
  const payouts = usePayouts();
  const data = payouts.data;

  if (payouts.isError)
    return <ErrorState title={t('common.error')} onRetry={() => void payouts.refetch()} />;
  if (!data) return <Skeleton className="h-96 rounded-xl" />;

  return (
    <SectionCard
      title={t('payouts.title')}
      description={t('payouts.schedule', {
        interval: t(`payouts.interval.${data.schedule.interval}`),
        count: data.schedule.delayDays,
      })}
    >
      {data.next && (
        <div className="rounded-lg border bg-muted/40 p-4">
          <p className="text-xs text-muted-foreground">
            {t('payouts.next', { date: formatDate(data.next.arrivesAt, 'ddd, MMM D') })}
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
            {formatMoney(data.next.amount, i18n.language)}
          </p>
          <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Landmark className="size-3.5" />
            {data.account.bank} •••• {data.account.last4}
          </p>
        </div>
      )}
      <p className="mt-4 flex justify-between text-sm">
        <span className="text-muted-foreground">{t('payouts.pending')}</span>
        <span className="font-medium tabular-nums">{formatMoney(data.pending, i18n.language)}</span>
      </p>
      <ul className="mt-4 divide-y border-t" aria-label={t('payouts.recent')}>
        {data.payouts.slice(0, 6).map((payout) => (
          <li key={payout.id} className="flex items-center gap-3 py-2.5 text-sm">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{formatDate(payout.arrivesAt, 'MMM D')}</p>
              <p className="text-xs text-muted-foreground">
                {t('payouts.payments', { count: payout.transactions })}
              </p>
            </div>
            <StatusBadge
              status={payout.status}
              tone={PAYOUT_TONE[payout.status]}
              variant="dot"
              label={t(`payouts.status.${payout.status}`)}
            />
            <span className="w-24 text-right tabular-nums">
              {formatMoney(payout.amount, i18n.language)}
            </span>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
