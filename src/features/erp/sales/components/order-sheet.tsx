import { FileText } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Link } from '@/core/router/router';
import { money, shortDate } from '@/features/erp/lib/money';
import { erpRoutes } from '@/features/erp/routes';
import { Timeline } from '@/shared/components/display/timeline';
import { Button } from '@/shared/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/shared/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { lineTotal, NEXT_ACTION, soTotals, type SalesOrder } from '../model/sales';

import { OrderActionButton, OrderStatusBadge } from './order-status';

/** Sales order detail: header fields, priced lines, totals and history. */
export function OrderSheet({
  order,
  onClose,
}: {
  order: SalesOrder | undefined;
  onClose: () => void;
}) {
  const { t } = useTranslation('erp', { keyPrefix: 'salesOrders' });
  const totals = order && soTotals(order);

  return (
    <Sheet open={!!order} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full gap-0 sm:max-w-xl">
        {order && totals && (
          <>
            <SheetHeader>
              <SheetTitle>{t('detail.title', { id: order.id })}</SheetTitle>
              <SheetDescription>
                {order.customer} · {order.email}
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 space-y-6 overflow-y-auto px-4 pb-4">
              <div className="flex items-center justify-between">
                <p className="text-3xl font-semibold tracking-tight tabular-nums">
                  {money(totals.total)}
                </p>
                <OrderStatusBadge status={order.status} />
              </div>
              <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                {(
                  [
                    ['rep', order.rep],
                    ['created', shortDate(order.created)],
                    ['delivery', shortDate(order.delivery)],
                  ] as const
                ).map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-xs text-muted-foreground">{t(`fields.${key}`)}</dt>
                    <dd className="mt-1 font-medium">{value}</dd>
                  </div>
                ))}
              </dl>

              <Table aria-label={t('detail.lines')}>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('detail.item')}</TableHead>
                    <TableHead className="text-right">{t('detail.qty')}</TableHead>
                    <TableHead className="hidden text-right sm:table-cell">
                      {t('detail.price')}
                    </TableHead>
                    <TableHead className="text-right">{t('detail.amount')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.lines.map((line, i) => (
                    <TableRow key={i}>
                      <TableCell className="whitespace-normal">
                        {line.description}
                        {line.discount > 0 && (
                          <p className="text-xs text-success">
                            {t('detail.discount', { pct: line.discount * 100 })}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{line.quantity}</TableCell>
                      <TableCell className="hidden text-right tabular-nums sm:table-cell">
                        {money(line.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {money(lineTotal(line))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <dl className="ml-auto w-full max-w-60 space-y-1 text-sm">
                {(['subtotal', 'tax', 'total'] as const).map((key) => (
                  <div
                    key={key}
                    className="flex justify-between last:border-t last:pt-1 last:font-semibold"
                  >
                    <dt className="text-muted-foreground">{t(`detail.${key}`)}</dt>
                    <dd className="tabular-nums">{money(totals[key])}</dd>
                  </div>
                ))}
              </dl>

              <section className="space-y-3">
                <h3 className="text-sm font-medium">{t('detail.history')}</h3>
                <Timeline
                  items={[...order.events].reverse().map((event, i) => ({
                    key: `${event.at}-${i}`,
                    title: event.label,
                    time: shortDate(event.at),
                  }))}
                />
              </section>
            </div>
            {(order.invoiceId || NEXT_ACTION[order.status]) && (
              <SheetFooter className="flex-row justify-end border-t">
                {order.invoiceId ? (
                  <Button variant="outline" asChild>
                    <Link to={erpRoutes.invoice.href({ invoiceId: order.invoiceId })}>
                      <FileText /> {t('detail.openInvoice', { id: order.invoiceId })}
                    </Link>
                  </Button>
                ) : (
                  <OrderActionButton order={order} size="default" />
                )}
              </SheetFooter>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
