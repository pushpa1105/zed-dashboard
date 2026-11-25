import { ArrowLeft, Receipt } from 'lucide-react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { Link, useParams } from '@/core/router/router';
import { AreaChart } from '@/shared/components/charts/area-chart';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatStrip } from '@/shared/components/dashboard/stat-strip';
import { DescriptionList } from '@/shared/components/display/description-list';
import { EmptyState } from '@/shared/components/display/empty-state';
import { ErrorState } from '@/shared/components/display/error-state';
import { StatusBadge } from '@/shared/components/display/status-badge';
import { formatDate } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { customerQuery, useCustomer } from '../api/admin-api';
import { CustomerActions } from '../components/customer-actions';
import { CustomerStatus, HealthMeter, PlanTag, RiskTag } from '../components/customer-badges';
import { compact, money } from '../lib/format';
import { saasRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ params }) => {
    await queryClient.prefetchQuery(customerQuery(params.customerId!));
    return null;
  };

/** One tenant: revenue, 30-day API usage, invoices, profile and admin actions. */
export default function CustomerPage() {
  const { t, i18n } = useTranslation('saas');
  const { customerId = '' } = useParams();
  const customer = useCustomer(customerId);
  const c = customer.data;

  return (
    <Page
      width="full"
      title={c?.name ?? t('customers.title')}
      description={c ? `${c.domain} · ${c.id}` : undefined}
      actions={
        <Button variant="outline" asChild>
          <Link to={saasRoutes.customers.href()}>
            <ArrowLeft /> {t('customer.back')}
          </Link>
        </Button>
      }
    >
      {customer.isError ? (
        <ErrorState title={t('customer.notFound')} onRetry={() => void customer.refetch()} />
      ) : !c ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      ) : (
        <div className="grid items-start gap-6 xl:grid-cols-[1fr_22rem]">
          <div className="min-w-0 space-y-6">
            <section className="rounded-xl border bg-card px-6 py-3 shadow-xs">
              <StatStrip
                items={[
                  { key: 'mrr', label: t('customers.col.mrr'), value: money(c.mrr, i18n.language) },
                  {
                    key: 'seats',
                    label: t('customers.col.seats'),
                    value: `${c.seatsUsed} / ${c.seats}`,
                  },
                  {
                    key: 'health',
                    label: t('customers.col.health'),
                    value: <HealthMeter value={c.health} className="h-8" />,
                  },
                  {
                    key: 'since',
                    label: t('customer.since'),
                    value: formatDate(c.createdAt, 'MMM YYYY'),
                  },
                ]}
              />
            </section>

            <SectionCard title={t('customer.usage')} description={t('customer.usageHint')}>
              <AreaChart
                className="h-64"
                xKey="label"
                data={c.usage.map((d) => ({ ...d, label: formatDate(d.day, 'MMM D') }))}
                series={[{ key: 'requests', label: t('customer.requests') }]}
                valueFormatter={(v) => compact(v, i18n.language)}
              />
            </SectionCard>

            <SectionCard title={t('customer.invoices')} flush>
              {c.invoices.length === 0 ? (
                <EmptyState
                  variant="plain"
                  icon={Receipt}
                  title={t('customer.noInvoices')}
                  className="border-t py-10"
                />
              ) : (
                <div className="overflow-x-auto border-t">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-6">{t('customer.col.number')}</TableHead>
                        <TableHead>{t('customer.col.date')}</TableHead>
                        <TableHead>{t('customer.col.status')}</TableHead>
                        <TableHead className="pr-6 text-right">
                          {t('customer.col.amount')}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {c.invoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="pl-6 font-mono text-xs">{invoice.number}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(invoice.date, 'MMM D, YYYY')}
                          </TableCell>
                          <TableCell>
                            <StatusBadge
                              status={invoice.status}
                              label={t(`customer.invoiceStatus.${invoice.status}`)}
                            />
                          </TableCell>
                          <TableCell className="pr-6 text-right tabular-nums">
                            {money(invoice.amount, i18n.language, 2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </SectionCard>
          </div>

          <div className="space-y-6">
            <SectionCard title={t('customer.profile')}>
              <DescriptionList
                layout="vertical"
                items={[
                  { key: 'plan', term: t('customers.col.plan'), detail: <PlanTag plan={c.plan} /> },
                  {
                    key: 'status',
                    term: t('customers.col.status'),
                    detail: <CustomerStatus status={c.status} />,
                  },
                  {
                    key: 'risk',
                    term: t('customers.col.risk'),
                    detail: <RiskTag risk={c.churnRisk} />,
                  },
                  {
                    key: 'contact',
                    term: t('customer.contact'),
                    detail: `${c.contact} · ${c.email}`,
                  },
                  { key: 'region', term: t('customer.region'), detail: c.region },
                ]}
              />
            </SectionCard>
            {/* Remount after a plan change so the picker resets to the saved plan. */}
            <CustomerActions key={c.plan} customer={c} />
          </div>
        </div>
      )}
    </Page>
  );
}
