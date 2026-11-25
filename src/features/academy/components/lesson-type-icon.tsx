import { BookOpenText, FlaskConical, ListChecks, PlayCircle, type LucideIcon } from 'lucide-react';

import { cn } from '@/shared/lib/cn';

import type { LessonType } from '../model/academy';

export const LESSON_ICON: Record<LessonType, LucideIcon> = {
  video: PlayCircle,
  reading: BookOpenText,
  quiz: ListChecks,
  lab: FlaskConical,
};

/** Small icon for a lesson's format (video, reading, quiz, lab). */
export function LessonTypeIcon({ type, className }: { type: LessonType; className?: string }) {
  const Icon = LESSON_ICON[type];
  return <Icon className={cn('size-4 shrink-0 text-muted-foreground', className)} aria-hidden />;
}
