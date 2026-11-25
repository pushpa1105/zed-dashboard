import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { BarChart } from '@/shared/components/charts/bar-chart';
import { Gauge } from '@/shared/components/charts/gauge';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { TrendBadge } from '@/shared/components/dashboard/trend-badge';
import { cn } from '@/shared/lib/cn';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Skeleton } from '@/shared/ui/skeleton';

import { budgetsQuery, useBudgets } from '../api/erp-api';
import { ErrorPanel } from '../components/error-panel';
import { moneyCompact, moneyWhole } from '../lib/money';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(budgetsQuery(4));
    return null;
  };

/**
 * Budget vs actual by department: a burn gauge, a comparison chart and a
 * variance list where overspend is called out with sign, color and label.
 */
export default function BudgetsPage() {
  const { t } = useTranslation('erp', { keyPrefix: 'budgets' });
  const [quarter, setQuarter] = useState(4);
  const budgets = useBudgets(quarter);
  const departments = budgets.data?.departments ?? [];

  const totalBudget = departments.reduce((s, d) => s + d.budget, 0);
  const totalActual = departments.reduce((s, d) => s + d.actual, 0);
  const used = totalBudget ? (totalActual / totalBudget) * 100 : 0;
  const ytdBudget = departments.reduce((s, d) => s + d.ytdBudget, 0);
  const ytdActual = departments.reduce((s, d) => s + d.ytdActual, 0);

  return (
    <Page
      title={t('title')}
      description={t('description')}
      width="full"
      actions={
        <Select value={String(quarter)} onValueChange={(v) => setQuarter(Number(v))}>
          <SelectTrigger className="w-40" aria-label={t('quarter')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {[1, 2, 3, 4].map((q) => (
              <SelectItem key={q} value={String(q)}>
                {t('quarterOption', { quarter: q })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      {budgets.isError ? (
        <ErrorPanel onRetry={() => void budgets.refetch()} />
      ) : (
        <>
          <div
            className={cn(
              'grid gap-6 lg:grid-cols-[20rem_1fr]',
              budgets.isPlaceholderData && 'opacity-60',
            )}
          >
            <SectionCard title={t('burn.title')} description={t('burn.description', { quarter })}>
              {budgets.data ? (
                <div className="space-y-5">
                  <Gauge
                    value={Math.round(used)}
                    label={t('burn.used')}
                    color={used > 100 ? 'var(--destructive)' : 'var(--primary)'}
                  />
                  <dl className="grid grid-cols-2 gap-4 border-t pt-4 text-sm">
                    <div>
                      <dt className="text-xs text-muted-foreground">{t('burn.spent')}</dt>
                      <dd className="font-semibold tabular-nums">{moneyWhole(totalActual)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">{t('burn.budget')}</dt>
                      <dd className="font-semibold tabular-nums">{moneyWhole(totalBudget)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">{t('burn.ytdSpent')}</dt>
                      <dd className="font-semibold tabular-nums">{moneyCompact(ytdActual)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">{t('burn.ytdBudget')}</dt>
                      <dd className="font-semibold tabular-nums">{moneyCompact(ytdBudget)}</dd>
                    </div>
                  </dl>
                </div>
              ) : (
                <Skeleton className="h-72 w-full" />
              )}
            </SectionCard>
            <SectionCard title={t('chart.title')} description={t('chart.description')}>
              {budgets.data ? (
                <BarChart
                  className="h-full min-h-80"
                  data={departments.map((d) => ({
                    name: d.name,
                    budget: d.budget,
                    actual: d.actual,
                  }))}
                  xKey="name"
                  horizontal
                  barSize={14}
                  series={[
                    { key: 'budget', label: t('chart.budget'), color: 'var(--chart-4)' },
                    { key: 'actual', label: t('chart.actual'), color: 'var(--chart-1)' },
                  ]}
                  valueFormatter={moneyCompact}
                />
              ) : (
                <Skeleton className="h-80 w-full" />
              )}
            </SectionCard>
          </div>

          <SectionCard flush title={t('variance.title')} description={t('variance.description')}>
            <div className="overflow-x-auto border-t">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="bg-muted/30 text-xs text-muted-foreground">
                    <th className="h-11 px-6 text-left font-medium">{t('variance.department')}</th>
                    <th className="w-[34%] px-3 text-left font-medium">{t('variance.progress')}</th>
                    <th className="px-3 text-right font-medium">{t('chart.budget')}</th>
                    <th className="px-3 text-right font-medium">{t('chart.actual')}</th>
                    <th className="px-6 text-right font-medium">{t('variance.variance')}</th>
                  </tr>
                </thead>
                <tbody>
                  {!budgets.data &&
                    Array.from({ length: 7 }, (_, i) => (
                      <tr key={i}>
                        <td colSpan={5} className="px-6 py-2">
                          <Skeleton className="h-10 w-full" />
                        </td>
                      </tr>
                    ))}
                  {departments.map((d) => {
                    const pct = d.budget ? (d.actual / d.budget) * 100 : 0;
                    const variance = d.budget - d.actual;
                    const over = variance < 0;
                    return (
                      <tr key={d.name} className="border-t">
                        <td className="px-6 py-3.5">
                          <p className="font-medium">{d.name}</p>
                          <p className="text-xs text-muted-foreground">{d.owner}</p>
                        </td>
                        <td className="px-3 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
                              <div
                                className={cn(
                                  'h-full rounded-full',
                                  over ? 'bg-destructive' : 'bg-primary',
                                )}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                            <span
                              className={cn(
                                'w-12 text-right text-xs tabular-nums',
                                over && 'font-medium text-destructive',
                              )}
                            >
                              {Math.round(pct)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3.5 text-right tabular-nums">
                          {moneyWhole(d.budget)}
                        </td>
                        <td className="px-3 py-3.5 text-right tabular-nums">
                          {moneyWhole(d.actual)}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <span
                            className={cn(
                              'font-medium tabular-nums',
                              over ? 'text-destructive' : 'text-success',
                            )}
                          >
                            {over ? '−' : '+'}
                            {moneyWhole(Math.abs(variance))}
                          </span>
                          <div className="mt-0.5 flex justify-end">
                            <TrendBadge
                              delta={d.budget ? (variance / d.budget) * 100 : 0}
                              variant="text"
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </>
      )}
    </Page>
  );
}
