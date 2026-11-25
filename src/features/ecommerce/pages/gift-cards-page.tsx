import { CreditCard, Gift, Plus, ShoppingBag, Wallet } from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { BarChart } from '@/shared/components/charts/bar-chart';
import { DonutChart } from '@/shared/components/charts/donut-chart';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { EmptyState } from '@/shared/components/display/empty-state';
import { ErrorState } from '@/shared/components/display/error-state';
import { SearchInput } from '@/shared/components/forms/search-input';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { formatDate } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { TableCell, TableRow } from '@/shared/ui/table';

import { giftCardsQuery, useGiftCards } from '../api/marketing-api';
import { CountTabs } from '../components/count-tabs';
import { BalanceMeter, GiftCardSheet, GiftCardStatusBadge } from '../components/gift-card-sheet';
import { IssueGiftCardDialog } from '../components/issue-gift-card-dialog';
import { ListTable } from '../components/list-table';
import { StatCards } from '../components/stat-cards';
import { formatMoney } from '../lib/money';
import {
  GIFT_CARD_STATUSES,
  GIFT_CARD_TABS,
  type GiftCard,
  type GiftCardTab,
} from '../model/marketing';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(giftCardsQuery('all', ''));
    return null;
  };

const STATS = [
  { key: 'outstanding', icon: Wallet, color: 'var(--chart-1)' },
  { key: 'issued', icon: Gift, color: 'var(--chart-2)' },
  { key: 'redeemed', icon: ShoppingBag, color: 'var(--chart-3)' },
  { key: 'active', icon: CreditCard, color: 'var(--chart-4)' },
] as const;
const COLUMNS = [
  { key: 'code', className: 'pl-6' },
  { key: 'recipient' },
  { key: 'balance', className: 'text-right' },
  { key: 'status' },
  { key: 'issued', className: 'hidden md:table-cell' },
  { key: 'expires', className: 'hidden pr-6 lg:table-cell' },
] as const;

function GiftCardRow({ card, onOpen }: { card: GiftCard; onOpen: () => void }) {
  const { t, i18n } = useTranslation('ecommerce');
  return (
    <TableRow className="cursor-pointer" onClick={onOpen}>
      <TableCell className="pl-6">
        <button type="button" className="font-mono font-medium tracking-wide hover:underline">
          •••• {card.code.slice(-4)}
        </button>
      </TableCell>
      <TableCell>
        <p className="font-medium">{card.recipientName}</p>
        <p className="truncate text-xs text-muted-foreground">{card.recipientEmail}</p>
      </TableCell>
      <TableCell className="w-40">
        <p className="text-right font-medium tabular-nums">
          {formatMoney(card.balance, i18n.language)}
        </p>
        <BalanceMeter card={card} />
      </TableCell>
      <TableCell>
        <GiftCardStatusBadge status={card.status} />
      </TableCell>
      <TableCell className="hidden text-muted-foreground tabular-nums md:table-cell">
        {formatDate(card.issuedAt, 'MMM D, YYYY')}
      </TableCell>
      <TableCell className="hidden pr-6 text-muted-foreground tabular-nums lg:table-cell">
        {card.expiresAt ? formatDate(card.expiresAt, 'MMM D, YYYY') : t('giftCards.never')}
      </TableCell>
    </TableRow>
  );
}

/** Issued gift cards with balances, issue/redeem trends and a detail sheet per card. */
export default function GiftCardsPage() {
  const { t, i18n } = useTranslation('ecommerce');
  const [tab, setTab] = useState<GiftCardTab>('all');
  const [q, setQ] = useState('');
  const [issuing, setIssuing] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const cards = useGiftCards(tab, useDebounce(q, 250));
  const data = cards.data;
  const money = (n: number) => formatMoney(n, i18n.language, 0);

  return (
    <Page
      width="full"
      title={t('giftCards.title')}
      description={t('giftCards.description')}
      actions={
        <Button onClick={() => setIssuing(true)}>
          <Plus /> {t('giftCards.new')}
        </Button>
      }
    >
      <StatCards
        loading={!data}
        items={STATS.map(({ key, icon, color }) => ({
          key,
          icon,
          color,
          label: t(`giftCards.stats.${key}`),
          value: data && (key === 'active' ? data.summary.active : money(data.summary[key])),
        }))}
      />

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <SectionCard
          className="min-w-0 lg:col-span-2"
          title={t('giftCards.chart.title')}
          description={t('giftCards.chart.description')}
        >
          {data ? (
            <BarChart
              data={data.monthly.map((m) => ({ ...m, label: formatDate(m.month, 'MMM') }))}
              xKey="label"
              series={[
                { key: 'issued', label: t('giftCards.chart.issued'), color: 'var(--chart-1)' },
                { key: 'redeemed', label: t('giftCards.chart.redeemed'), color: 'var(--chart-2)' },
              ]}
              valueFormatter={money}
              legend
              className="h-64"
            />
          ) : (
            <Skeleton className="h-64" />
          )}
        </SectionCard>
        <SectionCard title={t('giftCards.mix')} description={t('giftCards.mixHint')}>
          {data ? (
            <DonutChart
              data={GIFT_CARD_STATUSES.map((status) => ({
                key: status,
                label: t(`giftCards.status.${status}`),
                value: data.counts[status],
              }))}
              legend="bottom"
              centerValue={data.counts.all}
              centerLabel={t('giftCards.tabs.all')}
              className="gap-4"
            />
          ) : (
            <Skeleton className="h-64" />
          )}
        </SectionCard>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-end sm:justify-between">
          <CountTabs
            value={tab}
            onChange={setTab}
            tabs={GIFT_CARD_TABS.map((value) => ({
              value,
              label: t(`giftCards.tabs.${value}`),
              count: data?.counts[value],
            }))}
          />
          <SearchInput
            value={q}
            onChange={setQ}
            placeholder={t('giftCards.search')}
            aria-label={t('giftCards.search')}
            containerClassName="sm:w-72"
          />
        </div>
        {cards.isError ? (
          <ErrorState title={t('common.error')} onRetry={() => void cards.refetch()} />
        ) : (
          <ListTable
            label={t('giftCards.title')}
            faded={cards.isPlaceholderData}
            columns={COLUMNS.map((col) => ({ ...col, label: t(`giftCards.col.${col.key}`) }))}
            rows={data?.data.map((card) => (
              <GiftCardRow key={card.id} card={card} onOpen={() => setOpenId(card.id)} />
            ))}
            empty={
              data?.data.length === 0 && (
                <EmptyState
                  variant="plain"
                  icon={Gift}
                  title={t('giftCards.empty.title')}
                  description={t('giftCards.empty.description')}
                  className="py-12"
                />
              )
            }
          />
        )}
      </div>

      <IssueGiftCardDialog open={issuing} onOpenChange={setIssuing} />
      <GiftCardSheet id={openId} onClose={() => setOpenId(null)} />
    </Page>
  );
}
