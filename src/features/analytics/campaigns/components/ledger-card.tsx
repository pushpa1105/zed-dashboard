import { useTranslation } from '@/core/i18n/use-translation';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { cn } from '@/shared/lib/cn';
import { Badge } from '@/shared/ui/badge';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';

import { money, shortDate } from '../lib/format';
import type { LedgerRow, MarketingOverview, PayoutRow } from '../model/marketing';

const STATUS_CLASS: Record<PayoutRow['status'], string> = {
  paid: 'bg-success/10 text-success',
  pending: 'bg-warning/15 text-warning-foreground dark:text-warning',
  failed: 'bg-destructive/10 text-destructive',
};

function LedgerTable({
  rows,
  sign,
  withStatus,
}: {
  rows: Array<LedgerRow | PayoutRow>;
  sign: 1 | -1;
  withStatus?: boolean;
}) {
  const { t } = useTranslation('analytics', { keyPrefix: 'campaigns' });
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="pl-5">{t('ledger.columns.id')}</TableHead>
          <TableHead>{t('ledger.columns.type')}</TableHead>
          <TableHead className="hidden sm:table-cell">{t('ledger.columns.date')}</TableHead>
          {withStatus && <TableHead>{t('ledger.columns.status')}</TableHead>}
          <TableHead className="pr-5 text-right">{t('ledger.columns.amount')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="pl-5 font-mono text-xs text-muted-foreground">{row.id}</TableCell>
            <TableCell className="font-medium">{row.type}</TableCell>
            <TableCell className="hidden text-muted-foreground tabular-nums sm:table-cell">
              {shortDate(row.date)}
            </TableCell>
            {withStatus && 'status' in row && (
              <TableCell>
                <Badge variant="secondary" className={cn('border-0', STATUS_CLASS[row.status])}>
                  {t(`ledger.status.${row.status}`)}
                </Badge>
              </TableCell>
            )}
            <TableCell
              className={cn(
                'pr-5 text-right font-medium tabular-nums',
                sign < 0 && 'text-muted-foreground',
              )}
            >
              {sign < 0 ? '−' : ''}
              {money(row.amount)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function LedgerCard({ data }: { data?: MarketingOverview }) {
  const { t } = useTranslation('analytics', { keyPrefix: 'campaigns' });
  const net = data
    ? data.earnings.reduce((s, r) => s + r.amount, 0) -
      data.expenses.reduce((s, r) => s + r.amount, 0)
    : 0;

  return (
    <SectionCard
      title={t('ledger.title')}
      description={t('ledger.description')}
      className="lg:col-span-7"
      flush
      action={
        data && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">{t('ledger.net')}</p>
            <p className="font-semibold tabular-nums">{money(net, 0)}</p>
          </div>
        )
      }
    >
      {data ? (
        <Tabs defaultValue="earnings" className="gap-0">
          <div className="border-b px-5">
            <TabsList variant="line">
              <TabsTrigger value="earnings">{t('ledger.tabs.earnings')}</TabsTrigger>
              <TabsTrigger value="expenses">{t('ledger.tabs.expenses')}</TabsTrigger>
              <TabsTrigger value="payouts">{t('ledger.tabs.payouts')}</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="earnings">
            <LedgerTable rows={data.earnings} sign={1} />
          </TabsContent>
          <TabsContent value="expenses">
            <LedgerTable rows={data.expenses} sign={-1} />
          </TabsContent>
          <TabsContent value="payouts">
            <LedgerTable rows={data.payouts} sign={1} withStatus />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="space-y-2 px-5 pb-5">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      )}
    </SectionCard>
  );
}
