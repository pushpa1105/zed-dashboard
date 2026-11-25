import { useTranslation } from '@/core/i18n/use-translation';
import { Tag } from '@/shared/components/display/tag';
import { cn } from '@/shared/lib/cn';
import { Checkbox } from '@/shared/ui/checkbox';
import { Progress } from '@/shared/ui/progress';

import { useToggleOnboardingTask } from '../api/workforce-api';
import { daysUntil, shortDate } from '../lib/format';
import { ONBOARDING_PHASES, progressOf, type NewHire } from '../model/workforce';

const OWNER_TONE = { hr: 'info', it: 'violet', manager: 'orange', newHire: 'aqua' } as const;

/** A new hire's checklist, one block per phase. */
export function OnboardingChecklist({ hire }: { hire: NewHire }) {
  const { t } = useTranslation('hr');
  const toggle = useToggleOnboardingTask();

  return (
    <div className="space-y-6">
      {ONBOARDING_PHASES.map((phase) => {
        const tasks = hire.tasks.filter((task) => task.phase === phase);
        const done = tasks.filter((task) => task.done).length;
        return (
          <section key={phase} className="space-y-3" aria-labelledby={`phase-${phase}`}>
            <div className="flex items-center justify-between gap-4">
              <h3 id={`phase-${phase}`} className="text-sm font-semibold">
                {t(`onboardingPage.phases.${phase}`)}
              </h3>
              <span className="text-xs text-muted-foreground tabular-nums">
                {t('onboardingPage.done', { done, total: tasks.length })}
              </span>
            </div>
            <Progress value={progressOf(tasks)} aria-label={t(`onboardingPage.phases.${phase}`)} />
            <ul className="divide-y rounded-lg border">
              {tasks.map((task) => {
                const overdue = !task.done && daysUntil(task.due) < 0;
                return (
                  <li key={task.id} className="flex items-center gap-3 px-4 py-3">
                    <Checkbox
                      id={task.id}
                      checked={task.done}
                      onCheckedChange={(checked) =>
                        toggle.mutate({ hireId: hire.id, taskId: task.id, done: checked === true })
                      }
                    />
                    <label
                      htmlFor={task.id}
                      className={cn(
                        'min-w-0 flex-1 cursor-pointer text-sm',
                        task.done && 'text-muted-foreground line-through',
                      )}
                    >
                      {task.title}
                    </label>
                    <Tag size="sm" tone={OWNER_TONE[task.owner]} className="hidden sm:inline-flex">
                      {t(`onboardingPage.owners.${task.owner}`)}
                    </Tag>
                    <span
                      className={cn(
                        'w-16 shrink-0 text-right text-xs tabular-nums',
                        overdue ? 'font-medium text-destructive' : 'text-muted-foreground',
                      )}
                    >
                      {overdue ? t('onboardingPage.overdue') : shortDate(task.due)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
