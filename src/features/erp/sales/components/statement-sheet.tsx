import { useTranslation } from '@/core/i18n/use-translation';
import { Link } from '@/core/router/router';
import { EmptyRow } from '@/features/erp/components/table-states';
import { BUCKET_COLOR } from '@/features/erp/lib/aging';
import { money, moneyCompact, shortDate } from '@/features/erp/lib/money';
import { AGING_BUCKETS } from '@/features/erp/model/erp';
import { erpRoutes } from '@/features/erp/routes';
import { MeterList } from '@/shared/components/dashboard/meter-list';
import { Callout } from '@/shared/components/display/callout';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/shared/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { customerAging, type CustomerBalance } from '../model/sales';

import { RemindButton } from './remind-button';

/** Open-item statement for one customer: balance by age, credit usage and invoices. */
export function StatementSheet({
  customer,
  onClose,
}: {
  customer: CustomerBalance | undefined;
  onClose: () => void;
}) {
  const { t } = useTranslation('erp', { keyPrefix: 'receivables' });
  const { t: tBucket } = useTranslation('erp', { keyPrefix: 'invoices.aging.buckets' });
  const aging = customer && customerAging(customer);

  return (
    <Sheet open={!!customer} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full gap-0 sm:max-w-lg">
        {customer && aging && (
          <>
            <SheetHeader>
              <SheetTitle>{t('statement.title', { name: customer.name })}</SheetTitle>
              <SheetDescription>
                <span className="font-mono">{customer.id}</span> · {customer.email}
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 space-y-6 overflow-y-auto px-4 pb-4">
              <div>
                <p className="text-xs text-muted-foreground">{t('statement.balance')}</p>
                <p className="text-3xl font-semibold tracking-tight tabular-nums">
                  {money(aging.total)}
                </p>
              </div>

              {aging.total > customer.creditLimit && (
                <Callout kind="warning">
                  {t('statement.overLimit', { limit: moneyCompact(customer.creditLimit) })}
                </Callout>
              )}

              <MeterList
                size="sm"
                items={[
                  {
                    key: 'credit',
                    label: t('statement.credit'),
                    value: aging.total,
                    max: customer.creditLimit,
                    display: `${moneyCompact(aging.total)} / ${moneyCompact(customer.creditLimit)}`,
                    color: 'var(--primary)',
                  },
                  ...AGING_BUCKETS.map((b) => ({
                    key: b,
                    label: tBucket(b),
                    value: aging.buckets[b],
                    max: aging.total,
                    display: money(aging.buckets[b]),
                    color: BUCKET_COLOR[b],
                  })),
                ]}
              />

              <section className="space-y-2">
                <h3 className="text-sm font-medium">{t('statement.invoices')}</h3>
                <Table aria-label={t('statement.invoices')}>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('columns.invoice')}</TableHead>
                      <TableHead>{t('columns.due')}</TableHead>
                      <TableHead className="text-right">{t('columns.balance')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customer.invoices.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell>
                          <Link
                            to={erpRoutes.invoice.href({ invoiceId: inv.id })}
                            className="font-mono text-xs font-medium hover:underline"
                          >
                            {inv.id}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground">{shortDate(inv.due)}</span>
                          {inv.daysOverdue > 0 && (
                            <p className="text-xs font-medium text-destructive">
                              {t('daysLate', { count: inv.daysOverdue })}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {money(inv.balance)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {customer.invoices.length === 0 && (
                      <EmptyRow colSpan={3}>{t('statement.empty')}</EmptyRow>
                    )}
                  </TableBody>
                </Table>
              </section>
            </div>
            <SheetFooter className="flex-row items-center justify-between border-t">
              <p className="text-xs text-muted-foreground">
                {customer.lastReminder
                  ? t('reminder.last', { date: shortDate(customer.lastReminder) })
                  : t('reminder.never')}
              </p>
              <RemindButton customer={customer} size="default" />
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
