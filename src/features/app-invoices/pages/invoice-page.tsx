import { ArrowLeft, CheckCircle2, Download, FileText, Printer, Send } from 'lucide-react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { notify } from '@/core/notify/notify';
import { Link, useParams } from '@/core/router/router';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { ErrorState } from '@/shared/components/display/error-state';
import { StatusBadge } from '@/shared/components/display/status-badge';
import { Timeline } from '@/shared/components/display/timeline';
import { formatDate } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

import { invoiceQuery, useInvoice, useSetInvoiceStatus } from '../api/invoices-api';
import { InvoiceDocument } from '../components/invoice-document';
import { INVOICE_TONES, money, type Invoice } from '../model/invoice';
import { SELLER } from '../model/seller';
import { appInvoicesRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ params }) => {
    await queryClient.prefetchQuery(invoiceQuery(params.invoiceId!));
    return null;
  };

/** Only the invoice document is printed; the app shell and side panel are hidden. */
const PRINT_CSS = `
@media print {
  body * { visibility: hidden !important; }
  #invoice-document, #invoice-document * { visibility: visible !important; }
  #invoice-document { position: absolute; inset: 0 auto auto 0; width: 100%; color: #000; background: #fff; } /* theme-exempt: paper */
  @page { margin: 16mm; }
}`;

/** Downloads the invoice as a standalone HTML file (open it and print to PDF). */
function download(invoice: Invoice) {
  const lines = invoice.items
    .map(
      (l) =>
        `<tr><td>${l.description}</td><td style="text-align:right">${l.quantity}</td><td style="text-align:right">${money(l.unitPrice)}</td><td style="text-align:right">${money(l.quantity * l.unitPrice)}</td></tr>`,
    )
    .join('');
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${invoice.number}</title>
<style>/* theme-exempt: standalone print file */body{font:14px system-ui,sans-serif;margin:40px;color:#111}table{width:100%;border-collapse:collapse;margin-top:24px}td,th{padding:8px 0;border-bottom:1px solid #ddd;text-align:left}.r{text-align:right}</style></head>
<body><h1>Invoice ${invoice.number}</h1><p>${SELLER.name}<br>${SELLER.address.join('<br>')}</p>
<p><strong>Bill to:</strong> ${invoice.customer.name}<br>${invoice.customer.address}</p>
<p>Issued ${formatDate(invoice.issueDate, 'MMM D, YYYY')} · Due ${formatDate(invoice.dueDate, 'MMM D, YYYY')}</p>
<table><tr><th>Description</th><th class="r">Qty</th><th class="r">Unit price</th><th class="r">Amount</th></tr>${lines}</table>
<p class="r">Subtotal ${money(invoice.subtotal)}<br>Discount −${money(invoice.discountAmount)}<br>Tax (${invoice.taxRate}%) ${money(invoice.tax)}<br><strong>Total ${money(invoice.total)}</strong></p>
</body></html>`;
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${invoice.number}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function InvoicePage() {
  const { t } = useTranslation('app-invoices');
  const { invoiceId } = useParams();
  const invoice = useInvoice(invoiceId!);
  const setStatus = useSetInvoiceStatus();
  const data = invoice.data;

  const back = (
    <Button variant="ghost" asChild>
      <Link to={appInvoicesRoutes.index.href()}>
        <ArrowLeft /> {t('detail.back')}
      </Link>
    </Button>
  );

  if (invoice.isError) {
    return (
      <Page title={t('detail.notFound')} width="full" actions={back}>
        <ErrorState title={t('detail.notFound')} description={t('detail.notFoundHint')} />
      </Page>
    );
  }

  const events = data
    ? [
        {
          key: 'created',
          title: t('detail.events.created'),
          time: formatDate(data.issueDate, 'MMM D, YYYY'),
          icon: FileText,
        },
        ...(data.status !== 'draft'
          ? [
              {
                key: 'sent',
                tone: 'blue' as const,
                title: t('detail.events.sent', { email: data.customer.email }),
                time: formatDate(data.issueDate + 3_600_000, 'MMM D, YYYY'),
                icon: Send,
              },
            ]
          : []),
        ...(data.paidAt
          ? [
              {
                key: 'paid',
                tone: 'success' as const,
                title: t('detail.events.paid', { amount: money(data.total) }),
                time: formatDate(data.paidAt, 'MMM D, YYYY'),
                icon: CheckCircle2,
              },
            ]
          : []),
      ]
    : [];

  const run = (status: 'sent' | 'paid') =>
    setStatus.mutate(
      { id: data!.id, status },
      {
        onSuccess: (inv) =>
          notify.success(
            status === 'paid'
              ? t('toast.paid', { number: inv.number })
              : t('toast.sent', { number: inv.number }),
          ),
      },
    );

  return (
    <Page
      title={data ? data.number : t('detail.loading')}
      description={data?.customer.name}
      width="full"
      actions={back}
    >
      <style>{PRINT_CSS}</style>
      {!data ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
          <Skeleton className="h-[40rem] rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      ) : (
        <div className="grid items-start gap-6 xl:grid-cols-[1fr_20rem]">
          <InvoiceDocument invoice={data} />
          <aside className="space-y-4 xl:sticky xl:top-20 print:hidden">
            <SectionCard
              title={t('detail.status')}
              action={
                <StatusBadge
                  status={data.status}
                  tone={INVOICE_TONES[data.status]}
                  label={t(`status.${data.status}`)}
                />
              }
            >
              <p className="text-3xl font-semibold tracking-tight tabular-nums">
                {money(data.total)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {data.status === 'paid'
                  ? t('detail.paidOn', {
                      date: formatDate(data.paidAt ?? data.dueDate, 'MMM D, YYYY'),
                    })
                  : t('detail.dueOn', { date: formatDate(data.dueDate, 'MMM D, YYYY') })}
              </p>
              <div className="mt-5 grid gap-2">
                {data.status === 'draft' && (
                  <Button onClick={() => run('sent')} disabled={setStatus.isPending}>
                    <Send /> {t('detail.send')}
                  </Button>
                )}
                {(data.status === 'sent' || data.status === 'overdue') && (
                  <Button onClick={() => run('paid')} disabled={setStatus.isPending}>
                    <CheckCircle2 /> {t('detail.markPaid')}
                  </Button>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => download(data)}>
                    <Download /> {t('detail.download')}
                  </Button>
                  <Button variant="outline" onClick={() => window.print()}>
                    <Printer /> {t('detail.print')}
                  </Button>
                </div>
              </div>
            </SectionCard>
            <SectionCard title={t('detail.activity')}>
              <Timeline items={events} />
            </SectionCard>
          </aside>
        </div>
      )}
    </Page>
  );
}
