import { Gauge, MessageSquareText, Smile, UsersRound } from 'lucide-react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { LineChart } from '@/shared/components/charts/line-chart';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatCard } from '@/shared/components/dashboard/stat-card';
import { Skeleton } from '@/shared/ui/skeleton';

import { engagementQuery, useEngagement } from '../api/people-ops-api';
import { DotLabel } from '../components/hr-parts';
import { ScoreHeatTable } from '../components/score-heat-table';
import { SurveyComments } from '../components/survey-comments';
import { SurveyList } from '../components/survey-list';
import { WidgetError } from '../components/widget-error';
import { average, percent } from '../lib/format';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(engagementQuery());
    return null;
  };

const SPLIT = [
  { key: 'promoters', color: 'var(--success)' },
  { key: 'passives', color: 'var(--muted-foreground)' },
  { key: 'detractors', color: 'var(--destructive)' },
] as const;

export default function EngagementPage() {
  const { t, i18n } = useTranslation('hr');
  const engagement = useEngagement();
  const data = engagement.data;

  if (engagement.isError) {
    return (
      <Page width="full" title={t('engagement.title')}>
        <WidgetError onRetry={() => void engagement.refetch()} />
      </Page>
    );
  }

  const latest = data?.enps.at(-1);
  const previous = data?.enps.at(-2);
  const active = data?.surveys.find((s) => s.status === 'active');
  const avgScore = average(data?.scores.flatMap((s) => Object.values(s.values)) ?? []);
  const trend = (data?.enps ?? []).map(({ month, score }) => ({
    month: new Date(`${month}-01T00:00:00Z`).toLocaleDateString(i18n.language, {
      month: 'short',
      timeZone: 'UTC',
    }),
    score,
  }));

  return (
    <Page width="full" title={t('engagement.title')} description={t('engagement.description')}>
      <div className="grid grid-cols-2 gap-4 md:gap-6 xl:grid-cols-4">
        <StatCard
          icon={Smile}
          label={t('engagement.stats.enps')}
          value={latest?.score}
          delta={latest && previous ? latest.score - previous.score : undefined}
          sparkline={data?.enps.map((m) => m.score)}
          loading={!data}
        />
        <StatCard
          icon={UsersRound}
          color="var(--info)"
          label={t('engagement.stats.responseRate')}
          value={active ? `${percent(active.responses, active.invited)}%` : '—'}
          hint={active?.title}
          loading={!data}
        />
        <StatCard
          icon={Gauge}
          color="var(--chart-3)"
          label={t('engagement.stats.avgScore')}
          value={`${avgScore.toFixed(1)} / 5`}
          loading={!data}
        />
        <StatCard
          icon={MessageSquareText}
          color="var(--chart-5)"
          label={t('engagement.stats.comments')}
          value={data?.comments.length}
          loading={!data}
        />
      </div>

      {!data || !latest ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : (
        <>
          <div className="grid items-start gap-4 md:gap-6 xl:grid-cols-2">
            <SectionCard title={t('engagement.enpsTrend')} description={t('engagement.enpsHint')}>
              <div className="space-y-2">
                <div className="flex h-2.5 overflow-hidden rounded-full" aria-hidden>
                  {SPLIT.map(({ key, color }) => (
                    <span key={key} style={{ width: `${latest[key]}%`, background: color }} />
                  ))}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {SPLIT.map(({ key, color }) => (
                    <DotLabel key={key} color={color}>
                      {t(`engagement.${key}`)} <span className="tabular-nums">{latest[key]}%</span>
                    </DotLabel>
                  ))}
                </div>
              </div>
              <LineChart
                data={trend}
                xKey="month"
                className="mt-4 h-56"
                series={[{ key: 'score', label: t('engagement.stats.enps') }]}
              />
            </SectionCard>
            <SurveyList surveys={data.surveys} />
          </div>
          <ScoreHeatTable scores={data.scores} />
          <SurveyComments comments={data.comments} />
        </>
      )}
    </Page>
  );
}
