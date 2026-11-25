import { ArrowLeft, BadgeCheck } from 'lucide-react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { Link, useParams } from '@/core/router/router';
import { DonutChart } from '@/shared/components/charts/donut-chart';
import { MeterList } from '@/shared/components/dashboard/meter-list';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatStrip } from '@/shared/components/dashboard/stat-strip';
import { StatusBadge } from '@/shared/components/display/status-badge';
import { UserCell } from '@/shared/components/display/user-cell';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { payRunQuery, useApprovePayRun, usePayRun } from '../api/hr-api';
import { WidgetError } from '../components/widget-error';
import { compact, longDate, money, monthLabel } from '../lib/format';
import { PAY_STATUS_TONE } from '../model/hr';
import { hrRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ params }) => {
    await queryClient.prefetchQuery(payRunQuery(params.runId!));
    return null;
  };

export default function PayRunPage() {
  const { t, i18n } = useTranslation('hr');
  const { runId = '' } = useParams();
  const detail = usePayRun(runId);
  const approve = useApprovePayRun();
  const data = detail.data;
  const run = data?.run;

  if (detail.isError) {
    return (
      <Page width="full" title={t('common.notFound')}>
        <WidgetError onRetry={() => void detail.refetch()} />
      </Page>
    );
  }

  return (
    <Page
      width="full"
      title={run ? t('payRun.title', { period: monthLabel(run.period, i18n.language) }) : '…'}
      description={
        run
          ? t('payRun.description', { date: longDate(run.payDate), count: run.employees })
          : undefined
      }
      actions={
        <>
          <Button variant="outline" asChild>
            <Link to={hrRoutes.payroll.href()}>
              <ArrowLeft /> {t('payRun.back')}
            </Link>
          </Button>
          {run?.status === 'pendingApproval' && (
            <Button disabled={approve.isPending} onClick={() => approve.mutate(run.id)}>
              <BadgeCheck /> {t('payroll.approve')}
            </Button>
          )}
        </>
      }
    >
      <section className="rounded-xl border bg-card px-6 py-3 shadow-xs">
        {run ? (
          <div className="flex flex-wrap items-center gap-4">
            <StatStrip
              className="flex-1"
              items={[
                { key: 'gross', label: t('payRun.gross'), value: money(run.gross, 0) },
                { key: 'taxes', label: t('payRun.taxes'), value: money(run.taxes, 0) },
                {
                  key: 'deductions',
                  label: t('payRun.deductions'),
                  value: money(run.deductions, 0),
                },
                { key: 'net', label: t('payRun.net'), value: money(run.net, 0) },
              ]}
            />
            <StatusBadge
              status={run.status}
              label={t(`payroll.status.${run.status}`)}
              tone={PAY_STATUS_TONE[run.status]}
            />
          </div>
        ) : (
          <Skeleton className="my-3 h-16" />
        )}
      </section>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        <SectionCard title={t('payRun.byDepartment')}>
          {data ? (
            <DonutChart
              valueFormatter={(v) => compact(v)}
              centerLabel={t('payRun.gross')}
              data={[...data.departments]
                .sort((a, b) => b.gross - a.gross)
                .slice(0, 4)
                .concat({
                  department: 'Other',
                  employees: 0,
                  gross: [...data.departments]
                    .sort((a, b) => b.gross - a.gross)
                    .slice(4)
                    .reduce((s, d) => s + d.gross, 0),
                  net: 0,
                  color: 0,
                })
                .map((d) => ({
                  key: d.department.toLowerCase(),
                  label: d.department,
                  value: d.gross,
                }))}
            />
          ) : (
            <Skeleton className="h-56" />
          )}
        </SectionCard>
        <SectionCard title={t('payRun.components.title')}>
          {data ? (
            <MeterList
              items={data.components.map((c) => ({
                key: c.key,
                label: t(`payRun.components.${c.key}`),
                value: c.amount,
                max: data.run.gross,
                display: money(c.amount, 0),
              }))}
            />
          ) : (
            <Skeleton className="h-56" />
          )}
        </SectionCard>
      </div>

      <SectionCard title={t('payRun.lines')} flush>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">{t('payRun.employee')}</TableHead>
              <TableHead className="text-right">{t('payRun.gross')}</TableHead>
              <TableHead className="text-right">{t('payRun.taxes')}</TableHead>
              <TableHead className="pr-6 text-right">{t('payRun.net')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.lines.map((line) => (
              <TableRow key={line.id}>
                <TableCell className="pl-6">
                  <UserCell name={line.name} secondary={line.title} />
                </TableCell>
                <TableCell className="text-right tabular-nums">{money(line.gross, 0)}</TableCell>
                <TableCell className="text-right text-muted-foreground tabular-nums">
                  {money(line.taxes, 0)}
                </TableCell>
                <TableCell className="pr-6 text-right font-medium tabular-nums">
                  {money(line.net, 0)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>
    </Page>
  );
}
