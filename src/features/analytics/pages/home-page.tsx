import { RefreshCw, TriangleAlert } from 'lucide-react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { useSearchParams } from '@/core/router/router';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

import { RangeControl } from '../components/range-control';
import {
  analyticsOverviewQuery,
  useAnalyticsOverview,
  visitorsQuery,
} from '../home/api/analytics-api';
import { KpiCards } from '../home/components/kpi-cards';
import {
  IncomeCard,
  OrdersCard,
  ReportCard,
  SalesReportCard,
  TrafficCard,
} from '../home/components/overview-cards';
import { VisitorsCard } from '../home/components/visitors-card';
import type { Granularity } from '../home/model/overview';
import { rangeFromRequest, useRangeParams } from '../hooks/use-range';

const parseGranularity = (params: URLSearchParams): Granularity =>
  params.get('granularity') === 'week' ? 'week' : 'month';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ request }) => {
    const granularity = parseGranularity(new URL(request.url).searchParams);
    await Promise.all([
      queryClient.prefetchQuery(analyticsOverviewQuery(rangeFromRequest(request))),
      queryClient.prefetchQuery(visitorsQuery(granularity)),
    ]);
    return null;
  };

/**
 * Web-analytics template (flat, bordered panels with titles outside):
 * KPIs, unique visitors with Month/Week, weekly income, orders, a report
 * list, a weekday × hour traffic heatmap and a sales report.
 */
export default function AnalyticsDashboardPage() {
  const { t } = useTranslation('analytics', { keyPrefix: 'home' });
  const [params, setParams] = useSearchParams();
  const granularity = parseGranularity(params);
  const { range } = useRangeParams();
  const overview = useAnalyticsOverview(range);
  const data = overview.data;

  const setGranularity = (value: Granularity) =>
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        p.set('granularity', value);
        return p;
      },
      { replace: true },
    );

  return (
    <Page width="full" title={t('title')} description={t('description')} actions={<RangeControl />}>
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
        <div className="space-y-6" aria-busy="true">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
          <div className="grid gap-6 xl:grid-cols-12">
            <Skeleton className="h-96 rounded-lg xl:col-span-8" />
            <Skeleton className="h-96 rounded-lg xl:col-span-4" />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <KpiCards kpis={data.kpis} />
          <div className="grid gap-6 xl:grid-cols-12">
            <div className="min-w-0 xl:col-span-8">
              <VisitorsCard granularity={granularity} onGranularityChange={setGranularity} />
            </div>
            <div className="min-w-0 xl:col-span-4">
              <IncomeCard income={data.income} />
            </div>
          </div>
          <div className="grid gap-6 xl:grid-cols-12">
            <div className="min-w-0 xl:col-span-8">
              <OrdersCard orders={data.orders} />
            </div>
            <div className="min-w-0 xl:col-span-4">
              <ReportCard report={data.report} trend={data.reportTrend} />
            </div>
          </div>
          <div className="grid gap-6 xl:grid-cols-12">
            <div className="min-w-0 xl:col-span-8">
              <TrafficCard heatmap={data.heatmap} />
            </div>
            <div className="min-w-0 xl:col-span-4">
              <SalesReportCard sales={data.salesReport} />
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}
