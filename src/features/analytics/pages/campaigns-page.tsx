import { Download } from 'lucide-react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { useSearchParams } from '@/core/router/router';
import { Button } from '@/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

import {
  dealsQuery,
  marketingOverviewQuery,
  useMarketingOverview,
} from '../campaigns/api/marketing-api';
import { DealsCard } from '../campaigns/components/deals-card';
import { ChannelsCard, PostStatsCard } from '../campaigns/components/engagement-cards';
import { FunnelCard } from '../campaigns/components/funnel-card';
import { KpiRow } from '../campaigns/components/kpi-row';
import { LedgerCard } from '../campaigns/components/ledger-card';
import { PostsCard } from '../campaigns/components/posts-card';
import { TrafficCard } from '../campaigns/components/traffic-card';
import { WidgetError } from '../campaigns/components/widget-error';
import { MARKETING_PERIODS, type MarketingPeriod } from '../campaigns/model/marketing';

const parsePeriod = (value: string | null): MarketingPeriod =>
  MARKETING_PERIODS.includes(value as MarketingPeriod) ? (value as MarketingPeriod) : '30d';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ request }) => {
    const period = parsePeriod(new URL(request.url).searchParams.get('period'));
    await Promise.all([
      queryClient.prefetchQuery(marketingOverviewQuery(period)),
      queryClient.prefetchQuery(dealsQuery('monthly')),
    ]);
    return null;
  };

/** Downloads the traffic series as CSV (client-side; no endpoint needed). */
function downloadCsv(rows: Array<Record<string, string | number>>, filename: string) {
  if (!rows.length) return;
  const header = Object.keys(rows[0]!);
  const csv = [header.join(','), ...rows.map((r) => header.map((h) => r[h]).join(','))].join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}

export default function MarketingDashboardPage() {
  const { t } = useTranslation('analytics', { keyPrefix: 'campaigns' });
  const [searchParams, setSearchParams] = useSearchParams();
  const period = parsePeriod(searchParams.get('period'));
  const overview = useMarketingOverview(period);
  const data = overview.data;

  return (
    <Page
      width="full"
      title={t('title')}
      description={t('description')}
      actions={
        <>
          <Select
            value={period}
            onValueChange={(value) =>
              setSearchParams((prev) => {
                prev.set('period', value);
                return prev;
              })
            }
          >
            <SelectTrigger className="w-40 bg-card" aria-label={t('period.label')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {MARKETING_PERIODS.map((p) => (
                <SelectItem key={p} value={p}>
                  {t(`period.${p}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="bg-card"
            disabled={!data}
            onClick={() => data && downloadCsv(data.traffic, `marketing-traffic-${period}.csv`)}
          >
            <Download /> {t('export')}
          </Button>
        </>
      }
    >
      {overview.isError ? (
        <div className="rounded-xl border bg-card">
          <WidgetError onRetry={() => void overview.refetch()} />
        </div>
      ) : (
        <div
          className="space-y-4 transition-opacity data-[fetching=true]:opacity-70"
          data-fetching={overview.isPlaceholderData}
        >
          <KpiRow kpis={data?.kpis} />
          <div className="grid gap-4 lg:grid-cols-12">
            <TrafficCard traffic={data?.traffic} />
            <FunnelCard funnel={data?.funnel} />
            <LedgerCard data={data} />
            <DealsCard />
            <PostsCard posts={data?.posts} />
            <PostStatsCard stats={data?.postStats} />
            <ChannelsCard channels={data?.channels} />
          </div>
        </div>
      )}
    </Page>
  );
}
