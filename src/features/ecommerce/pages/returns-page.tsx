import { Check, PackageOpen, RotateCcw, X } from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { Link } from '@/core/router/router';
import { DonutChart } from '@/shared/components/charts/donut-chart';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatStrip } from '@/shared/components/dashboard/stat-strip';
import { EmptyState } from '@/shared/components/display/empty-state';
import { ErrorState } from '@/shared/components/display/error-state';
import { StatusBadge } from '@/shared/components/display/status-badge';
import { Tag } from '@/shared/components/display/tag';
import type { Tone } from '@/shared/components/display/tone';
import { cn } from '@/shared/lib/cn';
import { formatRelative } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

import { returnsQuery, useReturns, useSetReturnStatus } from '../api/finance-api';
import { CountTabs } from '../components/count-tabs';
import { ProductThumb } from '../components/store-badges';
import { formatMoney } from '../lib/money';
import { RETURN_TABS, type ReturnRequest, type ReturnTab } from '../model/finance';
import { ecommerceRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(returnsQuery('requested'));
    return null;
  };

const STATUS_TONE: Record<ReturnRequest['status'], Tone> = {
  requested: 'warning',
  approved: 'info',
  rejected: 'neutral',
  refunded: 'success',
};

function ReturnActions({ request }: { request: ReturnRequest }) {
  const { t, i18n } = useTranslation('ecommerce');
  const setStatus = useSetReturnStatus();
  const move = (status: ReturnRequest['status']) =>
    setStatus.mutateAsync({ id: request.id, status });

  if (request.status === 'rejected' || request.status === 'refunded') return null;
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="ghost"
        size="sm"
        disabled={setStatus.isPending}
        onClick={() => void move('rejected')}
      >
        <X /> {t('returns.reject')}
      </Button>
      {request.status === 'requested' ? (
        <Button size="sm" disabled={setStatus.isPending} onClick={() => void move('approved')}>
          <Check /> {t('returns.approve')}
        </Button>
      ) : (
        <ConfirmDialog
          trigger={
            <Button size="sm">
              <RotateCcw /> {t('returns.refund')}
            </Button>
          }
          title={t('returns.confirm.title', { number: request.number })}
          description={t('returns.confirm.description', {
            amount: formatMoney(request.amount, i18n.language),
            order: request.orderNumber,
          })}
          confirmLabel={t('returns.refund')}
          cancelLabel={t('common.cancel')}
          pending={setStatus.isPending}
          onConfirm={() => move('refunded')}
        />
      )}
    </div>
  );
}

function ReturnItem({ request }: { request: ReturnRequest }) {
  const { t, i18n } = useTranslation('ecommerce');
  return (
    <li className="flex flex-col gap-4 px-6 py-5 sm:flex-row">
      <ProductThumb hue={request.item.hue} />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="font-medium tabular-nums">{request.number}</p>
          <StatusBadge
            status={request.status}
            tone={STATUS_TONE[request.status]}
            label={t(`returns.status.${request.status}`)}
          />
          <span className="text-xs text-muted-foreground">{formatRelative(request.createdAt)}</span>
        </div>
        <p className="text-sm">
          {request.item.name}{' '}
          <span className="text-muted-foreground">
            · {request.item.variant} · ×{request.item.qty}
          </span>
        </p>
        <p className="text-xs text-muted-foreground">
          <Link
            to={ecommerceRoutes.customer.href({ customerId: request.customerId })}
            className="font-medium text-foreground hover:underline"
          >
            {request.customerName}
          </Link>{' '}
          ·{' '}
          <Link
            to={ecommerceRoutes.order.href({ orderId: request.orderId })}
            className="hover:underline"
          >
            {t('order.title', { number: request.orderNumber })}
          </Link>
        </p>
        <div className="flex flex-wrap items-start gap-2 text-sm">
          <Tag size="sm" tone="orange">
            {t(`refund.reasons.${request.reason}`)}
          </Tag>
          <q className="text-muted-foreground">{request.comment}</q>
        </div>
      </div>
      <div className="flex shrink-0 flex-row items-center justify-between gap-3 sm:flex-col sm:items-end">
        <p className="font-semibold tabular-nums">{formatMoney(request.amount, i18n.language)}</p>
        <ReturnActions request={request} />
      </div>
    </li>
  );
}

/** Return requests: triage queue with approve, reject and refund, plus reasons breakdown. */
export default function ReturnsPage() {
  const { t, i18n } = useTranslation('ecommerce');
  const [tab, setTab] = useState<ReturnTab>('requested');
  const returns = useReturns(tab);
  const data = returns.data;

  return (
    <Page width="full" title={t('returns.title')} description={t('returns.description')}>
      <div className="rounded-xl border bg-card px-6 py-2">
        <StatStrip
          items={[
            ...(['requested', 'approved', 'all'] as const).map((key) => ({
              key,
              label: t(`returns.stats.${key}`),
              value: data?.counts[key] ?? '–',
            })),
            {
              key: 'refunded',
              label: t('returns.stats.refunded'),
              value: data ? formatMoney(data.refunded, i18n.language, 0) : '–',
            },
          ]}
        />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          <CountTabs
            value={tab}
            onChange={setTab}
            tabs={RETURN_TABS.map((value) => ({
              value,
              label: t(`returns.tabs.${value}`),
              count: data?.counts[value],
            }))}
          />
          {returns.isError ? (
            <ErrorState title={t('common.error')} onRetry={() => void returns.refetch()} />
          ) : !data ? (
            <Skeleton className="h-96 rounded-xl" />
          ) : data.data.length ? (
            <ul
              aria-label={t('returns.title')}
              className={cn(
                'divide-y rounded-xl border bg-card',
                returns.isPlaceholderData && 'opacity-70',
              )}
            >
              {data.data.map((request) => (
                <ReturnItem key={request.id} request={request} />
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={PackageOpen}
              title={t('returns.empty.title')}
              description={t('returns.empty.description')}
            />
          )}
        </div>

        <SectionCard title={t('returns.reasons')} description={t('returns.reasonsHint')}>
          {data ? (
            <DonutChart
              data={data.reasons.map(({ reason, count }) => ({
                key: reason,
                label: t(`refund.reasons.${reason}`),
                value: count,
              }))}
              legend="bottom"
              centerValue={data.counts.all}
              centerLabel={t('returns.stats.all')}
              className="gap-4"
            />
          ) : (
            <Skeleton className="h-72" />
          )}
        </SectionCard>
      </div>
    </Page>
  );
}
