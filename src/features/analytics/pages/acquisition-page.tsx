import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { DonutChart } from '@/shared/components/charts/donut-chart';
import { seriesColor } from '@/shared/components/charts/series';
import { Sparkline } from '@/shared/components/charts/sparkline';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { TrendBadge } from '@/shared/components/dashboard/trend-badge';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { acquisitionQuery, useAcquisition } from '../api/analytics-api';
import { QueryError } from '../components/query-error';
import { RangeControl } from '../components/range-control';
import { UtmBuilder } from '../components/utm-builder';
import { rangeFromRequest, useRangeParams } from '../hooks/use-range';
import { compact, integer, money, percent } from '../lib/format';
import type { Acquisition } from '../model/analytics';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ request }) => {
    await queryClient.prefetchQuery(acquisitionQuery(rangeFromRequest(request)));
    return null;
  };

function ChannelsTable({
  channels,
  showDelta,
}: {
  channels: Acquisition['channels'];
  showDelta: boolean;
}) {
  const { t } = useTranslation('analytics');
  return (
    <SectionCard
      title={t('acquisition.channels.title')}
      description={t('acquisition.channels.description')}
      flush
      className="xl:col-span-2"
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-6">{t('acquisition.channels.channel')}</TableHead>
            <TableHead className="hidden md:table-cell">
              {t('acquisition.channels.trend')}
            </TableHead>
            <TableHead className="text-right">{t('acquisition.channels.users')}</TableHead>
            <TableHead className="hidden text-right sm:table-cell">
              {t('acquisition.channels.conversion')}
            </TableHead>
            <TableHead className="pr-6 text-right">{t('acquisition.channels.revenue')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {channels.map((channel, i) => (
            <TableRow key={channel.key}>
              <TableCell className="pl-6">
                <span className="flex items-center gap-2.5">
                  <span
                    className="size-2.5 rounded-[3px]"
                    style={{ background: seriesColor(i) }}
                    aria-hidden
                  />
                  <span className="font-medium">{channel.label}</span>
                </span>
              </TableCell>
              <TableCell className="hidden py-2 md:table-cell">
                <Sparkline
                  data={channel.trend}
                  color={seriesColor(i)}
                  variant="line"
                  className="h-8 w-28"
                  label={t('acquisition.channels.trendLabel', { channel: channel.label })}
                />
              </TableCell>
              <TableCell className="text-right">
                <span className="flex items-center justify-end gap-2 tabular-nums">
                  {integer(channel.users)}
                  {showDelta && <TrendBadge delta={channel.delta} variant="text" />}
                </span>
              </TableCell>
              <TableCell className="hidden text-right tabular-nums sm:table-cell">
                {percent(channel.conversionRate, 2)}
              </TableCell>
              <TableCell className="pr-6 text-right font-medium tabular-nums">
                {money(channel.revenue)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  );
}

function SourcesTable({ sources }: { sources: Acquisition['sources'] }) {
  const { t } = useTranslation('analytics');
  return (
    <SectionCard
      title={t('acquisition.sources.title')}
      description={t('acquisition.sources.description')}
      flush
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-6">{t('acquisition.sources.sourceMedium')}</TableHead>
            <TableHead className="text-right">{t('acquisition.sources.sessions')}</TableHead>
            <TableHead className="pr-6 text-right">
              {t('acquisition.sources.conversions')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sources.map((row) => (
            <TableRow key={`${row.source}/${row.medium}`}>
              <TableCell className="max-w-48 pl-6">
                <span className="block truncate font-medium">{row.source}</span>
                <span className="text-xs text-muted-foreground">
                  {row.medium} ·{' '}
                  {t('acquisition.sources.bounce', { value: percent(row.bounceRate, 0) })}
                </span>
              </TableCell>
              <TableCell className="text-right tabular-nums">{compact(row.sessions)}</TableCell>
              <TableCell className="pr-6 text-right tabular-nums">
                {integer(row.conversions)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  );
}

/** Where visitors come from: channels, sources and tagged campaign links. */
export default function AcquisitionPage() {
  const { t } = useTranslation('analytics');
  const { range, compare } = useRangeParams();
  const acquisition = useAcquisition(range);
  const data = acquisition.data;

  return (
    <Page
      width="full"
      title={t('acquisition.title')}
      description={t('acquisition.description')}
      actions={<RangeControl />}
    >
      {acquisition.isError && !data ? (
        <QueryError onRetry={() => void acquisition.refetch()} />
      ) : !data ? (
        <div className="grid gap-6 xl:grid-cols-3">
          <Skeleton className="h-[26rem] rounded-xl xl:col-span-2" />
          <Skeleton className="h-[26rem] rounded-xl" />
        </div>
      ) : (
        <div className="grid items-start gap-6 xl:grid-cols-3">
          <ChannelsTable channels={data.channels} showDelta={compare !== 'none'} />
          <SectionCard
            title={t('acquisition.share.title')}
            description={t('acquisition.share.description')}
          >
            <DonutChart
              data={data.channels
                .slice(0, 5)
                .map((c) => ({ key: c.key, label: c.label, value: c.users }))}
              centerLabel={t('acquisition.channels.users')}
              legend="bottom"
              valueFormatter={compact}
            />
          </SectionCard>
          <UtmBuilder links={data.links} />
          <SourcesTable sources={data.sources} />
        </div>
      )}
    </Page>
  );
}
