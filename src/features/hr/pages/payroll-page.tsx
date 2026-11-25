import { ArrowRight, BadgeCheck, CalendarClock, Landmark, Wallet } from 'lucide-react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { Link, useNavigate } from '@/core/router/router';
import { AreaChart } from '@/shared/components/charts/area-chart';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatCard } from '@/shared/components/dashboard/stat-card';
import { StatusBadge } from '@/shared/components/display/status-badge';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { payrollQuery, useApprovePayRun, usePayroll } from '../api/hr-api';
import { WidgetError } from '../components/widget-error';
import { compact, longDate, money, monthLabel } from '../lib/format';
import { PAY_STATUS_TONE } from '../model/hr';
import { hrRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(payrollQuery());
    return null;
  };

export default function PayrollPage() {
  const { t, i18n } = useTranslation('hr');
  const navigate = useNavigate();
  const payroll = usePayroll();
  const approve = useApprovePayRun();
  const runs = payroll.data ?? [];
  const next =
    runs.find((r) => r.status === 'pendingApproval') ?? runs.find((r) => r.status === 'draft');
  const year = new Date().getFullYear().toString();
  const ytd = runs.filter((r) => r.period.startsWith(year) && r.status === 'paid');
  const ytdGross = ytd.reduce((s, r) => s + r.gross, 0);
  const avgNet = ytd.length ? ytd[0]!.net / ytd[0]!.employees : 0;
  const trend = [...runs]
    .filter((r) => r.status === 'paid')
    .reverse()
    .map((r) => ({
      month: new Date(`${r.period}-01T00:00:00Z`).toLocaleDateString(i18n.language, {
        month: 'short',
        timeZone: 'UTC',
      }),
      gross: r.gross,
      net: r.net,
    }));

  if (payroll.isError) {
    return (
      <Page width="full" title={t('payroll.title')}>
        <WidgetError onRetry={() => void payroll.refetch()} />
      </Page>
    );
  }

  return (
    <Page width="full" title={t('payroll.title')} description={t('payroll.description')}>
      <div className="grid gap-4 md:gap-6 lg:grid-cols-12">
        <section className="flex flex-col justify-between gap-6 rounded-xl border bg-card p-6 shadow-xs lg:col-span-5">
          {next ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{t('payroll.next')}</p>
                  <p className="text-xl font-semibold">{monthLabel(next.period, i18n.language)}</p>
                  <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CalendarClock className="size-4" aria-hidden />
                    {t('payroll.payDate', { date: longDate(next.payDate) })}
                  </p>
                </div>
                <StatusBadge
                  status={next.status}
                  label={t(`payroll.status.${next.status}`)}
                  tone={PAY_STATUS_TONE[next.status]}
                />
              </div>
              <dl className="grid grid-cols-3 gap-4 rounded-lg bg-muted/60 p-4">
                {(['gross', 'taxes', 'net'] as const).map((key) => (
                  <div key={key}>
                    <dt className="text-xs text-muted-foreground">{t(`payroll.columns.${key}`)}</dt>
                    <dd className="mt-1 text-base font-semibold tabular-nums">
                      {compact(next[key])}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={next.status !== 'pendingApproval' || approve.isPending}
                  onClick={() => approve.mutate(next.id)}
                >
                  <BadgeCheck /> {t('payroll.approve')}
                </Button>
                <Button variant="outline" asChild>
                  <Link to={hrRoutes.payRun.href({ runId: next.id })}>
                    {t('payroll.view')} <ArrowRight />
                  </Link>
                </Button>
              </div>
            </>
          ) : (
            <Skeleton className="h-52" />
          )}
        </section>
        <div className="grid gap-4 sm:grid-cols-2 md:gap-6 lg:col-span-7">
          <StatCard
            icon={Landmark}
            label={t('payroll.ytdGross')}
            value={payroll.data ? money(ytdGross, 0) : '—'}
            delta={6.1}
            loading={!payroll.data}
          />
          <StatCard
            icon={Wallet}
            color="var(--chart-2)"
            label={t('payroll.avgNet')}
            value={payroll.data ? money(avgNet, 0) : '—'}
            delta={2.3}
            loading={!payroll.data}
          />
          <SectionCard className="sm:col-span-2" contentClassName="pt-0">
            {payroll.data ? (
              <AreaChart
                data={trend}
                xKey="month"
                className="h-44"
                valueFormatter={(v) => compact(v)}
                series={[
                  { key: 'gross', label: t('payroll.columns.gross') },
                  { key: 'net', label: t('payroll.columns.net'), color: 'var(--chart-2)' },
                ]}
              />
            ) : (
              <Skeleton className="h-44" />
            )}
          </SectionCard>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">{t('payroll.columns.period')}</TableHead>
              <TableHead>{t('payroll.columns.payDate')}</TableHead>
              <TableHead className="text-right">{t('payroll.columns.employees')}</TableHead>
              <TableHead className="text-right">{t('payroll.columns.gross')}</TableHead>
              <TableHead className="hidden text-right md:table-cell">
                {t('payroll.columns.taxes')}
              </TableHead>
              <TableHead className="text-right">{t('payroll.columns.net')}</TableHead>
              <TableHead className="pr-6">{t('payroll.columns.status')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runs.map((run) => (
              <TableRow
                key={run.id}
                className="cursor-pointer"
                onClick={() => void navigate(hrRoutes.payRun.href({ runId: run.id }))}
              >
                <TableCell className="pl-6 font-medium">
                  {monthLabel(run.period, i18n.language)}
                </TableCell>
                <TableCell className="text-muted-foreground tabular-nums">
                  {longDate(run.payDate)}
                </TableCell>
                <TableCell className="text-right tabular-nums">{run.employees}</TableCell>
                <TableCell className="text-right tabular-nums">{money(run.gross, 0)}</TableCell>
                <TableCell className="hidden text-right text-muted-foreground tabular-nums md:table-cell">
                  {money(run.taxes, 0)}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {money(run.net, 0)}
                </TableCell>
                <TableCell className="pr-6">
                  <StatusBadge
                    status={run.status}
                    label={t(`payroll.status.${run.status}`)}
                    tone={PAY_STATUS_TONE[run.status]}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Page>
  );
}
