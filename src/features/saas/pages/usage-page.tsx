import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { useSearchParams } from '@/core/router/router';
import { BarChart } from '@/shared/components/charts/bar-chart';
import { Sparkline } from '@/shared/components/charts/sparkline';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { ErrorState } from '@/shared/components/display/error-state';
import { SegmentedControl } from '@/shared/components/forms/segmented-control';
import { cn } from '@/shared/lib/cn';
import { formatDate } from '@/shared/lib/format';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { usageQuery, useUsage } from '../api/platform-api';
import { MethodTag } from '../components/method-tag';
import { USAGE_RANGES, type UsageRange } from '../model/platform';

const parseRange = (value: string | null): UsageRange =>
  (USAGE_RANGES as readonly string[]).includes(value ?? '') ? (value as UsageRange) : '14d';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ request }) => {
    await queryClient.prefetchQuery(
      usageQuery(parseRange(new URL(request.url).searchParams.get('range'))),
    );
    return null;
  };

const compact = (n: number, locale: string) =>
  new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(n);

/** Request volume against the plan quota, by day and by endpoint. */
export default function UsagePage() {
  const { t, i18n } = useTranslation('saas');
  const [params, setParams] = useSearchParams();
  const range = parseRange(params.get('range'));
  const usage = useUsage(range);
  const data = usage.data;
  const n = (v: number) => compact(v, i18n.language);

  const pct = data ? (data.totals.calls / data.totals.quota) * 100 : 0;
  const daily = data ? data.totals.calls / data.byDay.length : 0;
  const projected = Math.min(100, ((daily * 30) / (data?.totals.quota ?? 1)) * 100);

  return (
    <Page
      width="full"
      title={t('usage.title')}
      description={t('usage.description')}
      actions={
        <SegmentedControl
          value={range}
          onChange={(value) => setParams({ range: value }, { replace: true })}
          options={USAGE_RANGES.map((value) => ({ value, label: t(`usage.ranges.${value}`) }))}
        />
      }
    >
      {usage.isError ? (
        <ErrorState title={t('common.error')} onRetry={() => void usage.refetch()} />
      ) : !data ? (
        <div className="space-y-6">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      ) : (
        <div className={cn('space-y-6', usage.isPlaceholderData && 'opacity-70')}>
          <section className="grid overflow-hidden rounded-xl border bg-card shadow-xs lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div className="space-y-3 p-6">
              <p className="text-sm text-muted-foreground">{t('usage.quota')}</p>
              <p className="text-3xl font-semibold tracking-tight tabular-nums">
                {n(data.totals.calls)}
                <span className="text-base font-normal text-muted-foreground">
                  {' '}
                  / {n(data.totals.quota)}
                </span>
              </p>
              <div className="relative h-2.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-primary/25"
                  style={{ width: `${projected}%` }}
                />
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-primary"
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {t('usage.projection', { used: pct.toFixed(0), projected: projected.toFixed(0) })}
              </p>
            </div>
            {[
              {
                label: t('usage.errors'),
                value: n(data.totals.errors),
                hint: t('usage.errorsHint', {
                  rate: ((data.totals.errors / data.totals.calls) * 100).toFixed(2),
                }),
              },
              {
                label: t('usage.latency'),
                value: `${data.totals.p95} ms`,
                hint: t('usage.latencyHint'),
              },
              {
                label: t('usage.topEndpoint'),
                value: data.endpoints[0]?.path ?? '—',
                hint: t('usage.calls', { value: n(data.endpoints[0]?.calls ?? 0) }),
                mono: true,
              },
            ].map((stat) => (
              <div key={stat.label} className="space-y-1.5 border-t p-6 lg:border-t-0 lg:border-l">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p
                  className={cn(
                    'truncate text-2xl font-semibold tracking-tight tabular-nums',
                    stat.mono && 'font-mono text-lg',
                  )}
                >
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground">{stat.hint}</p>
              </div>
            ))}
          </section>

          <SectionCard title={t('usage.daily')} description={t('usage.dailyHint')}>
            <BarChart
              className="h-72"
              mode="stacked"
              xKey="label"
              data={data.byDay.map((d) => ({ ...d, label: formatDate(d.day, 'MMM D') }))}
              series={[
                { key: 'read', label: t('usage.kinds.read') },
                { key: 'write', label: t('usage.kinds.write') },
                { key: 'admin', label: t('usage.kinds.admin') },
              ]}
              barSize={22}
              valueFormatter={n}
            />
          </SectionCard>

          <SectionCard title={t('usage.endpoints')} description={t('usage.endpointsHint')} flush>
            <div className="overflow-x-auto border-t">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">{t('usage.col.endpoint')}</TableHead>
                    <TableHead className="text-right">{t('usage.col.calls')}</TableHead>
                    <TableHead className="hidden text-right md:table-cell">p50</TableHead>
                    <TableHead className="text-right">p95</TableHead>
                    <TableHead className="text-right">{t('usage.col.errors')}</TableHead>
                    <TableHead className="hidden pr-6 lg:table-cell">
                      {t('usage.col.trend')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.endpoints.map((e) => (
                    <TableRow key={`${e.method} ${e.path}`}>
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-2.5">
                          <MethodTag method={e.method} />
                          <code className="font-mono text-xs">{e.path}</code>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {n(e.calls)}
                      </TableCell>
                      <TableCell className="hidden text-right text-muted-foreground tabular-nums md:table-cell">
                        {e.p50} ms
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{e.p95} ms</TableCell>
                      <TableCell
                        className={cn(
                          'text-right tabular-nums',
                          e.errorRate >= 1
                            ? 'font-medium text-destructive'
                            : 'text-muted-foreground',
                        )}
                      >
                        {e.errorRate.toFixed(2)}%
                      </TableCell>
                      <TableCell className="hidden pr-6 lg:table-cell">
                        <Sparkline data={e.trend} variant="line" className="h-7 w-28" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </SectionCard>
        </div>
      )}
    </Page>
  );
}
