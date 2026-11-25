import { RefreshCw, TriangleAlert } from 'lucide-react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { useSearchParams } from '@/core/router/router';
import { cn } from '@/shared/lib/cn';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Skeleton } from '@/shared/ui/skeleton';

import { ecommerceOverviewQuery, useEcommerceOverview } from '../api/overview-api';
import {
  CarryingCard,
  ChannelsCard,
  OrderRateCard,
  PerformanceCard,
} from '../components/chart-cards';
import { RatingsCard, SummaryCard } from '../components/customer-cards';
import { KpiCards } from '../components/kpi-cards';
import { OrdersTable } from '../components/orders-table';
import { TopProducts } from '../components/top-products';
import { ECOMMERCE_YEARS, type EcommerceYear } from '../model/overview';

const parseYear = (params: URLSearchParams): EcommerceYear => {
  const value = params.get('year');
  return (ECOMMERCE_YEARS as readonly string[]).includes(value ?? '')
    ? (value as EcommerceYear)
    : '2025';
};

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ request }) => {
    await queryClient.prefetchQuery(
      ecommerceOverviewQuery(parseYear(new URL(request.url).searchParams)),
    );
    return null;
  };

function EcommerceSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-36 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-96 rounded-xl lg:col-span-2" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    </div>
  );
}

/**
 * E-commerce / logistics template: KPI cards with sparklines, order trend vs
 * last year, carrying costs, payment performance, channel mix, orders, top
 * products and customers.
 */
export default function EcommerceDashboardPage() {
  const { t } = useTranslation('ecommerce', { keyPrefix: 'overview' });
  const [params, setParams] = useSearchParams();
  const year = parseYear(params);
  const overview = useEcommerceOverview(year);
  const data = overview.data;

  const yearSelect = (
    <Select
      value={year}
      onValueChange={(value) =>
        setParams(
          (prev) => {
            const p = new URLSearchParams(prev);
            p.set('year', value);
            return p;
          },
          { replace: true },
        )
      }
    >
      <SelectTrigger size="sm" className="w-24" aria-label={t('year')}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {ECOMMERCE_YEARS.map((y) => (
          <SelectItem key={y} value={y}>
            {y}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <Page width="full" title={t('title')} description={t('description')}>
      {overview.isError && !data ? (
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertTitle>{t('error.title')}</AlertTitle>
          <AlertDescription>{t('error.description')}</AlertDescription>
          <AlertAction>
            <Button size="sm" variant="outline" onClick={() => void overview.refetch()}>
              <RefreshCw /> {t('error.retry')}
            </Button>
          </AlertAction>
        </Alert>
      ) : !data ? (
        <EcommerceSkeleton />
      ) : (
        <div
          className={cn('space-y-4 transition-opacity', overview.isPlaceholderData && 'opacity-60')}
        >
          <KpiCards kpis={data.kpis} />
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="min-w-0 lg:col-span-2">
              <OrderRateCard data={data.orderRate} action={yearSelect} />
            </div>
            <CarryingCard carrying={data.carrying} />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="min-w-0 lg:col-span-2">
              <PerformanceCard data={data.performance} />
            </div>
            <ChannelsCard channels={data.channels} />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="min-w-0 lg:col-span-2">
              <OrdersTable orders={data.orders} />
            </div>
            <RatingsCard ratings={data.ratings} />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="min-w-0 lg:col-span-2">
              <TopProducts products={data.topProducts} />
            </div>
            <SummaryCard items={data.summary} />
          </div>
        </div>
      )}
    </Page>
  );
}
