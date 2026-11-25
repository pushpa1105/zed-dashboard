import { CalendarDays } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { AreaChart } from '@/shared/components/charts/area-chart';
import { StatStrip } from '@/shared/components/dashboard/stat-strip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Skeleton } from '@/shared/ui/skeleton';

import { shortDate } from '../lib/format';
import { HR_COMPARE, HR_RANGES, type HrFilters, type HrOverview } from '../model/overview';

type ReportCardProps = {
  data?: HrOverview;
  filters: HrFilters;
  onFiltersChange: (filters: HrFilters) => void;
};

/** Signed count chip ("+4"): absolute change, not a percentage. */
function Change({ value }: { value: number }) {
  return (
    <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
      {value > 0 ? '+' : ''}
      {value}
    </span>
  );
}

/** Image 11's centerpiece: filter row, four KPIs, one large trend chart. */
export function ReportSection({ data, filters, onFiltersChange }: ReportCardProps) {
  const { t } = useTranslation('hr');
  const stats = data?.stats;
  const keys = ['newCandidates', 'applications', 'totalCandidates', 'employees'] as const;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{t('report.title')}</h2>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Select
            value={filters.range}
            onValueChange={(range) =>
              onFiltersChange({ ...filters, range: range as HrFilters['range'] })
            }
          >
            <SelectTrigger className="bg-card" aria-label={t('report.range.label')}>
              <CalendarDays className="text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {HR_RANGES.map((range) => (
                <SelectItem key={range} value={range}>
                  {t(`report.range.${range}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-muted-foreground">{t('report.comparedTo')}</span>
          <Select
            value={filters.compare}
            onValueChange={(compare) =>
              onFiltersChange({ ...filters, compare: compare as HrFilters['compare'] })
            }
          >
            <SelectTrigger className="bg-card" aria-label={t('report.comparedTo')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {HR_COMPARE.map((compare) => (
                <SelectItem key={compare} value={compare}>
                  {t(`report.compare.${compare}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-xs">
        {stats ? (
          <StatStrip
            className="mb-4"
            items={keys.map((key, i) => ({
              key,
              label: (
                <span className="flex items-center gap-2">
                  {t(`report.stats.${key}`)} <Change value={stats[key].change} />
                </span>
              ),
              value: stats[key].value.toLocaleString(),
              hint: i < 2 ? t('report.inRange') : t('report.entirePeriod'),
            }))}
          />
        ) : (
          <Skeleton className="mb-4 h-20 w-full" />
        )}
        {data ? (
          <AreaChart
            className="h-80"
            data={data.series.map((d) => ({ ...d, label: shortDate(d.date) }))}
            xKey="label"
            series={[
              { key: 'current', label: t('report.current'), color: 'var(--chart-1)' },
              { key: 'previous', label: t('report.previous'), color: 'var(--chart-2)' },
            ]}
          />
        ) : (
          <Skeleton className="h-80 w-full" />
        )}
      </div>
    </section>
  );
}
