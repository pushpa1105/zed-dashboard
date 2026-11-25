import { useTranslation } from '@/core/i18n/use-translation';
import { formatDate } from '@/shared/lib/format';

import { money, type Invoice } from '../model/invoice';
import { SELLER } from '../model/seller';

/**
 * The invoice as a document. It is the only thing printed (see the print
 * rules in the detail page), so keep it self-contained and paper-friendly.
 */
export function InvoiceDocument({ invoice }: { invoice: Invoice }) {
  const { t } = useTranslation('app-invoices');
  const date = (ts: number) => formatDate(ts, 'MMM D, YYYY');

  return (
    <article
      id="invoice-document"
      className="mx-auto w-full max-w-[52rem] rounded-xl border bg-card p-6 text-sm text-card-foreground shadow-sm sm:p-10 print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none"
    >
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span
              // theme-exempt: paper is always black on white
              className="flex size-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground print:border print:border-black print:bg-transparent print:text-black"
            >
              O
            </span>
            <span className="text-base font-semibold">{SELLER.name}</span>
          </div>
          <address className="text-muted-foreground not-italic">
            {SELLER.address.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
            <span className="block">{SELLER.email}</span>
            <span className="block">
              {t('document.taxId')} {SELLER.taxId}
            </span>
          </address>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold tracking-tight">{t('document.invoice')}</p>
          <p className="font-mono text-muted-foreground">{invoice.number}</p>
        </div>
      </header>

      <div className="mt-10 grid gap-6 sm:grid-cols-[1fr_auto]">
        <div>
          <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            {t('document.billTo')}
          </p>
          <p className="mt-2 font-medium">{invoice.customer.name}</p>
          <p className="text-muted-foreground">{invoice.customer.address}</p>
          <p className="text-muted-foreground">{invoice.customer.email}</p>
          <p className="text-muted-foreground">
            {t('document.taxId')} {invoice.customer.taxId}
          </p>
        </div>
        <dl className="grid grid-cols-[auto_auto] gap-x-6 gap-y-1.5 self-start">
          <dt className="text-muted-foreground">{t('document.issued')}</dt>
          <dd className="text-right tabular-nums">{date(invoice.issueDate)}</dd>
          <dt className="text-muted-foreground">{t('document.due')}</dt>
          <dd className="text-right tabular-nums">{date(invoice.dueDate)}</dd>
          {invoice.paidAt && (
            <>
              <dt className="text-muted-foreground">{t('document.paid')}</dt>
              <dd className="text-right tabular-nums">{date(invoice.paidAt)}</dd>
            </>
          )}
        </dl>
      </div>

      <table className="mt-10 w-full">
        <thead>
          <tr className="border-b text-xs text-muted-foreground">
            <th className="py-2.5 text-left font-medium">{t('editor.description')}</th>
            <th className="w-16 py-2.5 text-right font-medium">{t('document.qty')}</th>
            <th className="w-28 py-2.5 text-right font-medium">{t('editor.unitPrice')}</th>
            <th className="w-28 py-2.5 text-right font-medium">{t('editor.lineTotal')}</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((line, i) => (
            <tr key={i} className="border-b last:border-b-0">
              <td className="py-3 pr-4">{line.description}</td>
              <td className="py-3 text-right tabular-nums">{line.quantity}</td>
              <td className="py-3 text-right tabular-nums">{money(line.unitPrice)}</td>
              <td className="py-3 text-right font-medium tabular-nums">
                {money(line.quantity * line.unitPrice)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 flex justify-end border-t pt-6">
        <dl className="grid w-full max-w-72 grid-cols-2 gap-y-2">
          <dt className="text-muted-foreground">{t('totals.subtotal')}</dt>
          <dd className="text-right tabular-nums">{money(invoice.subtotal)}</dd>
          {invoice.discountAmount > 0 && (
            <>
              <dt className="text-muted-foreground">{t('totals.discount')}</dt>
              <dd className="text-right tabular-nums">−{money(invoice.discountAmount)}</dd>
            </>
          )}
          <dt className="text-muted-foreground">{t('totals.tax', { rate: invoice.taxRate })}</dt>
          <dd className="text-right tabular-nums">{money(invoice.tax)}</dd>
          <dt className="mt-2 border-t pt-3 font-medium">{t('totals.totalDue')}</dt>
          <dd className="mt-2 border-t pt-3 text-right text-lg font-semibold tabular-nums">
            {money(invoice.total)}
          </dd>
        </dl>
      </div>

      <footer className="mt-10 grid gap-6 border-t pt-6 text-xs text-muted-foreground sm:grid-cols-2">
        <div>
          <p className="mb-1 font-medium text-foreground">{t('document.payment')}</p>
          <p>{t('document.bankTransfer')}</p>
          <p className="font-mono">{SELLER.iban}</p>
          <p>
            {t('document.reference')} {invoice.number}
          </p>
        </div>
        {invoice.notes && (
          <div>
            <p className="mb-1 font-medium text-foreground">{t('editor.notes')}</p>
            <p>{invoice.notes}</p>
          </div>
        )}
      </footer>
    </article>
  );
}
