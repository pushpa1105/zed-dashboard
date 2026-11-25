import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { BarChart } from '@/shared/components/charts/bar-chart';
import { DonutChart } from '@/shared/components/charts/donut-chart';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatStrip } from '@/shared/components/dashboard/stat-strip';
import { Skeleton } from '@/shared/ui/skeleton';

import { technologyQuery, useTechnology } from '../api/insights-api';
import { QueryError } from '../components/query-error';
import { RangeControl } from '../components/range-control';
import { SegmentsCard } from '../components/segments-card';
import { rangeFromRequest, useRangeParams } from '../hooks/use-range';
import { percent } from '../lib/format';
import { sessionRate } from '../lib/stats';
import type { DeviceCategory, Segment, TechDimension } from '../model/insights';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ request }) => {
    await queryClient.prefetchQuery(technologyQuery(rangeFromRequest(request)));
    return null;
  };

const shareOf = (segments: Segment[], segment: Segment | undefined) =>
  segment ? (segment.sessions / segments.reduce((sum, s) => sum + s.sessions, 0)) * 100 : 0;

/** The most used segment of a dimension, with its share of sessions as the hint. */
const leader = (segments: Segment[]) => ({
  value: segments[0]?.name ?? '—',
  hint: percent(shareOf(segments, segments[0])),
});

/** Device categories, operating systems, browsers and screens, with conversion per segment. */
export default function TechnologyPage() {
  const { t } = useTranslation('analytics');
  const { range } = useRangeParams();
  const query = useTechnology(range);
  const data = query.data;

  const label = (dimension: TechDimension, name: string) =>
    dimension === 'categories' ? t(`realtime.devices.${name as DeviceCategory}`) : name;
  const slices = (dimension: TechDimension) =>
    (data?.[dimension] ?? []).map((s) => ({
      key: s.name,
      label: label(dimension, s.name),
      value: s.sessions,
    }));
  const best = [...(data?.categories ?? [])].sort((a, b) => sessionRate(b) - sessionRate(a))[0];

  return (
    <Page
      width="full"
      title={t('technology.title')}
      description={t('technology.description')}
      actions={<RangeControl />}
    >
      {query.isError && !data ? (
        <QueryError onRetry={() => void query.refetch()} />
      ) : !data ? (
        <div className="space-y-6">
          <Skeleton className="h-28 rounded-xl" />
          <div className="grid gap-6 xl:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-80 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      ) : (
        <div className="space-y-6">
          <section className="rounded-xl border bg-card px-6 py-2 shadow-xs">
            <StatStrip
              items={[
                {
                  key: 'mobile',
                  label: t('technology.kpis.mobile'),
                  value: percent(
                    shareOf(
                      data.categories,
                      data.categories.find((s) => s.name === 'mobile'),
                    ),
                  ),
                },
                { key: 'os', label: t('technology.kpis.os'), ...leader(data.os) },
                { key: 'browser', label: t('technology.kpis.browser'), ...leader(data.browsers) },
                {
                  key: 'best',
                  label: t('technology.kpis.best'),
                  value: best ? label('categories', best.name) : '—',
                  hint: best && percent(sessionRate(best), 2),
                },
              ]}
            />
          </section>
          <div className="grid gap-6 xl:grid-cols-3">
            <SectionCard
              title={t('technology.categories.title')}
              description={t('technology.categories.description')}
              contentClassName="flex items-center"
            >
              <DonutChart
                data={slices('categories')}
                centerLabel={t('technology.segments.sessions')}
                legend="bottom"
                className="w-full"
              />
            </SectionCard>
            <SectionCard
              title={t('technology.os.title')}
              description={t('technology.os.description')}
            >
              <BarChart
                data={slices('os')}
                xKey="label"
                horizontal
                series={[{ key: 'value', label: t('technology.segments.sessions') }]}
                highlight={0}
                className="h-72"
              />
            </SectionCard>
            <SectionCard
              title={t('technology.browsers.title')}
              description={t('technology.browsers.description')}
              contentClassName="flex items-center"
            >
              <DonutChart
                data={slices('browsers')}
                centerLabel={t('technology.segments.sessions')}
                legend="bottom"
                className="w-full"
              />
            </SectionCard>
          </div>
          <SegmentsCard technology={data} label={label} />
        </div>
      )}
    </Page>
  );
}
