import { ChevronRight, Download, Printer } from 'lucide-react';
import { Fragment, useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { notify } from '@/core/notify/notify';
import { useSearchParams } from '@/core/router/router';
import { BarChart } from '@/shared/components/charts/bar-chart';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatStrip } from '@/shared/components/dashboard/stat-strip';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';

import { statementQuery, useStatement } from '../api/erp-api';
import { ErrorPanel } from '../components/error-panel';
import { accounting, moneyCompact, moneyWhole } from '../lib/money';
import type { Statement, StatementKind } from '../model/erp';

const parseKind = (value: string | null): StatementKind =>
  value === 'balance' ? 'balance' : 'pnl';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ request }) => {
    await queryClient.prefetchQuery(
      statementQuery(parseKind(new URL(request.url).searchParams.get('statement'))),
    );
    return null;
  };

/** Sections that are a single computed line (gross profit, net income…) render as emphasized totals. */
const isSubtotal = (section: Statement['sections'][number]) => section.lines.length === 0;

function StatementTable({ statement, caption }: { statement: Statement; caption: string }) {
  const { t } = useTranslation('erp', { keyPrefix: 'reports' });
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const cols = statement.columns.length;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm" aria-label={caption}>
        <thead>
          <tr className="border-y bg-muted/30 text-xs text-muted-foreground">
            <th className="h-11 px-6 text-left font-medium">{t('line')}</th>
            {statement.columns.map((col) => (
              <th key={col} className="w-36 px-3 text-right font-medium last:pr-6">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {statement.sections.map((section) => {
            if (isSubtotal(section)) {
              const key = section.id === 'net' || section.id === 'le' || section.id === 'assets';
              return (
                <tr
                  key={section.id}
                  className={cn('border-b', key ? 'bg-primary/5 text-base' : 'bg-muted/40')}
                >
                  <td className="px-6 py-3 font-semibold">{section.total.label}</td>
                  {section.total.values.map((v, i) => (
                    <td
                      key={i}
                      className={cn(
                        'px-3 py-3 text-right font-semibold tabular-nums last:pr-6',
                        v < 0 && 'text-destructive',
                      )}
                    >
                      {accounting(v)}
                    </td>
                  ))}
                </tr>
              );
            }
            const open = !collapsed.has(section.id);
            return (
              <Fragment key={section.id}>
                <tr className="border-b">
                  <td className="px-6 py-2.5" colSpan={open ? cols + 1 : 1}>
                    <button
                      type="button"
                      onClick={() => toggle(section.id)}
                      aria-expanded={open}
                      className="-ml-1 inline-flex items-center gap-1.5 font-semibold"
                    >
                      <ChevronRight
                        className={cn(
                          'size-4 text-muted-foreground transition-transform',
                          open && 'rotate-90',
                        )}
                      />
                      {section.label}
                    </button>
                  </td>
                  {!open &&
                    section.total.values.map((v, i) => (
                      <td
                        key={i}
                        className="px-3 py-2.5 text-right font-medium tabular-nums last:pr-6"
                      >
                        {accounting(v)}
                      </td>
                    ))}
                </tr>
                {open &&
                  section.lines.map((line) => (
                    <tr key={line.label} className="border-b border-dashed hover:bg-muted/30">
                      <td className="py-2 pr-3 pl-12 text-foreground/90">{line.label}</td>
                      {line.values.map((v, i) => (
                        <td
                          key={i}
                          className={cn(
                            'px-3 py-2 text-right tabular-nums last:pr-6',
                            v < 0 && 'text-destructive',
                          )}
                        >
                          {accounting(v)}
                        </td>
                      ))}
                    </tr>
                  ))}
                {open && (
                  <tr className="border-b">
                    <td className="py-2.5 pr-3 pl-12 font-medium">{section.total.label}</td>
                    {section.total.values.map((v, i) => (
                      <td
                        key={i}
                        className="border-t px-3 py-2.5 text-right font-medium tabular-nums last:pr-6"
                      >
                        {accounting(v)}
                      </td>
                    ))}
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Profit & loss and balance sheet with collapsible sections and period columns. */
export default function ReportsPage() {
  const { t } = useTranslation('erp', { keyPrefix: 'reports' });
  const [params, setParams] = useSearchParams();
  const kind = parseKind(params.get('statement'));
  const statement = useStatement(kind);
  const data = statement.data;

  const pick = (id: string) => data?.sections.find((s) => s.id === id)?.total.values ?? [];
  const revenue = pick('revenue');
  const gross = pick('gross');
  const net = pick('net');
  const ytd = (values: number[]) => values.reduce((s, v) => s + v, 0);
  const margin = (a: number[], b: number[]) => (ytd(b) ? (ytd(a) / ytd(b)) * 100 : 0);

  return (
    <Page
      title={t('title')}
      description={t('description')}
      width="full"
      actions={
        <>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer /> {t('print')}
          </Button>
          <Button variant="outline" onClick={() => notify.success(t('exported'))}>
            <Download /> {t('export')}
          </Button>
        </>
      }
    >
      <Tabs
        value={kind}
        onValueChange={(value) =>
          setParams(value === 'pnl' ? {} : { statement: value }, { replace: true })
        }
      >
        <TabsList>
          <TabsTrigger value="pnl">{t('pnl')}</TabsTrigger>
          <TabsTrigger value="balance">{t('balance')}</TabsTrigger>
        </TabsList>
      </Tabs>

      {kind === 'pnl' && (
        <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <SectionCard contentClassName="flex h-full items-center">
            {data ? (
              <StatStrip
                className="w-full"
                items={[
                  {
                    key: 'revenue',
                    label: t('kpis.revenue'),
                    value: moneyWhole(ytd(revenue)),
                    hint: t('kpis.ytd'),
                  },
                  {
                    key: 'gross',
                    label: t('kpis.grossMargin'),
                    value: `${margin(gross, revenue).toFixed(1)}%`,
                    hint: moneyWhole(ytd(gross)),
                  },
                  {
                    key: 'net',
                    label: t('kpis.netMargin'),
                    value: `${margin(net, revenue).toFixed(1)}%`,
                    hint: moneyWhole(ytd(net)),
                  },
                ]}
              />
            ) : (
              <Skeleton className="h-20 w-full" />
            )}
          </SectionCard>
          <SectionCard title={t('kpis.netByQuarter')} contentClassName="pt-0">
            {data ? (
              <BarChart
                className="h-28"
                data={data.columns.map((col, i) => ({
                  quarter: col.split(' ')[0]!,
                  net: net[i] ?? 0,
                }))}
                xKey="quarter"
                series={[{ key: 'net', label: t('kpis.netIncome') }]}
                highlight="last"
                hideYAxis
                hideGrid
                barSize={36}
                valueFormatter={moneyCompact}
              />
            ) : (
              <Skeleton className="h-28 w-full" />
            )}
          </SectionCard>
        </div>
      )}

      <SectionCard
        flush
        title={kind === 'pnl' ? t('pnlTitle') : t('balanceTitle')}
        description={kind === 'pnl' ? t('pnlDescription') : t('balanceDescription')}
      >
        {statement.isError ? (
          <ErrorPanel className="m-6" onRetry={() => void statement.refetch()} />
        ) : !data ? (
          <div className="space-y-2 px-6 pb-6">
            {Array.from({ length: 12 }, (_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : (
          <StatementTable
            key={kind}
            statement={data}
            caption={kind === 'pnl' ? t('pnlTitle') : t('balanceTitle')}
          />
        )}
      </SectionCard>
    </Page>
  );
}
