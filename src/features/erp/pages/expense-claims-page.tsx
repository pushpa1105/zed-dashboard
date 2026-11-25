import { CircleCheck, Hourglass, Paperclip, ReceiptText, type LucideIcon } from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { DonutChart } from '@/shared/components/charts/donut-chart';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatCard } from '@/shared/components/dashboard/stat-card';
import { StatusBadge } from '@/shared/components/display/status-badge';
import { cn } from '@/shared/lib/cn';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { ErrorPanel } from '../components/error-panel';
import { money, moneyCompact, shortDate } from '../lib/money';
import { expenseClaimsQuery, useExpenseClaims } from '../operations/api/operations-api';
import { ClaimSheet } from '../operations/components/claim-sheet';
import { StatusTabs } from '../operations/components/status-tabs';
import {
  CLAIM_CATEGORIES,
  CLAIM_STATUSES,
  type ClaimStatus,
  type ExpenseClaim,
} from '../operations/model/operations';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(expenseClaimsQuery());
    return null;
  };

type Filter = 'all' | ClaimStatus;
const total = (claims: ExpenseClaim[]) => claims.reduce((s, c) => s + c.amount, 0);

/** Employee expense claims: spend by category, the review queue and a detail sheet. */
export default function ExpenseClaimsPage() {
  const { t } = useTranslation('erp', { keyPrefix: 'expenses' });
  const claims = useExpenseClaims();
  const [filter, setFilter] = useState<Filter>('pending');
  const [openId, setOpenId] = useState<string>();
  const all = claims.data ?? [];
  const byStatus = (status: ClaimStatus) => all.filter((c) => c.status === status);
  const visible = filter === 'all' ? all : byStatus(filter);
  const spend = all.filter((c) => c.status !== 'rejected');
  const breakdown = CLAIM_CATEGORIES.map((category) => ({
    key: category,
    label: t(`categories.${category}`),
    value: total(spend.filter((c) => c.category === category)),
  })).filter((slice) => slice.value > 0);

  const statusKpi = (status: 'pending' | 'approved', icon: LucideIcon, color: string) => ({
    key: status,
    icon,
    color,
    value: moneyCompact(total(byStatus(status))),
    hint: t('kpis.claims', { count: byStatus(status).length }),
  });
  const kpis = [
    statusKpi('pending', Hourglass, 'var(--warning)'),
    statusKpi('approved', CircleCheck, 'var(--success)'),
    {
      key: 'missing' as const,
      icon: Paperclip,
      color: 'var(--destructive)',
      value: String(byStatus('pending').filter((c) => c.receipts === 0).length),
      hint: t('kpis.missingHint'),
    },
  ];

  if (claims.isError) {
    return (
      <Page title={t('title')} width="full">
        <ErrorPanel onRetry={() => void claims.refetch()} />
      </Page>
    );
  }

  return (
    <Page title={t('title')} description={t('description')} width="full">
      <div className="grid gap-6 xl:grid-cols-[1fr_26rem]">
        <div className="grid content-start gap-4 sm:grid-cols-3 xl:grid-cols-1">
          {kpis.map((kpi) => (
            <StatCard
              key={kpi.key}
              variant="tile"
              icon={kpi.icon}
              color={kpi.color}
              label={t(`kpis.${kpi.key}`)}
              value={kpi.value}
              hint={kpi.hint}
              loading={!claims.data}
            />
          ))}
        </div>
        <SectionCard title={t('breakdown.title')} description={t('breakdown.description')}>
          {claims.data ? (
            <DonutChart
              data={breakdown}
              valueFormatter={moneyCompact}
              centerLabel={t('breakdown.total')}
            />
          ) : (
            <Skeleton className="h-56 w-full" />
          )}
        </SectionCard>
      </div>

      <SectionCard
        flush
        title={t('list.title')}
        action={
          <StatusTabs
            label={t('list.filter')}
            value={filter}
            onChange={setFilter}
            tabs={[
              ...CLAIM_STATUSES.map((s) => ({
                value: s,
                label: t(`status.${s}`),
                count: byStatus(s).length,
              })),
              { value: 'all' as const, label: t('status.all') },
            ]}
          />
        }
      >
        {!claims.data ? (
          <div className="space-y-2 px-6 pb-6">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        ) : (
          <div className="border-t">
            <Table aria-label={t('list.title')}>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">{t('columns.employee')}</TableHead>
                  <TableHead>{t('columns.claim')}</TableHead>
                  <TableHead className="hidden md:table-cell">{t('columns.submitted')}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t('columns.receipts')}</TableHead>
                  <TableHead>{t('columns.status')}</TableHead>
                  <TableHead className="pr-6 text-right">{t('columns.amount')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((c) => (
                  <TableRow key={c.id} className="cursor-pointer" onClick={() => setOpenId(c.id)}>
                    <TableCell className="pl-6">
                      <p className="font-medium">{c.employee}</p>
                      <p className="text-xs text-muted-foreground">{c.department}</p>
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        className="text-left font-medium hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenId(c.id);
                        }}
                      >
                        {c.description}
                      </button>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-mono">{c.id}</span> · {t(`categories.${c.category}`)}
                      </p>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {shortDate(c.submitted)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 text-xs',
                          c.receipts ? 'text-muted-foreground' : 'font-medium text-destructive',
                        )}
                      >
                        <ReceiptText className="size-3.5" />
                        {c.receipts ? c.receipts : t('receipts.none')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={c.status} label={t(`status.${c.status}`)} />
                    </TableCell>
                    <TableCell className="pr-6 text-right font-medium tabular-nums">
                      {money(c.amount)}
                    </TableCell>
                  </TableRow>
                ))}
                {visible.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                      {t('list.empty')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      <ClaimSheet claim={all.find((c) => c.id === openId)} onClose={() => setOpenId(undefined)} />
    </Page>
  );
}
