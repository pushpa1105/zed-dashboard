import { AlertTriangle, Check, CircleAlert, MessageSquareWarning } from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { notify } from '@/core/notify/notify';
import { Link } from '@/core/router/router';
import { cn } from '@/shared/lib/cn';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Textarea } from '@/shared/ui/textarea';

import { useUpdateInvoice } from '../api/logistics-api';
import { fmtCurrency, fmtShortDate } from '../lib/format';
import { variance, type Invoice } from '../model/billing';
import { logisticsRoutes } from '../routes';

import { InvoiceStatusBadge } from './badges';

const VARIANCE_STYLE = {
  high: { icon: AlertTriangle, className: 'bg-destructive/10 text-destructive' },
  review: { icon: CircleAlert, className: 'bg-warning/15 text-foreground' },
  ok: { icon: Check, className: 'text-muted-foreground' },
} as const;

/** Variance against the quote, with an icon so it never relies on color alone. */
function VarianceBadge({ invoice }: { invoice: Invoice }) {
  const { t } = useTranslation('logistics');
  const { pct, level } = variance(invoice);
  const { icon: Icon, className } = VARIANCE_STYLE[level];
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1 rounded-md px-1.5 text-xs font-medium tabular-nums',
        className,
      )}
      title={t(`billing.variance.${level}`)}
    >
      <Icon className="size-3.5" aria-hidden />
      {pct > 0 ? '+' : ''}
      {pct.toFixed(1)}%<span className="sr-only">{t(`billing.variance.${level}`)}</span>
    </span>
  );
}

function DisputeDialog({ invoice, onClose }: { invoice: Invoice | null; onClose: () => void }) {
  const { t } = useTranslation('logistics');
  const [reason, setReason] = useState('');
  const update = useUpdateInvoice();
  const submit = () => {
    if (!invoice) return;
    update.mutate(
      { id: invoice.id, action: 'dispute', reason: reason.trim() },
      {
        onSuccess: () => {
          notify.success(t('billing.toast.dispute', { number: invoice.number }));
          setReason('');
          onClose();
        },
      },
    );
  };
  return (
    <Dialog open={invoice !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('billing.disputeTitle', { number: invoice?.number ?? '' })}</DialogTitle>
          <DialogDescription>{t('billing.disputeDescription')}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="dispute-reason">{t('billing.disputeReason')}</Label>
          <Textarea
            id="dispute-reason"
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('billing.disputePlaceholder')}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('actions.cancel')}
          </Button>
          <Button
            variant="destructive"
            disabled={update.isPending || reason.trim().length < 5}
            onClick={submit}
          >
            {t('billing.dispute')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function InvoiceTable({ invoices }: { invoices: Invoice[] }) {
  const { t, i18n } = useTranslation('logistics');
  const update = useUpdateInvoice();
  const [disputing, setDisputing] = useState<Invoice | null>(null);
  const money = (value: number) => fmtCurrency(value, i18n.language);
  const approve = (invoice: Invoice) =>
    update.mutate(
      { id: invoice.id, action: 'approve' },
      { onSuccess: () => notify.success(t('billing.toast.approve', { number: invoice.number })) },
    );

  return (
    <>
      <div className="overflow-x-auto">
        <Table aria-label={t('billing.invoices')}>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">{t('billing.columns.invoice')}</TableHead>
              <TableHead>{t('billing.columns.carrier')}</TableHead>
              <TableHead>{t('billing.columns.lane')}</TableHead>
              <TableHead className="text-right">{t('billing.columns.quoted')}</TableHead>
              <TableHead className="text-right">{t('billing.columns.invoiced')}</TableHead>
              <TableHead>{t('billing.columns.variance')}</TableHead>
              <TableHead>{t('billing.columns.status')}</TableHead>
              <TableHead className="pr-6 text-right">
                <span className="sr-only">{t('billing.columns.actions')}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className="pl-6">
                  <p className="font-mono text-xs font-semibold">{inv.number}</p>
                  <p className="text-xs text-muted-foreground">{fmtShortDate(inv.issuedAt)}</p>
                </TableCell>
                <TableCell className="whitespace-nowrap">{inv.carrier}</TableCell>
                <TableCell>
                  <p className="whitespace-nowrap">
                    {inv.origin} → {inv.destination}
                  </p>
                  <Link
                    to={logisticsRoutes.shipment.href({ shipmentId: inv.shipmentId })}
                    className="font-mono text-xs text-primary hover:underline"
                  >
                    {inv.shipmentId}
                  </Link>
                </TableCell>
                <TableCell className="text-right tabular-nums">{money(inv.quoted)}</TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {money(inv.invoiced)}
                </TableCell>
                <TableCell>
                  <VarianceBadge invoice={inv} />
                </TableCell>
                <TableCell className="max-w-52">
                  <InvoiceStatusBadge status={inv.status} />
                  {inv.disputeReason && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {inv.disputeReason}
                    </p>
                  )}
                </TableCell>
                <TableCell className="pr-6">
                  {inv.status !== 'approved' && (
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={update.isPending}
                        onClick={() => approve(inv)}
                        aria-label={t('billing.approveInvoice', { number: inv.number })}
                      >
                        <Check /> {t('billing.approve')}
                      </Button>
                      {inv.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDisputing(inv)}
                          aria-label={t('billing.disputeInvoice', { number: inv.number })}
                        >
                          <MessageSquareWarning /> {t('billing.dispute')}
                        </Button>
                      )}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <DisputeDialog invoice={disputing} onClose={() => setDisputing(null)} />
    </>
  );
}
