import {
  Bell,
  Check,
  Database,
  LayoutDashboard,
  PlayCircle,
  Smartphone,
  UserRound,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { notify } from '@/core/notify/notify';
import { ProgressRing } from '@/shared/components/charts/progress-ring';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { TagInput } from '@/shared/components/forms/tag-input';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';

import { ONBOARDING_STEPS } from '../model/demo-data';

type Step = (typeof ONBOARDING_STEPS)[number];
const ICONS: Record<Step, LucideIcon> = {
  profile: UserRound,
  connect: Database,
  dashboard: LayoutDashboard,
  invite: UsersRound,
  alert: Bell,
  mobile: Smartphone,
};

const isEmail = (value: string) => /^\S+@\S+\.\S+$/.test(value);

/** In-app template: setup checklist with progress, a walkthrough and invites. */
export default function OnboardingPage() {
  const { t } = useTranslation('pages');
  const [done, setDone] = useState<Set<Step>>(() => new Set(['profile', 'connect']));
  const [open, setOpen] = useState<Step | null>(
    () => ONBOARDING_STEPS.find((s) => !['profile', 'connect'].includes(s)) ?? null,
  );
  const [emails, setEmails] = useState<string[]>(['ivan@northwind.io']);
  const percent = Math.round((done.size / ONBOARDING_STEPS.length) * 100);

  const complete = (step: Step) => {
    setDone((prev) => new Set(prev).add(step));
    setOpen(ONBOARDING_STEPS.find((s) => s !== step && !done.has(s)) ?? null);
    notify.success(t('onboarding.completed', { step: t(`onboarding.steps.${step}.title`) }));
  };

  return (
    <Page title={t('onboarding.title')} description={t('onboarding.description')} width="full">
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <SectionCard
          title={t('onboarding.checklist')}
          description={t('onboarding.progress', {
            done: done.size,
            total: ONBOARDING_STEPS.length,
          })}
          action={<ProgressRing value={percent} size={48} strokeWidth={5} />}
          flush
        >
          <ol className="divide-y border-t">
            {ONBOARDING_STEPS.map((step) => {
              const Icon = ICONS[step];
              const isDone = done.has(step);
              const isOpen = open === step;
              return (
                <li key={step}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : step)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-muted/40"
                  >
                    <span
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-full border',
                        isDone && 'border-transparent bg-success text-success-foreground',
                      )}
                    >
                      {isDone ? (
                        <Check className="size-4" />
                      ) : (
                        <Icon className="size-4 text-muted-foreground" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          'block text-sm font-medium',
                          isDone && 'text-muted-foreground line-through',
                        )}
                      >
                        {t(`onboarding.steps.${step}.title`)}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {t('onboarding.minutes', { count: step === 'connect' ? 5 : 2 })}
                      </span>
                    </span>
                  </button>
                  {isOpen && (
                    <div className="flex flex-col gap-4 px-6 pb-5 pl-[4.5rem] sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-muted-foreground">
                        {t(`onboarding.steps.${step}.body`)}
                      </p>
                      {!isDone && (
                        <Button size="sm" className="shrink-0" onClick={() => complete(step)}>
                          {t(`onboarding.steps.${step}.cta`)}
                        </Button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </SectionCard>

        <div className="grid content-start gap-6">
          <SectionCard title={t('onboarding.tour')} description={t('onboarding.tourHint')}>
            <button
              type="button"
              onClick={() => notify.info(t('onboarding.tourToast'))}
              className="group relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary/15 via-muted to-chart-2/15"
            >
              <span
                className="absolute inset-x-6 top-6 grid grid-cols-3 gap-2 opacity-60"
                aria-hidden
              >
                {[0, 1, 2].map((i) => (
                  <span key={i} className="h-10 rounded-md bg-card" />
                ))}
                <span className="col-span-2 h-20 rounded-md bg-card" />
                <span className="h-20 rounded-md bg-card" />
              </span>
              <PlayCircle className="relative size-14 text-primary drop-shadow transition-transform group-hover:scale-105" />
              <span className="absolute right-3 bottom-3 rounded-md bg-overlay/60 px-1.5 py-0.5 text-xs text-overlay-foreground">
                4:12
              </span>
            </button>
          </SectionCard>
          <SectionCard
            title={t('onboarding.invite')}
            description={t('onboarding.inviteHint')}
            footer={
              <div className="flex justify-end">
                <Button
                  disabled={!emails.length}
                  onClick={() => {
                    notify.success(t('onboarding.invited', { count: emails.length }));
                    setEmails([]);
                    complete('invite');
                  }}
                >
                  {t('onboarding.send')}
                </Button>
              </div>
            }
          >
            <TagInput
              value={emails}
              onChange={setEmails}
              validate={(tag) => (isEmail(tag) ? undefined : t('onboarding.invalidEmail'))}
              placeholder={t('onboarding.invitePlaceholder')}
            />
          </SectionCard>
        </div>
      </div>
    </Page>
  );
}
