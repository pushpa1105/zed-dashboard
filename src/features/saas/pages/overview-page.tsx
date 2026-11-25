import { CalendarDays, RefreshCw, TriangleAlert } from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { useSearchParams } from '@/core/router/router';
import { cn } from '@/shared/lib/cn';
import { formatDate } from '@/shared/lib/format';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

import { saasOverviewQuery, useSaasOverview } from '../api/overview-api';
import { ActivityFeed } from '../components/activity-feed';
import { ApiCallsCard } from '../components/api-calls-card';
import { IntegrationsCard } from '../components/integrations-card';
import { PlanCard } from '../components/plan-card';
import { PnlCard } from '../components/pnl-card';
import { UsageStrip } from '../components/usage-strip';
import { SAAS_RANGES, type SaasRange } from '../model/overview';

const parseRange = (params: URLSearchParams): SaasRange => {
  const value = params.get('range');
  return (SAAS_RANGES as readonly string[]).includes(value ?? '') ? (value as SaasRange) : '6h';
};

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ request }) => {
    await queryClient.prefetchQuery(
      saasOverviewQuery(parseRange(new URL(request.url).searchParams)),
    );
    return null;
  };

function SaasSkeleton() {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]" aria-busy="true">
      <div className="space-y-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
      <Skeleton className="h-[640px] rounded-xl" />
    </div>
  );
}

/**
 * SaaS / API product template: plan usage strip, traffic chart with range
 * toggle, P&L split, plan limits, an activity feed and integration switches.
 */
export default function SaasDashboardPage() {
  const { t } = useTranslation('saas', { keyPrefix: 'overview' });
  const [params, setParams] = useSearchParams();
  const range = parseRange(params);
  const overview = useSaasOverview(range);
  const data = overview.data;
  const [today] = useState(() => Date.now());

  const setRange = (next: SaasRange) =>
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        p.set('range', next);
        return p;
      },
      { replace: true },
    );

  return (
    <Page
      width="full"
      title={t('title')}
      description={t('description')}
      actions={
        <Button variant="outline" className="bg-card font-medium">
          <CalendarDays /> {formatDate(today, 'dddd, D MMMM YYYY')}
        </Button>
      }
    >
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
        <SaasSkeleton />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-4">
            <UsageStrip stats={data.stats} />
            <div className={cn('transition-opacity', overview.isPlaceholderData && 'opacity-60')}>
              <ApiCallsCard data={data} range={range} onRangeChange={setRange} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <PnlCard data={data} />
              <PlanCard plan={data.plan} />
            </div>
          </div>
          <div className="min-w-0 space-y-4">
            <ActivityFeed items={data.activity} />
            <IntegrationsCard items={data.integrations} />
          </div>
        </div>
      )}
    </Page>
  );
}
