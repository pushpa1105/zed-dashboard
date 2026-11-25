import { Globe2 } from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { DonutChart } from '@/shared/components/charts/donut-chart';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatStrip } from '@/shared/components/dashboard/stat-strip';
import { TrendBadge } from '@/shared/components/dashboard/trend-badge';
import { EmptyState } from '@/shared/components/display/empty-state';
import { SegmentedControl } from '@/shared/components/forms/segmented-control';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { geographyQuery, useGeography } from '../api/insights-api';
import { CountryLabel } from '../components/country-label';
import { CountrySheet } from '../components/country-sheet';
import { QueryError } from '../components/query-error';
import { RangeControl } from '../components/range-control';
import { ShareBar } from '../components/share-bar';
import { TileMap } from '../components/tile-map';
import { useCountryName } from '../hooks/use-country-name';
import { rangeFromRequest, useRangeParams } from '../hooks/use-range';
import { compact, integer, percent } from '../lib/format';
import { REGIONS, type CountryRow, type Region } from '../model/insights';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ request }) => {
    await queryClient.prefetchQuery(geographyQuery(rangeFromRequest(request)));
    return null;
  };

const sum = (rows: CountryRow[], pick: (row: CountryRow) => number) =>
  rows.reduce((total, row) => total + pick(row), 0);

function CountriesTable({
  rows,
  total,
  onOpen,
}: {
  rows: CountryRow[];
  total: number;
  onOpen: (code: string) => void;
}) {
  const { t } = useTranslation('analytics');
  const countryName = useCountryName();
  const topShare = (rows[0]!.sessions / total) * 100;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12 pl-6">#</TableHead>
          <TableHead>{t('geography.table.country')}</TableHead>
          <TableHead className="hidden w-[28%] md:table-cell">
            {t('geography.table.share')}
          </TableHead>
          <TableHead className="text-right">{t('geography.table.sessions')}</TableHead>
          <TableHead className="hidden text-right lg:table-cell">
            {t('geography.table.users')}
          </TableHead>
          <TableHead className="hidden text-right sm:table-cell">
            {t('geography.table.conversion')}
          </TableHead>
          <TableHead className="pr-6 text-right">{t('geography.table.change')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, i) => (
          <TableRow key={row.code}>
            <TableCell className="pl-6 text-muted-foreground tabular-nums">{i + 1}</TableCell>
            <TableCell>
              <button
                type="button"
                className="text-left hover:underline focus-visible:underline focus-visible:outline-none"
                onClick={() => onOpen(row.code)}
              >
                <CountryLabel code={row.code} name={countryName(row.code)} />
              </button>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <ShareBar share={(row.sessions / total) * 100} max={topShare} />
            </TableCell>
            <TableCell className="text-right tabular-nums">{integer(row.sessions)}</TableCell>
            <TableCell className="hidden text-right tabular-nums lg:table-cell">
              {integer(row.users)}
            </TableCell>
            <TableCell className="hidden text-right tabular-nums sm:table-cell">
              {percent(row.conversionRate, 2)}
            </TableCell>
            <TableCell className="pr-6 text-right">
              <TrendBadge delta={row.delta} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** Where sessions come from: a tile map, regional split and a ranked country table. */
export default function GeographyPage() {
  const { t } = useTranslation('analytics');
  const countryName = useCountryName();
  const { range } = useRangeParams();
  const query = useGeography(range);
  const [region, setRegion] = useState<Region | 'all'>('all');
  const [open, setOpen] = useState<string | null>(null);

  const countries = [...(query.data ?? [])].sort((a, b) => b.sessions - a.sessions);
  const rows = countries.filter((c) => region === 'all' || c.region === region);
  const total = sum(countries, (c) => c.sessions);
  const top = countries[0];

  return (
    <Page
      width="full"
      title={t('geography.title')}
      description={t('geography.description')}
      actions={<RangeControl />}
    >
      {query.isError && !query.data ? (
        <QueryError onRetry={() => void query.refetch()} />
      ) : !query.data ? (
        <div className="space-y-6">
          <Skeleton className="h-28 rounded-xl" />
          <div className="grid gap-6 xl:grid-cols-3">
            <Skeleton className="h-96 rounded-xl xl:col-span-2" />
            <Skeleton className="h-96 rounded-xl" />
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      ) : !top ? (
        <EmptyState
          icon={Globe2}
          title={t('geography.empty.title')}
          description={t('geography.empty.description')}
        />
      ) : (
        <div className="space-y-6">
          <section className="rounded-xl border bg-card px-6 py-2 shadow-xs">
            <StatStrip
              items={[
                { key: 'sessions', label: t('geography.kpis.sessions'), value: compact(total) },
                { key: 'countries', label: t('geography.kpis.countries'), value: countries.length },
                {
                  key: 'top',
                  label: t('geography.kpis.top'),
                  value: countryName(top.code),
                  hint: percent((top.sessions / total) * 100),
                },
                {
                  key: 'conversion',
                  label: t('geography.kpis.conversion'),
                  value: percent(sum(countries, (c) => c.sessions * c.conversionRate) / total, 2),
                },
              ]}
            />
          </section>
          <div className="grid gap-6 xl:grid-cols-3">
            <SectionCard
              className="xl:col-span-2"
              title={t('geography.map.title')}
              description={t('geography.map.description')}
            >
              <TileMap countries={countries} region={region} selected={open} onSelect={setOpen} />
            </SectionCard>
            <SectionCard
              title={t('geography.regions.title')}
              description={t('geography.regions.description')}
              contentClassName="flex items-center"
            >
              <DonutChart
                data={REGIONS.map((key) => ({
                  key,
                  label: t(`geography.regions.${key}`),
                  value: sum(
                    countries.filter((c) => c.region === key),
                    (c) => c.sessions,
                  ),
                }))}
                centerLabel={t('geography.table.sessions')}
                legend="bottom"
                className="w-full"
              />
            </SectionCard>
          </div>
          <SectionCard
            flush
            title={t('geography.table.title')}
            description={t('geography.table.description')}
            action={
              <div className="scrollbar-none max-w-full overflow-x-auto">
                <SegmentedControl
                  size="sm"
                  value={region}
                  onChange={setRegion}
                  aria-label={t('geography.regions.filter')}
                  options={(['all', ...REGIONS] as const).map((value) => ({
                    value,
                    label: t(`geography.regions.${value}`),
                  }))}
                />
              </div>
            }
          >
            {rows.length === 0 ? (
              <EmptyState
                variant="plain"
                icon={Globe2}
                title={t('geography.empty.title')}
                description={t('geography.empty.description')}
              />
            ) : (
              <CountriesTable rows={rows} total={total} onOpen={setOpen} />
            )}
          </SectionCard>
        </div>
      )}
      <CountrySheet code={open} range={range} onClose={() => setOpen(null)} />
    </Page>
  );
}
