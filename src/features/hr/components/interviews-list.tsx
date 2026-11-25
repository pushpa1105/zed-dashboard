import { ChevronRight, Link2, MoreHorizontal } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { notify } from '@/core/notify/notify';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Skeleton } from '@/shared/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';

import type { HrOverview } from '../model/overview';

const dayParts = (iso: string, locale?: string) => {
  const date = new Date(`${iso}T00:00:00Z`);
  return {
    day: date.getUTCDate(),
    weekday: new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }).format(date),
  };
};

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-1.5 text-lg font-semibold">
      {children}
      <span className="flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <ChevronRight className="size-3.5" />
      </span>
    </h2>
  );
}

export function InterviewsList({ interviews }: { interviews?: HrOverview['interviews'] }) {
  const { t, i18n } = useTranslation('hr');

  return (
    <section className="space-y-3">
      <SectionTitle>{t('interviews.title')}</SectionTitle>
      {interviews ? (
        <ul className="space-y-2.5">
          {interviews.map((interview) => {
            const { day, weekday } = dayParts(interview.date, i18n.language);
            const copy = () =>
              void navigator.clipboard
                ?.writeText(`https://meet.example.com/${interview.id}`)
                .then(() => notify.success(t('interviews.copied')));
            return (
              <li
                key={interview.id}
                className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-xs"
              >
                <div className="w-12 shrink-0 border-r pr-4 text-center">
                  <p className="text-2xl leading-none font-semibold tabular-nums">{day}</p>
                  <p className="mt-1 text-xs text-muted-foreground capitalize">{weekday}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {interview.candidate}{' '}
                    <span className="font-normal text-muted-foreground tabular-nums">
                      ({interview.start} – {interview.end})
                    </span>
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {interview.role} · {interview.stage}
                  </p>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-primary"
                      aria-label={t('interviews.join')}
                      onClick={copy}
                    >
                      <Link2 />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('interviews.join')}</TooltipContent>
                </Tooltip>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label={t('interviews.more')}>
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={copy}>{t('interviews.copy')}</DropdownMenuItem>
                    <DropdownMenuItem>{t('interviews.reschedule')}</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive">
                      {t('interviews.cancel')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="space-y-2.5">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      )}
    </section>
  );
}
