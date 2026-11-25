import { ArrowLeft, BellRing, Building2, HandCoins, Printer } from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { notify } from '@/core/notify/notify';
import { Link, useParams } from '@/core/router/router';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatusBadge } from '@/shared/components/display/status-badge';
import { Timeline } from '@/shared/components/display/timeline';
import { NumberInput } from '@/shared/components/forms/number-input';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Label } from '@/shared/ui/label';
import { Progress } from '@/shared/ui/progress';
import { Skeleton } from '@/shared/ui/skeleton';

import { invoiceQuery, useInvoice, useInvoiceAction } from '../api/erp-api';
import { ErrorPanel } from '../components/error-panel';
import { money, shortDate } from '../lib/money';
import { erpRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ params }) => {
    await queryClient.prefetchQuery(invoiceQuery(params.invoiceId!));
    return null;
  };

const TAX_RATE = 0.0825;

/** Invoice as a printable document, with balance, actions and its activity history. */
export default function InvoicePage() {
  const { t } = useTranslation('erp', { keyPrefix: 'invoice' });
  const { invoiceId = '' } = useParams();
  const invoice = useInvoice(invoiceId);
  const action = useInvoiceAction();
  const [paying, setPaying] = useState(false);
  const [amount, setAmount] = useState<number | null>(null);
  const inv = invoice.data;

  if (invoice.isError) {
    return (
      <Page title={invoiceId} width="full">
        <ErrorPanel onRetry={() => void invoice.refetch()} />
      </Page>
    );
  }

  const subtotal = inv ? inv.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0) : 0;
  const balance = inv ? inv.amount - inv.paid : 0;
  const run = (kind: 'remind' | 'payment', value?: number) =>
    action.mutate(
      { id: invoiceId, action: kind, amount: value },
      {
        onSuccess: (updated) => {
          invoice.refetch();
          notify.success(
            kind === 'remind' ? t('reminded', { email: updated.email }) : t('paymentRecorded'),
          );
          setPaying(false);
        },
      },
    );

  return (
    <Page
      title={inv ? t('title', { id: inv.id }) : invoiceId}
      description={inv ? inv.customer : undefined}
      width="full"
      actions={
        <>
          <Button variant="ghost" asChild>
            <Link to={erpRoutes.invoices.href()}>
              <ArrowLeft /> {t('back')}
            </Link>
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer /> {t('print')}
          </Button>
        </>
      }
    >
      <div className="grid items-start gap-6 xl:grid-cols-[1fr_22rem]">
        <SectionCard className="p-2 md:p-6">
          {!inv ? (
            <Skeleton className="h-[32rem] w-full" />
          ) : (
            <article className="space-y-8">
              <header className="flex flex-wrap items-start justify-between gap-6">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <Building2 className="size-5" />
                  </span>
                  <div>
                    <p className="font-semibold">Orbitly Supply Co.</p>
                    <p className="text-xs text-muted-foreground">
                      1180 Kietzke Lane, Reno NV 89502 · billing@orbitly.co
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs tracking-wider text-muted-foreground uppercase">
                    {t('invoice')}
                  </p>
                  <p className="font-mono text-lg font-semibold">{inv.id}</p>
                  <StatusBadge status={inv.status} label={t(`status.${inv.status}`)} />
                </div>
              </header>

              <dl className="grid gap-6 border-y py-6 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-xs text-muted-foreground">{t('billTo')}</dt>
                  <dd className="mt-1 font-medium">{inv.customer}</dd>
                  <dd className="text-muted-foreground">{inv.email}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">{t('issued')}</dt>
                  <dd className="mt-1 font-medium">{shortDate(inv.issued)}</dd>
                  <dd className="text-muted-foreground">{inv.terms}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">{t('due')}</dt>
                  <dd className="mt-1 font-medium">{shortDate(inv.due)}</dd>
                  {inv.status === 'overdue' && (
                    <dd className="text-destructive">
                      {t('daysLate', { count: inv.daysOverdue })}
                    </dd>
                  )}
                </div>
              </dl>

              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="pb-3 text-left font-medium">{t('item')}</th>
                    <th className="w-16 pb-3 text-right font-medium">{t('qty')}</th>
                    <th className="w-32 pb-3 text-right font-medium">{t('price')}</th>
                    <th className="w-32 pb-3 text-right font-medium">{t('lineTotal')}</th>
                  </tr>
                </thead>
                <tbody>
                  {inv.lines.map((line, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-3">{line.description}</td>
                      <td className="py-3 text-right tabular-nums">{line.quantity}</td>
                      <td className="py-3 text-right tabular-nums">{money(line.unitPrice)}</td>
                      <td className="py-3 text-right tabular-nums">
                        {money(line.quantity * line.unitPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <dl className="ml-auto w-full max-w-xs space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t('subtotal')}</dt>
                  <dd className="tabular-nums">{money(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">
                    {t('tax', { rate: (TAX_RATE * 100).toFixed(2) })}
                  </dt>
                  <dd className="tabular-nums">{money(inv.amount - subtotal)}</dd>
                </div>
                <div className="flex justify-between border-t pt-2 text-base font-semibold">
                  <dt>{t('total')}</dt>
                  <dd className="tabular-nums">{money(inv.amount)}</dd>
                </div>
                {inv.paid > 0 && (
                  <div className="flex justify-between text-success">
                    <dt>{t('paid')}</dt>
                    <dd className="tabular-nums">−{money(inv.paid)}</dd>
                  </div>
                )}
              </dl>

              <p className="border-t pt-6 text-xs text-muted-foreground">{t('footer')}</p>
            </article>
          )}
        </SectionCard>

        <div className="space-y-6 xl:sticky xl:top-24">
          <SectionCard title={t('balanceDue')}>
            {!inv ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <div className="space-y-4">
                <p className="text-3xl font-semibold tracking-tight tabular-nums">
                  {money(balance)}
                </p>
                <div className="space-y-1.5">
                  <Progress value={(inv.paid / inv.amount) * 100} />
                  <p className="text-xs text-muted-foreground">
                    {t('paidOf', { paid: money(inv.paid), total: money(inv.amount) })}
                  </p>
                </div>
                <div className="grid gap-2">
                  <Button
                    disabled={balance <= 0 || inv.status === 'draft' || action.isPending}
                    onClick={() => {
                      setAmount(balance);
                      setPaying(true);
                    }}
                  >
                    <HandCoins /> {t('recordPayment')}
                  </Button>
                  <Button
                    variant="outline"
                    disabled={balance <= 0 || inv.status === 'draft' || action.isPending}
                    onClick={() => run('remind')}
                  >
                    <BellRing /> {t('sendReminder')}
                  </Button>
                </div>
              </div>
            )}
          </SectionCard>
          <SectionCard title={t('activity')}>
            {inv ? (
              <Timeline
                items={[...inv.events].reverse().map((event, i) => ({
                  key: `${event.at}-${i}`,
                  title: event.label,
                  time: shortDate(event.at),
                }))}
              />
            ) : (
              <Skeleton className="h-40 w-full" />
            )}
          </SectionCard>
        </div>
      </div>

      <Dialog open={paying} onOpenChange={setPaying}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('recordPayment')}</DialogTitle>
            <DialogDescription>{t('paymentHint', { balance: money(balance) })}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="payment-amount">{t('amount')}</Label>
            <NumberInput
              id="payment-amount"
              value={amount}
              onChange={setAmount}
              min={0.01}
              max={balance}
              precision={2}
              format="currency"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaying(false)}>
              {t('cancel')}
            </Button>
            <Button
              disabled={!amount || action.isPending}
              onClick={() => run('payment', amount ?? 0)}
            >
              {t('confirmPayment')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Page>
  );
}
