import { MonitorSmartphone } from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { BarChart } from '@/shared/components/charts/bar-chart';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { TrendBadge } from '@/shared/components/dashboard/trend-badge';
import { EmptyState } from '@/shared/components/display/empty-state';
import { SegmentedControl } from '@/shared/components/forms/segmented-control';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { duration, integer, percent } from '../lib/format';
import { sessionRate } from '../lib/stats';
import { TECH_DIMENSIONS, type TechDimension, type Technology } from '../model/insights';

import { ShareBar } from './share-bar';

/** Conversion rate of every segment of one dimension, compared with the site average. */
export function SegmentsCard({
  technology,
  label,
}: {
  technology: Technology;
  label: (dimension: TechDimension, name: string) => string;
}) {
  const { t } = useTranslation('analytics');
  const [dimension, setDimension] = useState<TechDimension>('categories');
  const segments = technology[dimension];
  const sessions = segments.reduce((sum, s) => sum + s.sessions, 0);
  const average = sessionRate({
    sessions,
    conversions: segments.reduce((sum, s) => sum + s.conversions, 0),
  });
  const rows = segments.map((s) => ({
    ...s,
    label: label(dimension, s.name),
    rate: sessionRate(s),
  }));

  return (
    <SectionCard
      flush
      title={t('technology.segments.title')}
      description={t('technology.segments.description', { average: percent(average, 2) })}
      action={
        <div className="scrollbar-none max-w-full overflow-x-auto">
          <SegmentedControl
            size="sm"
            value={dimension}
            onChange={setDimension}
            aria-label={t('technology.segments.dimension')}
            options={TECH_DIMENSIONS.map((value) => ({
              value,
              label: t(`technology.dimensions.${value}`),
            }))}
          />
        </div>
      }
    >
      {rows.length === 0 ? (
        <EmptyState
          variant="plain"
          icon={MonitorSmartphone}
          title={t('technology.empty.title')}
          description={t('technology.empty.description')}
        />
      ) : (
        <div className="grid xl:grid-cols-5">
          <div className="border-b p-6 xl:col-span-2 xl:border-r xl:border-b-0">
            <BarChart
              data={rows}
              xKey="label"
              horizontal
              series={[{ key: 'rate', label: t('technology.segments.rate') }]}
              valueFormatter={(v) => percent(v, 2)}
              className="h-72"
            />
          </div>
          <div className="xl:col-span-3">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">{t('technology.segments.segment')}</TableHead>
                  <TableHead className="hidden w-[30%] md:table-cell">
                    {t('technology.segments.share')}
                  </TableHead>
                  <TableHead className="text-right">{t('technology.segments.sessions')}</TableHead>
                  <TableHead className="hidden text-right lg:table-cell">
                    {t('technology.segments.duration')}
                  </TableHead>
                  <TableHead className="text-right">{t('technology.segments.rate')}</TableHead>
                  <TableHead className="hidden pr-6 text-right sm:table-cell">
                    {t('technology.segments.vsAverage')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.name}>
                    <TableCell className="pl-6 font-medium">{row.label}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <ShareBar
                        share={(row.sessions / sessions) * 100}
                        max={(rows[0]!.sessions / sessions) * 100}
                      />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {integer(row.sessions)}
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums lg:table-cell">
                      {duration(row.avgSessionSec)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {percent(row.rate, 2)}
                    </TableCell>
                    <TableCell className="hidden pr-6 text-right sm:table-cell">
                      <TrendBadge delta={((row.rate - average) / average) * 100} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </SectionCard>
  );
}
