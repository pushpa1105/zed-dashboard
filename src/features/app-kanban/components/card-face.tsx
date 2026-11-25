import { differenceInCalendarDays, parseISO } from 'date-fns';
import {
  CalendarClock,
  CheckSquare,
  ChevronsUp,
  MessageSquare,
  SignalHigh,
  SignalLow,
  SignalMedium,
} from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { AvatarStack } from '@/shared/components/display/avatar-stack';
import { toneStyle } from '@/shared/components/display/tone';
import { cn } from '@/shared/lib/cn';

import type { Card, Label, Member, Priority } from '../model/kanban';

const PRIORITY_ICON: Record<Priority, typeof SignalLow> = {
  low: SignalLow,
  medium: SignalMedium,
  high: SignalHigh,
  urgent: ChevronsUp,
};

export function LabelPill({ label, className }: { label: Label; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-5 items-center rounded-full px-2 text-[0.6875rem] font-medium',
        className,
      )}
      style={toneStyle(label.tone, 'soft')}
    >
      {label.name}
    </span>
  );
}

export function PriorityIcon({ priority, className }: { priority: Priority; className?: string }) {
  const { t } = useTranslation('app-kanban');
  const Icon = PRIORITY_ICON[priority];
  return (
    <Icon
      aria-label={t(`priority.${priority}`)}
      className={cn(
        'size-4',
        priority === 'urgent'
          ? 'text-destructive'
          : priority === 'high'
            ? 'text-chart-3'
            : 'text-muted-foreground',
        className,
      )}
    />
  );
}

/** Due-date chip: red when overdue, amber when due within two days. */
export function DueChip({ due }: { due: string }) {
  const { t, i18n } = useTranslation('app-kanban');
  const days = differenceInCalendarDays(parseISO(due), new Date());
  const tone = days < 0 ? 'danger' : days <= 2 ? 'warning' : null;
  const label =
    days === 0
      ? t('due.today')
      : days === 1
        ? t('due.tomorrow')
        : new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short' }).format(
            parseISO(due),
          );
  return (
    <span
      className={cn(
        'inline-flex h-5 items-center gap-1 rounded-md px-1.5 text-[0.6875rem] font-medium whitespace-nowrap',
        !tone && 'text-muted-foreground',
      )}
      style={tone ? toneStyle(tone, 'soft') : undefined}
    >
      <CalendarClock className="size-3" />
      {days < 0 ? t('due.overdue', { date: label }) : label}
    </span>
  );
}

/** Visual card used in columns and as the drag preview. */
export function CardFace({
  card,
  members,
  labels,
  dragging,
  overlay,
}: {
  card: Card;
  members: Member[];
  labels: Label[];
  dragging?: boolean;
  overlay?: boolean;
}) {
  const cardLabels = card.labelIds
    .map((id) => labels.find((l) => l.id === id))
    .filter(Boolean) as Label[];
  const names = card.assigneeIds
    .map((id) => members.find((m) => m.id === id)?.name)
    .filter(Boolean) as string[];
  const done = card.checklist.filter((i) => i.done).length;

  return (
    <div
      className={cn(
        'space-y-2.5 rounded-lg border bg-card p-3 text-left shadow-xs transition-shadow',
        dragging && 'opacity-40',
        overlay && 'rotate-[1.5deg] cursor-grabbing shadow-lg ring-2 ring-primary/30',
      )}
    >
      {cardLabels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {cardLabels.map((label) => (
            <LabelPill key={label.id} label={label} />
          ))}
        </div>
      )}
      <p className="text-sm leading-snug font-medium">{card.title}</p>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <span className="font-mono text-[0.6875rem] whitespace-nowrap text-muted-foreground">
          {card.key}
        </span>
        <PriorityIcon priority={card.priority} className="size-3.5" />
        {card.due && <DueChip due={card.due} />}
        {card.checklist.length > 0 && (
          <span
            className={cn(
              'inline-flex items-center gap-1 text-[0.6875rem] tabular-nums',
              done === card.checklist.length ? 'text-success' : 'text-muted-foreground',
            )}
          >
            <CheckSquare className="size-3" /> {done}/{card.checklist.length}
          </span>
        )}
        {card.comments.length > 0 && (
          <span className="inline-flex items-center gap-1 text-[0.6875rem] text-muted-foreground tabular-nums">
            <MessageSquare className="size-3" /> {card.comments.length}
          </span>
        )}
        {names.length > 0 && <AvatarStack names={names} size="xs" max={3} className="ml-auto" />}
      </div>
    </div>
  );
}
