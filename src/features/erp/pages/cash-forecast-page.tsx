import { Landmark, ShieldAlert, TrendingDown, TrendingUp } from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { useSearchParams } from '@/core/router/router';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatCard } from '@/shared/components/dashboard/stat-card';
import { StatusBadge } from '@/shared/components/display/status-badge';
import type { Tone } from '@/shared/components/display/tone';
import { SegmentedControl } from '@/shared/components/forms/segmented-control';
import { cn } from '@/shared/lib/cn';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { ErrorPanel } from '../components/error-panel';
import { EmptyRow, TableSkeleton } from '../components/table-states';
import { money, moneyCompact, shortDate } from '../lib/money';
import { StatusTabs } from '../operations/components/status-tabs';
import { cashForecastQuery, useCashForecast } from '../treasury/api/treasury-api';
import { ForecastCharts } from '../treasury/components/forecast-charts';
import {
  FLOW_KINDS,
  SCENARIOS,
  type FlowKind,
  type ForecastItem,
  type Scenario,
} from '../treasury/model/forecast';

const scenarioOf = (params: URLSearchParams): Scenario =>
  SCENARIOS.find((s) => s === params.get('scenario')) ?? 'base';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ request }) => {
    await queryClient.prefetchQuery(
      cashForecastQuery(scenarioOf(new URL(request.url).searchParams)),
    );
    return null;
  };

const CONFIDENCE_TONE: Record<ForecastItem['confidence'], Tone> = {
  committed: 'success',
  expected: 'info',
  estimated: 'warning',
};

/** 13-week cash forecast: weekly flows, running balance and the items behind them. */
export default function CashForecastPage() {
  const { t } = useTranslation('erp', { keyPrefix: 'cashForecast' });
  const [params, setParams] = useSearchParams();
  const scenario = scenarioOf(params);
  const forecast = useCashForecast(scenario);
  const [kind, setKind] = useState<'all' | FlowKind>('all');
  const data = forecast.data;
  const weeks = data?.weeks ?? [];
  const opening = weeks[0]?.opening ?? 0;
  const closing = weeks.at(-1)?.closing ?? 0;
  const low = [...weeks].sort((a, b) => a.closing - b.closing)[0];
  const items = (data?.items ?? []).filter((i) => kind === 'all' || i.kind === kind);
  const total = (k: FlowKind) =>
    data?.items.filter((i) => i.kind === k).reduce((s, i) => s + i.amount, 0) ?? 0;

  const kpis = [
    {
      key: 'opening',
      icon: Landmark,
      color: 'var(--chart-1)',
      value: opening,
      hint: weeks[0] && t('kpis.openingHint', { date: shortDate(weeks[0].start) }),
    },
    {
      key: 'closing',
      icon: closing >= opening ? TrendingUp : TrendingDown,
      color: closing >= opening ? 'var(--success)' : 'var(--destructive)',
      value: closing,
      hint: t('kpis.net', { amount: moneyCompact(closing - opening) }),
    },
    {
      key: 'low',
      icon: ShieldAlert,
      color:
        low && data && low.closing < data.minimumCash ? 'var(--destructive)' : 'var(--warning)',
      value: low?.closing ?? 0,
      hint: low && t('kpis.lowHint', { date: shortDate(low.start) }),
    },
  ] as const;

  const scenarioControl = (
    <SegmentedControl
      aria-label={t('scenario.label')}
      value={scenario}
      onChange={(next) => setParams(next === 'base' ? {} : { scenario: next }, { replace: true })}
      options={SCENARIOS.map((s) => ({ value: s, label: t(`scenario.${s}`) }))}
    />
  );

  if (forecast.isError) {
    return (
      <Page title={t('title')} width="full">
        <ErrorPanel onRetry={() => void forecast.refetch()} />
      </Page>
    );
  }

  return (
    <Page title={t('title')} description={t('description')} width="full" actions={scenarioControl}>
      <div
        className={cn('space-y-6 transition-opacity', forecast.isPlaceholderData && 'opacity-60')}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          {kpis.map((kpi) => (
            <StatCard
              key={kpi.key}
              variant="tile"
              icon={kpi.icon}
              color={kpi.color}
              label={t(`kpis.${kpi.key}`)}
              value={moneyCompact(kpi.value)}
              hint={kpi.hint}
              loading={!data}
            />
          ))}
        </div>

        <ForecastCharts forecast={data} />

        <SectionCard
          flush
          title={t('items.title')}
          description={t('items.description')}
          action={
            <StatusTabs
              label={t('items.filter')}
              value={kind}
              onChange={setKind}
              tabs={[
                { value: 'all', label: t('items.all') },
                ...FLOW_KINDS.map((k) => ({
                  value: k,
                  label: `${t(`items.${k}`)} · ${moneyCompact(total(k))}`,
                })),
              ]}
            />
          }
        >
          {!data ? (
            <TableSkeleton />
          ) : (
            <div className="border-t">
              <Table aria-label={t('items.title')}>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">{t('columns.date')}</TableHead>
                    <TableHead>{t('columns.item')}</TableHead>
                    <TableHead className="hidden md:table-cell">
                      {t('columns.confidence')}
                    </TableHead>
                    <TableHead className="pr-6 text-right">{t('columns.amount')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="pl-6">
                        <p className="whitespace-nowrap">{shortDate(item.date)}</p>
                        <p className="text-xs text-muted-foreground">
                          {t('charts.week', { n: item.week })}
                        </p>
                      </TableCell>
                      <TableCell className="whitespace-normal">
                        <p className="font-medium">{item.counterparty}</p>
                        <p className="text-xs text-muted-foreground">
                          {t(`categories.${item.category}`)}
                        </p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <StatusBadge
                          status={item.confidence}
                          tone={CONFIDENCE_TONE[item.confidence]}
                          label={t(`confidence.${item.confidence}`)}
                        />
                      </TableCell>
                      <TableCell
                        className={cn(
                          'pr-6 text-right font-medium tabular-nums',
                          item.kind === 'inflow' ? 'text-success' : 'text-destructive',
                        )}
                      >
                        {money(item.kind === 'inflow' ? item.amount : -item.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {items.length === 0 && <EmptyRow colSpan={4}>{t('items.empty')}</EmptyRow>}
                </TableBody>
              </Table>
            </div>
          )}
        </SectionCard>
      </div>
    </Page>
  );
}
