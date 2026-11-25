import { ArrowLeft, MousePointerClick, Percent, TrendingUp, Users } from 'lucide-react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { Link, useParams } from '@/core/router/router';
import { LineChart } from '@/shared/components/charts/line-chart';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatCard } from '@/shared/components/dashboard/stat-card';
import { Callout } from '@/shared/components/display/callout';
import { Tag } from '@/shared/components/display/tag';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { experimentQuery, useExperiment } from '../api/analytics-api';
import { ConfidenceMeter, ExperimentStatusTag, Lift } from '../components/experiment-parts';
import { QueryError } from '../components/query-error';
import { compact, integer, percent, shortDate, signedPercent } from '../lib/format';
import { bestVariant, compareToControl, conversionRate, SIGNIFICANCE } from '../lib/stats';
import type { ExperimentDetail } from '../model/analytics';
import { analyticsRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ params }) => {
    await queryClient.prefetchQuery(experimentQuery(params.experimentId!));
    return null;
  };

function Verdict({ best }: { best: ReturnType<typeof bestVariant> }) {
  const { t } = useTranslation('analytics');
  if (!best) {
    return <Callout kind="info">{t('experiments.verdict.draft')}</Callout>;
  }
  const values = {
    variant: best.variant.name,
    lift: signedPercent(best.lift),
    confidence: percent(best.confidence, 0),
  };
  if (best.confidence < SIGNIFICANCE) {
    return <Callout kind="warning">{t('experiments.verdict.inconclusive', values)}</Callout>;
  }
  return best.lift > 0 ? (
    <Callout kind="success">{t('experiments.verdict.winner', values)}</Callout>
  ) : (
    <Callout kind="danger">{t('experiments.verdict.loser', values)}</Callout>
  );
}

function VariantTable({ variants }: { variants: ExperimentDetail['variants'] }) {
  const { t } = useTranslation('analytics');
  const control = variants.find((v) => v.control) ?? variants[0]!;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="pl-6">{t('experiments.detail.variant')}</TableHead>
          <TableHead className="text-right">{t('experiments.table.visitors')}</TableHead>
          <TableHead className="hidden text-right sm:table-cell">
            {t('experiments.detail.conversions')}
          </TableHead>
          <TableHead className="text-right">{t('experiments.detail.rate')}</TableHead>
          <TableHead className="text-right">{t('experiments.table.lift')}</TableHead>
          <TableHead className="hidden pr-6 md:table-cell">
            {t('experiments.table.confidence')}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {variants.map((variant) => {
          const result = variant.control ? null : compareToControl(variant, control);
          return (
            <TableRow key={variant.key}>
              <TableCell className="pl-6 font-medium">
                {variant.name}{' '}
                {variant.control && (
                  <Tag size="sm" className="ml-1">
                    {t('experiments.detail.control')}
                  </Tag>
                )}
              </TableCell>
              <TableCell className="text-right tabular-nums">{integer(variant.visitors)}</TableCell>
              <TableCell className="hidden text-right tabular-nums sm:table-cell">
                {integer(variant.conversions)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {percent(conversionRate(variant), 2)}
              </TableCell>
              <TableCell className="text-right">{result ? <Lift {...result} /> : '—'}</TableCell>
              <TableCell className="hidden pr-6 md:table-cell">
                {result ? (
                  <ConfidenceMeter
                    value={result.confidence}
                    label={t('experiments.table.confidenceLabel', { name: variant.name })}
                  />
                ) : (
                  '—'
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

/** One A/B test: verdict, variant comparison and how conversion rates evolved. */
export default function ExperimentPage() {
  const { t } = useTranslation('analytics');
  const { experimentId } = useParams();
  const query = useExperiment(experimentId!);
  const data = query.data;
  const best = data && data.status !== 'draft' ? bestVariant(data.variants) : undefined;
  const sum = (key: 'visitors' | 'conversions') =>
    data?.variants.reduce((s, v) => s + v[key], 0) ?? 0;

  return (
    <Page
      width="full"
      title={data?.name ?? t('experiments.title')}
      description={data?.hypothesis}
      actions={
        <Button variant="outline" asChild>
          <Link to={analyticsRoutes.experiments.href()}>
            <ArrowLeft /> {t('experiments.detail.back')}
          </Link>
        </Button>
      }
    >
      {query.isError && !data ? (
        <QueryError onRetry={() => void query.refetch()} />
      ) : !data ? (
        <div className="space-y-6">
          <Skeleton className="h-14 rounded-xl" />
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-80 rounded-xl" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <ExperimentStatusTag status={data.status} />
            <span>{t('experiments.detail.goal', { goal: t(`goals.events.${data.goal}`) })}</span>
            {data.startedAt && (
              <span>
                {data.endedAt
                  ? t('experiments.detail.ran', {
                      from: shortDate(data.startedAt),
                      to: shortDate(data.endedAt),
                    })
                  : t('experiments.detail.since', { from: shortDate(data.startedAt) })}
              </span>
            )}
          </div>
          <Verdict best={best} />
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={Users}
              label={t('experiments.table.visitors')}
              value={compact(sum('visitors'))}
            />
            <StatCard
              icon={MousePointerClick}
              color="var(--chart-2)"
              label={t('experiments.detail.conversions')}
              value={compact(sum('conversions'))}
            />
            <StatCard
              icon={TrendingUp}
              color="var(--chart-3)"
              label={t('experiments.detail.bestLift')}
              value={best ? signedPercent(best.lift) : '—'}
              hint={best?.variant.name}
            />
            <StatCard
              icon={Percent}
              color="var(--chart-4)"
              label={t('experiments.table.confidence')}
              value={best ? percent(best.confidence, 0) : '—'}
              hint={t('experiments.detail.threshold', { value: SIGNIFICANCE })}
            />
          </div>
          <SectionCard title={t('experiments.detail.variants')} flush>
            <VariantTable variants={data.variants} />
          </SectionCard>
          {data.daily.length > 0 && (
            <SectionCard
              title={t('experiments.detail.chart.title')}
              description={t('experiments.detail.chart.description')}
            >
              <LineChart
                data={data.daily.map((d) => ({ ...d, date: shortDate(String(d.date)) }))}
                xKey="date"
                curve="monotone"
                className="h-72"
                valueFormatter={(v) => percent(v)}
                series={data.variants.map((v) => ({ key: v.key, label: v.name }))}
              />
            </SectionCard>
          )}
        </div>
      )}
    </Page>
  );
}
