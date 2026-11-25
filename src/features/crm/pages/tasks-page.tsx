import { AlertTriangle, CalendarClock, CalendarDays, CheckCircle2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { Link } from '@/core/router/router';
import { ProgressRing } from '@/shared/components/charts/progress-ring';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { Tag } from '@/shared/components/display/tag';
import { cn } from '@/shared/lib/cn';
import { Checkbox } from '@/shared/ui/checkbox';
import { Label } from '@/shared/ui/label';
import { Skeleton } from '@/shared/ui/skeleton';
import { Switch } from '@/shared/ui/switch';

import { tasksQuery, useCrmTasks, useToggleTask } from '../api/crm-api';
import { WidgetError } from '../components/crm-parts';
import { daysFromToday, dateTime } from '../lib/format';
import type { CrmTask } from '../model/crm';
import { crmRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(tasksQuery());
    return null;
  };

const PRIORITY_TONE = { high: 'danger', medium: 'warning', low: 'neutral' } as const;

function TaskRow({ task }: { task: CrmTask }) {
  const { t } = useTranslation('crm');
  const toggle = useToggleTask();
  const id = `task-${task.id}`;
  return (
    <li className="flex items-start gap-3 px-6 py-3.5">
      <Checkbox
        id={id}
        checked={task.done}
        onCheckedChange={(checked) => toggle.mutate({ id: task.id, done: checked === true })}
        className="mt-0.5"
      />
      <div className="min-w-0 flex-1">
        <Label
          htmlFor={id}
          className={cn(
            'block text-sm leading-snug font-medium',
            task.done && 'text-muted-foreground line-through',
          )}
        >
          {task.title}
        </Label>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {task.dealId ? (
            <Link to={crmRoutes.deal.href({ dealId: task.dealId })} className="hover:underline">
              {task.related}
            </Link>
          ) : (
            task.related
          )}{' '}
          · {dateTime(task.dueAt)}
        </p>
      </div>
      <Tag size="sm" tone={PRIORITY_TONE[task.priority]} dot>
        {t(`tasks.priority.${task.priority}`)}
      </Tag>
      <InitialsAvatar name={task.owner} size="xs" className="hidden sm:flex" />
    </li>
  );
}

function Group({
  title,
  icon,
  tone,
  tasks,
}: {
  title: string;
  icon: ReactNode;
  tone?: 'danger';
  tasks: CrmTask[];
}) {
  const { t } = useTranslation('crm');
  return (
    <SectionCard
      flush
      title={
        <span className={cn('flex items-center gap-2', tone === 'danger' && 'text-destructive')}>
          {icon} {title}
          <span className="rounded-full bg-muted px-2 text-xs font-medium text-muted-foreground tabular-nums">
            {tasks.length}
          </span>
        </span>
      }
    >
      {tasks.length ? (
        <ul className="divide-y border-t">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </ul>
      ) : (
        <p className="border-t px-6 py-6 text-sm text-muted-foreground">{t('tasks.empty')}</p>
      )}
    </SectionCard>
  );
}

export default function TasksPage() {
  const { t } = useTranslation('crm');
  const tasks = useCrmTasks();
  const [showDone, setShowDone] = useState(false);
  const all = tasks.data ?? [];
  const open = all.filter((task) => !task.done);
  const byDue = (task: CrmTask) => daysFromToday(task.dueAt);
  const sort = (list: CrmTask[]) =>
    [...list].sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt));
  const overdue = sort(open.filter((task) => byDue(task) < 0));
  const today = sort(open.filter((task) => byDue(task) === 0));
  const upcoming = sort(open.filter((task) => byDue(task) > 0));
  const done = all.filter((task) => task.done);
  const pct = all.length ? Math.round((done.length / all.length) * 100) : 0;

  return (
    <Page width="full" title={t('tasks.title')} description={t('tasks.description')}>
      {tasks.isError ? (
        <WidgetError onRetry={() => void tasks.refetch()} />
      ) : !tasks.data ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <div className="grid items-start gap-4 md:gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <SectionCard className="lg:sticky lg:top-24">
            <div className="flex flex-col items-center gap-4 text-center">
              <ProgressRing value={pct} size={112} strokeWidth={10}>
                <span className="text-xl">{pct}%</span>
              </ProgressRing>
              <p className="text-sm text-muted-foreground">
                {t('tasks.progress', { done: done.length, total: all.length })}
              </p>
            </div>
            <dl className="mt-6 space-y-3 border-t pt-5 text-sm">
              {(['high', 'medium', 'low'] as const).map((p) => (
                <div key={p} className="flex items-center justify-between">
                  <dt>
                    <Tag size="sm" tone={PRIORITY_TONE[p]} dot>
                      {t(`tasks.priority.${p}`)}
                    </Tag>
                  </dt>
                  <dd className="font-medium tabular-nums">
                    {open.filter((task) => task.priority === p).length}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 flex items-center justify-between border-t pt-5">
              <Label htmlFor="show-done" className="text-sm font-normal">
                {t('tasks.showDone')}
              </Label>
              <Switch id="show-done" checked={showDone} onCheckedChange={setShowDone} />
            </div>
          </SectionCard>
          <div className="space-y-4 md:space-y-6">
            <Group
              title={t('tasks.overdue')}
              icon={<AlertTriangle className="size-4" />}
              tone="danger"
              tasks={overdue}
            />
            <Group
              title={t('tasks.today')}
              icon={<CalendarClock className="size-4" />}
              tasks={today}
            />
            <Group
              title={t('tasks.upcoming')}
              icon={<CalendarDays className="size-4" />}
              tasks={upcoming}
            />
            {showDone && (
              <Group
                title={t('tasks.done')}
                icon={<CheckCircle2 className="size-4" />}
                tasks={done}
              />
            )}
          </div>
        </div>
      )}
    </Page>
  );
}
