import { Plus, Share2 } from 'lucide-react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { Button } from '@/shared/ui/button';

import {
  operationsQuery,
  projectsOverviewQuery,
  useProjectsOverview,
} from '../projects/api/projects-api';
import { OperationsCard } from '../projects/components/operations-card';
import { ProjectsBarsCard } from '../projects/components/projects-bars-card';
import {
  ActivityCard,
  AnalysisCard,
  ClientsCard,
  DeadlinesCard,
} from '../projects/components/side-cards';
import { CapacityCard, SalesCard, TasksCard } from '../projects/components/summary-cards';
import { WidgetError } from '../projects/components/widget-error';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await Promise.all([
      queryClient.prefetchQuery(projectsOverviewQuery()),
      queryClient.prefetchQuery(operationsQuery()),
    ]);
    return null;
  };

export default function ProjectsDashboardPage() {
  const { t } = useTranslation('erp', { keyPrefix: 'projects' });
  const overview = useProjectsOverview();
  const data = overview.data;

  return (
    <Page
      width="full"
      title={t('title')}
      description={t('description')}
      actions={
        <>
          <Button variant="outline" className="bg-card">
            <Share2 /> {t('share')}
          </Button>
          <Button>
            <Plus /> {t('newProject')}
          </Button>
        </>
      }
    >
      {overview.isError ? (
        <div className="rounded-xl border bg-card">
          <WidgetError onRetry={() => void overview.refetch()} />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="grid gap-4 lg:col-span-4">
            <SalesCard sales={data?.sales} />
            <CapacityCard capacity={data?.capacity} />
          </div>
          <ProjectsBarsCard projects={data?.projects} target={data?.target} />
          <TasksCard tasks={data?.tasks} />
          <OperationsCard />
          <DeadlinesCard deadlines={data?.deadlines} />
          <AnalysisCard analysis={data?.analysis} />
          <ClientsCard clients={data?.clients} />
          <ActivityCard activity={data?.activity} />
        </div>
      )}
    </Page>
  );
}
