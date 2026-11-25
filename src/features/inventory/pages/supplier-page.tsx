import { ArrowLeft, Plus } from 'lucide-react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { Link, useParams } from '@/core/router/router';
import { BarChart } from '@/shared/components/charts/bar-chart';
import { LineChart } from '@/shared/components/charts/line-chart';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatStrip } from '@/shared/components/dashboard/stat-strip';
import { DataTable } from '@/shared/components/data-table/data-table';
import { useDataTable } from '@/shared/components/data-table/use-data-table';
import { DescriptionList } from '@/shared/components/display/description-list';
import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

import { supplierQuery, useSupplier } from '../api/inventory-api';
import { ErrorPanel } from '../components/error-panel';
import { usePurchaseOrderColumns } from '../components/purchase-order-columns';
import { SupplierItemsTable } from '../components/supplier-items-table';
import { lastMonths, usdCompact } from '../lib/format';
import type { PurchaseOrder, SupplierDetail } from '../model/inventory';
import { inventoryRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ params }) => {
    await queryClient.prefetchQuery(supplierQuery(params.supplierId!));
    return null;
  };

const EMPTY: PurchaseOrder[] = [];

function Profile({ supplier }: { supplier: SupplierDetail }) {
  const { t } = useTranslation('inventory', { keyPrefix: 'supplier' });
  return (
    <SectionCard title={t('profile')}>
      <div className="mb-5 flex items-center gap-3">
        <InitialsAvatar name={supplier.name} size="lg" />
        <div className="min-w-0">
          <p className="truncate font-semibold">{supplier.name}</p>
          <p className="font-mono text-xs text-muted-foreground">{supplier.id}</p>
        </div>
      </div>
      <DescriptionList
        layout="horizontal"
        items={[
          { key: 'contact', term: t('contact'), detail: supplier.contact },
          {
            key: 'email',
            term: t('email'),
            detail: (
              <a href={`mailto:${supplier.email}`} className="text-primary hover:underline">
                {supplier.email}
              </a>
            ),
          },
          { key: 'phone', term: t('phone'), detail: supplier.phone },
          { key: 'country', term: t('country'), detail: supplier.country },
          { key: 'terms', term: t('terms'), detail: supplier.terms },
        ]}
      />
    </SectionCard>
  );
}

function Performance({ supplier }: { supplier: SupplierDetail }) {
  const { t } = useTranslation('inventory', { keyPrefix: 'supplier' });
  const months = lastMonths(supplier.leadTimeTrend.length);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <SectionCard title={t('lead.title')} description={t('lead.description')}>
        <LineChart
          className="h-64"
          data={supplier.leadTimeTrend.map((days, i) => ({
            month: months[i]!,
            days,
            quoted: supplier.leadTimeDays,
          }))}
          xKey="month"
          series={[
            { key: 'days', label: t('lead.actual') },
            { key: 'quoted', label: t('lead.quoted'), color: 'var(--muted-foreground)' },
          ]}
          dashed={['quoted']}
          dots
          valueFormatter={(v) => `${v}d`}
        />
      </SectionCard>
      <SectionCard title={t('onTime.title')} description={t('onTime.description')}>
        <BarChart
          className="h-64"
          data={supplier.onTimeTrend.map((rate, i) => ({ month: months[i]!, rate }))}
          xKey="month"
          series={[{ key: 'rate', label: t('onTime.rate'), color: 'var(--chart-2)' }]}
          highlight="last"
          valueFormatter={(v) => `${v}%`}
        />
      </SectionCard>
    </div>
  );
}

/** One supplier: profile, delivery performance, supplied items and recent purchase orders. */
export default function SupplierPage() {
  const { t } = useTranslation('inventory', { keyPrefix: 'supplier' });
  const { supplierId = '' } = useParams();
  const supplier = useSupplier(supplierId);
  const data = supplier.data;
  const columns = usePurchaseOrderColumns();
  const orders = useDataTable<PurchaseOrder>({
    data: data?.purchaseOrders ?? EMPTY,
    columns,
    getRowId: (row) => row.id,
    initialState: { columnVisibility: { supplier: false } },
  });

  return (
    <Page
      title={data?.name ?? supplierId}
      description={data ? `${data.contact} · ${data.country}` : undefined}
      width="full"
      actions={
        <>
          <Button variant="ghost" asChild>
            <Link to={inventoryRoutes.suppliers.href()}>
              <ArrowLeft /> {t('back')}
            </Link>
          </Button>
          <Button asChild>
            <Link to={inventoryRoutes.purchaseOrders.href({ new: 1, supplier: supplierId })}>
              <Plus /> {t('newPO')}
            </Link>
          </Button>
        </>
      }
    >
      {supplier.isError ? (
        <ErrorPanel onRetry={() => void supplier.refetch()} />
      ) : !data ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      ) : (
        <>
          <SectionCard>
            <StatStrip
              items={[
                { key: 'lead', label: t('kpis.lead'), value: `${data.leadTimeDays}d` },
                { key: 'onTime', label: t('kpis.onTime'), value: `${data.onTimeRate}%` },
                { key: 'fill', label: t('kpis.fill'), value: `${data.fillRate}%` },
                {
                  key: 'spend',
                  label: t('kpis.spend'),
                  value: usdCompact(data.spendYtd),
                  hint: t('kpis.openPOs', { count: data.openPOs }),
                },
              ]}
            />
          </SectionCard>
          <div className="grid gap-6 xl:grid-cols-[1fr_2fr]">
            <Profile supplier={data} />
            <Performance supplier={data} />
          </div>
          <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
            <SectionCard
              flush
              title={t('items.title')}
              description={t('items.description', { count: data.items.length })}
            >
              <SupplierItemsTable items={data.items} />
            </SectionCard>
            <SectionCard
              flush
              title={t('orders.title')}
              footer={
                <Link
                  to={inventoryRoutes.purchaseOrders.href()}
                  className="font-medium text-primary hover:underline"
                >
                  {t('orders.link')}
                </Link>
              }
            >
              <DataTable table={orders} caption={t('orders.title')} className="border-t" />
            </SectionCard>
          </div>
        </>
      )}
    </Page>
  );
}
