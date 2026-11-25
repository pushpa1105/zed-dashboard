import { FlaskConical } from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { Link } from '@/core/router/router';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatStrip } from '@/shared/components/dashboard/stat-strip';
import { EmptyState } from '@/shared/components/display/empty-state';
import { SegmentedControl } from '@/shared/components/forms/segmented-control';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { experimentsQuery, useExperiments } from '../api/analytics-api';
import { ConfidenceMeter, ExperimentStatusTag, Lift } from '../components/experiment-parts';
import { QueryError } from '../components/query-error';
import { compact, signedPercent } from '../lib/format';
import { bestVariant, SIGNIFICANCE } from '../lib/stats';
import { EXPERIMENT_STATUSES, type ExperimentStatus } from '../model/analytics';
import { analyticsRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(experimentsQuery());
    return null;
  };

/** A/B tests with their status and how the best challenger performs against the control. */
export default function ExperimentsPage() {
  const { t } = useTranslation('analytics');
  const query = useExperiments();
  const [status, setStatus] = useState<'all' | ExperimentStatus>('all');
  const data = query.data;

  const rows = (data ?? []).map((experiment) => ({
    experiment,
    best: experiment.status === 'draft' ? undefined : bestVariant(experiment.variants),
  }));
  const visible = rows.filter((r) => status === 'all' || r.experiment.status === status);
  const winners = rows.filter(
    (r) => r.best && r.best.lift > 0 && r.best.confidence >= SIGNIFICANCE,
  );
  const avgLift = winners.reduce((sum, r) => sum + r.best!.lift, 0) / (winners.length || 1);

  return (
    <Page width="full" title={t('experiments.title')} description={t('experiments.description')}>
      {query.isError && !data ? (
        <QueryError onRetry={() => void query.refetch()} />
      ) : !data ? (
        <Skeleton className="h-[28rem] rounded-xl" />
      ) : (
        <SectionCard flush>
          <StatStrip
            className="border-b px-6"
            items={[
              {
                key: 'running',
                label: t('experiments.kpis.running'),
                value: rows.filter((r) => r.experiment.status === 'running').length,
              },
              { key: 'winners', label: t('experiments.kpis.winners'), value: winners.length },
              {
                key: 'lift',
                label: t('experiments.kpis.avgLift'),
                value: signedPercent(avgLift),
              },
            ]}
          />
          <div className="scrollbar-none overflow-x-auto border-b p-4 sm:px-6">
            <SegmentedControl
              size="sm"
              value={status}
              onChange={setStatus}
              aria-label={t('experiments.filter')}
              options={(['all', ...EXPERIMENT_STATUSES] as const).map((value) => ({
                value,
                label: value === 'all' ? t('experiments.all') : t(`experiments.status.${value}`),
              }))}
            />
          </div>
          {visible.length === 0 ? (
            <EmptyState
              variant="plain"
              icon={FlaskConical}
              title={t('experiments.empty.title')}
              description={t('experiments.empty.description')}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">{t('experiments.table.experiment')}</TableHead>
                  <TableHead>{t('experiments.table.status')}</TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t('experiments.table.goal')}
                  </TableHead>
                  <TableHead className="hidden text-right sm:table-cell">
                    {t('experiments.table.visitors')}
                  </TableHead>
                  <TableHead className="text-right">{t('experiments.table.lift')}</TableHead>
                  <TableHead className="hidden pr-6 lg:table-cell">
                    {t('experiments.table.confidence')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map(({ experiment, best }) => (
                  <TableRow key={experiment.id}>
                    <TableCell className="max-w-80 pl-6">
                      <Link
                        to={analyticsRoutes.experiment.href({ experimentId: experiment.id })}
                        className="font-medium hover:underline"
                      >
                        {experiment.name}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">
                        {t('experiments.variants', { count: experiment.variants.length })}
                      </p>
                    </TableCell>
                    <TableCell>
                      <ExperimentStatusTag status={experiment.status} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {t(`goals.events.${experiment.goal}`)}
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums sm:table-cell">
                      {compact(experiment.variants.reduce((s, v) => s + v.visitors, 0))}
                    </TableCell>
                    <TableCell className="text-right">{best ? <Lift {...best} /> : '—'}</TableCell>
                    <TableCell className="hidden pr-6 lg:table-cell">
                      {best ? (
                        <ConfidenceMeter
                          value={best.confidence}
                          label={t('experiments.table.confidenceLabel', { name: experiment.name })}
                        />
                      ) : (
                        '—'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </SectionCard>
      )}
    </Page>
  );
}
