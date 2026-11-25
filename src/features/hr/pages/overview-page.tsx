import { Globe } from 'lucide-react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { useSearchParams } from '@/core/router/router';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { Button } from '@/shared/ui/button';
import { Calendar } from '@/shared/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';

import { hrOverviewQuery, useHrOverview } from '../api/overview-api';
import { InterviewsList } from '../components/interviews-list';
import { NewJobDialog } from '../components/new-job-dialog';
import { OpeningsTable } from '../components/openings-table';
import {
  ActivityList,
  HeadcountCard,
  OnboardingCard,
  PipelineCard,
} from '../components/people-cards';
import { ReportSection } from '../components/report-card';
import { WidgetError } from '../components/widget-error';
import { HR_COMPARE, HR_RANGES, type HrFilters } from '../model/overview';

const TABS = ['overview', 'calendar', 'tasks', 'activity'] as const;
type Tab = (typeof TABS)[number];

function parseFilters(params: URLSearchParams): HrFilters {
  const range = params.get('range');
  const compare = params.get('compare');
  return {
    range: HR_RANGES.includes(range as HrFilters['range']) ? (range as HrFilters['range']) : '14d',
    compare: HR_COMPARE.includes(compare as HrFilters['compare'])
      ? (compare as HrFilters['compare'])
      : 'previous',
  };
}

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ request }) => {
    await queryClient.prefetchQuery(
      hrOverviewQuery(parseFilters(new URL(request.url).searchParams)),
    );
    return null;
  };

const toDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d);
};

export default function HrDashboardPage() {
  const { t } = useTranslation('hr');
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseFilters(searchParams);
  const tabParam = searchParams.get('tab') as Tab | null;
  const tab: Tab = tabParam && TABS.includes(tabParam) ? tabParam : 'overview';
  const overview = useHrOverview(filters);
  const data = overview.data;

  const update = (patch: Record<string, string>) =>
    setSearchParams(
      (prev) => {
        for (const [key, value] of Object.entries(patch)) prev.set(key, value);
        return prev;
      },
      { replace: true },
    );

  return (
    <Page
      width="full"
      title={t('title')}
      description={t('description')}
      actions={
        <>
          <Button variant="outline" className="bg-card" asChild>
            <a href="/" target="_blank" rel="noreferrer">
              <Globe /> {t('careersSite')}
            </a>
          </Button>
          <NewJobDialog />
        </>
      }
    >
      <Tabs value={tab} onValueChange={(value) => update({ tab: value })} className="gap-6">
        <div className="border-b">
          <TabsList variant="line" className="h-10">
            {TABS.map((value) => (
              <TabsTrigger key={value} value={value} className="px-3">
                {t(`tabs.${value}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {overview.isError ? (
          <div className="rounded-xl border bg-card">
            <WidgetError onRetry={() => void overview.refetch()} />
          </div>
        ) : (
          <>
            <TabsContent value="overview" className="space-y-8">
              <div
                className="transition-opacity data-[fetching=true]:opacity-70"
                data-fetching={overview.isPlaceholderData}
              >
                <ReportSection
                  data={data}
                  filters={filters}
                  onFiltersChange={(next) => update(next)}
                />
              </div>
              <div className="grid gap-8 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
                <InterviewsList interviews={data?.interviews} />
                <OpeningsTable openings={data?.openings} />
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                <HeadcountCard headcount={data?.headcount} />
                <PipelineCard pipeline={data?.pipeline} />
                <OnboardingCard onboarding={data?.onboarding} />
              </div>
            </TabsContent>

            <TabsContent value="calendar">
              <div className="grid gap-6 lg:grid-cols-[auto_minmax(0,1fr)]">
                <SectionCard
                  title={t('calendarTab.title')}
                  description={t('calendarTab.description')}
                >
                  <Calendar
                    mode="single"
                    numberOfMonths={1}
                    defaultMonth={
                      data ? toDate(data.interviews[0]?.date ?? '2026-11-24') : undefined
                    }
                    className="p-0 [--cell-size:--spacing(10)]"
                    modifiers={{ interview: data?.interviews.map((i) => toDate(i.date)) ?? [] }}
                    modifiersClassNames={{
                      interview:
                        '[&>button]:bg-primary/10 [&>button]:font-semibold [&>button]:text-primary',
                    }}
                  />
                </SectionCard>
                <InterviewsList interviews={data?.interviews} />
              </div>
            </TabsContent>

            <TabsContent value="tasks">
              <div className="grid gap-4 lg:grid-cols-2">
                <OnboardingCard onboarding={data?.onboarding} />
                <PipelineCard pipeline={data?.pipeline} />
              </div>
            </TabsContent>

            <TabsContent value="activity">
              <div className="max-w-2xl">
                <ActivityList activity={data?.activity} />
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>
    </Page>
  );
}
