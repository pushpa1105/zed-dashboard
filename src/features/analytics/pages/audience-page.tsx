import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { AreaChart } from '@/shared/components/charts/area-chart';
import { BarChart } from '@/shared/components/charts/bar-chart';
import { DonutChart } from '@/shared/components/charts/donut-chart';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatStrip } from '@/shared/components/dashboard/stat-strip';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { audienceQuery, useAudience } from '../api/analytics-api';
import { CountryLabel } from '../components/country-label';
import { QueryError } from '../components/query-error';
import { RangeControl } from '../components/range-control';
import { ShareBar } from '../components/share-bar';
import { rangeFromRequest, useRangeParams } from '../hooks/use-range';
import { compact, duration, integer, percent } from '../lib/format';
import type { Audience } from '../model/analytics';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ request }) => {
    await queryClient.prefetchQuery(audienceQuery(rangeFromRequest(request)));
    return null;
  };

function CountriesTable({ countries }: { countries: Audience['countries'] }) {
  const { t } = useTranslation('analytics');
  return (
    <SectionCard
      title={t('audience.countries.title')}
      description={t('audience.countries.description')}
      flush
      className="xl:col-span-2"
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-6">{t('audience.countries.country')}</TableHead>
            <TableHead className="w-[38%]">{t('audience.countries.share')}</TableHead>
            <TableHead className="text-right">{t('audience.countries.users')}</TableHead>
            <TableHead className="hidden text-right md:table-cell">
              {t('audience.countries.sessions')}
            </TableHead>
            <TableHead className="hidden pr-6 text-right sm:table-cell">
              {t('audience.countries.engagement')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {countries.map((row) => (
            <TableRow key={row.code}>
              <TableCell className="pl-6">
                <CountryLabel code={row.code} name={row.country} />
              </TableCell>
              <TableCell>
                <ShareBar share={row.share} max={countries[0]!.share} />
              </TableCell>
              <TableCell className="text-right tabular-nums">{integer(row.users)}</TableCell>
              <TableCell className="hidden text-right tabular-nums md:table-cell">
                {integer(row.sessions)}
              </TableCell>
              <TableCell className="hidden pr-6 text-right tabular-nums sm:table-cell">
                {percent(row.engagementRate)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  );
}

/** Who the visitors are: totals, new vs returning, devices, ages and countries. */
export default function AudiencePage() {
  const { t } = useTranslation('analytics');
  const { range } = useRangeParams();
  const audience = useAudience(range);
  const data = audience.data;

  return (
    <Page
      width="full"
      title={t('audience.title')}
      description={t('audience.description')}
      actions={<RangeControl />}
    >
      {audience.isError && !data ? (
        <QueryError onRetry={() => void audience.refetch()} />
      ) : !data ? (
        <div className="space-y-6">
          <Skeleton className="h-28 rounded-xl" />
          <div className="grid gap-6 xl:grid-cols-3">
            <Skeleton className="h-96 rounded-xl xl:col-span-2" />
            <Skeleton className="h-96 rounded-xl" />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <section className="rounded-xl border bg-card px-6 py-2 shadow-xs">
            <StatStrip
              items={[
                {
                  key: 'users',
                  label: t('audience.totals.users'),
                  value: compact(data.totals.users),
                  delta: 12.4,
                },
                {
                  key: 'new',
                  label: t('audience.totals.new'),
                  value: compact(data.totals.newUsers),
                  delta: 18.1,
                },
                {
                  key: 'session',
                  label: t('audience.totals.session'),
                  value: duration(data.totals.avgSessionSec),
                  delta: -3.2,
                },
                {
                  key: 'engagement',
                  label: t('audience.totals.engagement'),
                  value: percent(data.totals.engagementRate),
                  delta: 2.6,
                },
              ]}
            />
          </section>
          <div className="grid gap-6 xl:grid-cols-3">
            <SectionCard
              className="xl:col-span-2"
              title={t('audience.returning.title')}
              description={t('audience.returning.description')}
            >
              <AreaChart
                data={data.newVsReturning}
                xKey="date"
                stacked
                series={[
                  { key: 'new', label: t('audience.returning.new') },
                  { key: 'returning', label: t('audience.returning.returning') },
                ]}
                className="h-72"
              />
            </SectionCard>
            <SectionCard
              title={t('audience.devices.title')}
              description={t('audience.devices.description')}
              contentClassName="flex items-center"
            >
              <DonutChart
                data={data.devices.map((d) => ({
                  key: d.key,
                  label: t(`realtime.devices.${d.key as 'desktop' | 'mobile' | 'tablet'}`),
                  value: d.value,
                }))}
                centerLabel={t('audience.devices.users')}
                legend="bottom"
                className="w-full"
              />
            </SectionCard>
          </div>
          <div className="grid gap-6 xl:grid-cols-3">
            <SectionCard
              title={t('audience.ages.title')}
              description={t('audience.ages.description')}
            >
              <BarChart
                data={data.ages}
                xKey="group"
                horizontal
                series={[{ key: 'users', label: t('audience.totals.users') }]}
                highlight={1}
                className="h-[25rem]"
              />
            </SectionCard>
            <CountriesTable countries={data.countries} />
          </div>
        </div>
      )}
    </Page>
  );
}
