import { Bar, BarChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from 'recharts';

import { useTranslation } from '@/core/i18n/use-translation';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/shared/ui/chart';
import { Skeleton } from '@/shared/ui/skeleton';

import type { ProjectsOverview } from '../model/projects';

/**
 * Grouped bars with a dashed target line. Built directly on Recharts because
 * the shared BarChart has no reference line; it reuses the same tokens.
 */
export function ProjectsBarsCard({
  projects,
  target,
}: {
  projects?: ProjectsOverview['projects'];
  target?: number;
}) {
  const { t } = useTranslation('erp', { keyPrefix: 'projects' });
  const config = {
    done: { label: t('projects.done'), color: 'var(--chart-1)' },
    created: { label: t('projects.created'), color: 'var(--chart-4)' },
    late: { label: t('projects.late'), color: 'var(--chart-3)' },
  } satisfies ChartConfig;

  return (
    <SectionCard
      title={t('projects.title')}
      description={t('projects.description')}
      className="lg:col-span-5"
      contentClassName="flex flex-col"
      action={
        target !== undefined ? (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-4 border-t border-dashed border-muted-foreground" />
            {t('projects.target', { value: target })}
          </span>
        ) : undefined
      }
    >
      {projects ? (
        <ChartContainer config={config} className="aspect-auto h-full min-h-72 w-full flex-1">
          <BarChart data={projects} margin={{ left: 4, right: 8, top: 16 }} barGap={3}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="year" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} width={36} />
            <ChartTooltip
              cursor={{ fill: 'var(--muted)', opacity: 0.6 }}
              content={<ChartTooltipContent />}
            />
            {target !== undefined && (
              <ReferenceLine y={target} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
            )}
            {(['done', 'created', 'late'] as const).map((key) => (
              <Bar
                key={key}
                dataKey={key}
                fill={`var(--color-${key})`}
                radius={[4, 4, 0, 0]}
                maxBarSize={10}
              />
            ))}
            <ChartLegend content={<ChartLegendContent />} verticalAlign="top" />
          </BarChart>
        </ChartContainer>
      ) : (
        <Skeleton className="h-72 w-full" />
      )}
    </SectionCard>
  );
}
