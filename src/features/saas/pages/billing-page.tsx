import { Check, Download, Wifi } from 'lucide-react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { MeterList } from '@/shared/components/dashboard/meter-list';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { ErrorState } from '@/shared/components/display/error-state';
import { Tag } from '@/shared/components/display/tag';
import { cn } from '@/shared/lib/cn';
import { formatDate } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { billingQuery, useBilling, useChangePlan } from '../api/platform-api';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(billingQuery());
    return null;
  };

const usd = (n: number, locale: string) =>
  new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(n);
const compact = (n: number, locale: string) =>
  new Intl.NumberFormat(locale, { notation: 'compact' }).format(n);

/** Plan, usage against limits, payment method, plan comparison and invoice history. */
export default function BillingPage() {
  const { t, i18n } = useTranslation('saas');
  const billing = useBilling();
  const changePlan = useChangePlan();
  const data = billing.data;
  const lang = i18n.language;

  if (billing.isError) {
    return (
      <Page width="full" title={t('billing.title')}>
        <ErrorState title={t('common.error')} onRetry={() => void billing.refetch()} />
      </Page>
    );
  }

  if (!data) {
    return (
      <Page width="full" title={t('billing.title')} description={t('billing.description')}>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 rounded-xl lg:col-span-2" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </Page>
    );
  }

  const plan = data.plans.find((p) => p.id === data.planId)!;
  const currentIndex = data.plans.indexOf(plan);

  return (
    <Page width="full" title={t('billing.title')} description={t('billing.description')}>
      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard
          className="lg:col-span-2"
          title={t('billing.current', { plan: plan.name })}
          description={t('billing.renews', { date: formatDate(data.renewsAt, 'MMMM D, YYYY') })}
          action={
            <span className="text-2xl font-semibold tabular-nums">
              {usd(plan.price, lang)}
              <span className="text-sm font-normal text-muted-foreground">
                /{t('billing.month')}
              </span>
            </span>
          }
        >
          <MeterList
            items={[
              {
                key: 'requests',
                label: t('billing.meters.requests'),
                value: data.usage.requests.used,
                max: data.usage.requests.limit,
                display: `${compact(data.usage.requests.used, lang)} / ${compact(data.usage.requests.limit, lang)}`,
              },
              {
                key: 'seats',
                label: t('billing.meters.seats'),
                value: data.usage.seats.used,
                max: data.usage.seats.limit,
                color:
                  data.usage.seats.used > data.usage.seats.limit ? 'var(--destructive)' : undefined,
              },
              {
                key: 'storage',
                label: t('billing.meters.storage'),
                value: data.usage.storage.used,
                max: data.usage.storage.limit,
                display: `${data.usage.storage.used} / ${data.usage.storage.limit} GB`,
              },
            ]}
          />
          {data.usage.seats.used > data.usage.seats.limit && (
            <p className="mt-4 text-sm text-destructive">
              {t('billing.overSeats', { count: data.usage.seats.used - data.usage.seats.limit })}
            </p>
          )}
        </SectionCard>

        <SectionCard
          title={t('billing.paymentMethod')}
          action={
            <Button variant="outline" size="sm">
              {t('billing.update')}
            </Button>
          }
        >
          <div className="relative overflow-hidden rounded-xl bg-[linear-gradient(135deg,var(--primary),color-mix(in_srgb,var(--primary)_55%,var(--chart-4)))] p-5 text-primary-foreground shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold tracking-wide">
                {data.paymentMethod.brand}
              </span>
              <Wifi className="size-5 rotate-90 opacity-80" />
            </div>
            <p className="mt-8 font-mono text-lg tracking-[0.2em] tabular-nums">
              •••• •••• •••• {data.paymentMethod.last4}
            </p>
            <div className="mt-4 flex justify-between text-xs opacity-85">
              <span className="truncate">{data.paymentMethod.name}</span>
              <span className="tabular-nums">{data.paymentMethod.exp}</span>
            </div>
          </div>
        </SectionCard>
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-semibold tracking-tight">{t('billing.plans')}</h2>
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {data.plans.map((p, index) => {
            const current = p.id === plan.id;
            const contact = p.price < 0;
            return (
              <li
                key={p.id}
                className={cn(
                  'flex flex-col rounded-xl border bg-card p-6 shadow-xs',
                  current && 'border-primary ring-2 ring-primary/15',
                )}
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{p.name}</p>
                  {current && (
                    <Tag size="sm" tone="primary">
                      {t('billing.currentTag')}
                    </Tag>
                  )}
                </div>
                <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">
                  {contact ? t('billing.custom') : usd(p.price, lang)}
                  {!contact && (
                    <span className="text-sm font-normal text-muted-foreground">
                      /{t('billing.month')}
                    </span>
                  )}
                </p>
                <ul className="mt-5 flex-1 space-y-2.5 text-sm">
                  {p.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-6 w-full"
                  variant={current ? 'outline' : index > currentIndex ? 'default' : 'outline'}
                  disabled={current || changePlan.isPending}
                  onClick={() =>
                    contact ? window.open('mailto:sales@example.com') : changePlan.mutate(p.id)
                  }
                >
                  {current
                    ? t('billing.currentTag')
                    : contact
                      ? t('billing.contact')
                      : index > currentIndex
                        ? t('billing.upgrade')
                        : t('billing.downgrade')}
                </Button>
              </li>
            );
          })}
        </ul>
      </section>

      <SectionCard title={t('billing.invoices')} flush>
        <div className="overflow-x-auto border-t">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">{t('billing.col.invoice')}</TableHead>
                <TableHead>{t('billing.col.date')}</TableHead>
                <TableHead>{t('billing.col.status')}</TableHead>
                <TableHead className="text-right">{t('billing.col.amount')}</TableHead>
                <TableHead className="w-16 pr-6">
                  <span className="sr-only">{t('billing.download')}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="pl-6 font-mono text-xs">{invoice.number}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(invoice.date, 'MMM D, YYYY')}
                  </TableCell>
                  <TableCell>
                    <Tag
                      size="sm"
                      dot
                      tone={
                        invoice.status === 'paid'
                          ? 'success'
                          : invoice.status === 'open'
                            ? 'warning'
                            : 'neutral'
                      }
                    >
                      {t(`billing.status.${invoice.status}`)}
                    </Tag>
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {usd(invoice.amount, lang)}
                  </TableCell>
                  <TableCell className="pr-6">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t('billing.download')}
                      disabled={invoice.status === 'void'}
                    >
                      <Download />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SectionCard>
    </Page>
  );
}
