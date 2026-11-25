import { useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { AvatarStack } from '@/shared/components/display/avatar-stack';
import { DescriptionList } from '@/shared/components/display/description-list';
import { UserCell } from '@/shared/components/display/user-cell';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/sheet';

import { compact, longDate, minutes, percent, time } from '../lib/format';
import { attendanceRate, isPast, type LiveSession } from '../model/teaching';

import { LessonPlayer } from './lesson-player';
import { LiveAction } from './live-action';

function Recording({ session }: { session: LiveSession }) {
  const { t } = useTranslation('academy');
  const [position, setPosition] = useState(0);
  if (!session.recording)
    return <p className="text-sm text-muted-foreground">{t('live.noRecording')}</p>;
  return (
    <div className="space-y-2">
      <LessonPlayer
        title={session.title}
        color={session.color}
        durationSec={session.recording.durationMin * 60}
        position={position}
        onPositionChange={setPosition}
      />
      <p className="text-xs text-muted-foreground">
        {t('live.views', { value: compact(session.recording.views) })}
      </p>
    </div>
  );
}

/** Everything about one live class: when, who hosts and attends, agenda and recording. */
export function LiveSessionSheet({
  session,
  onClose,
}: {
  session: LiveSession | null;
  onClose: () => void;
}) {
  const { t } = useTranslation('academy');

  return (
    <Sheet open={!!session} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-lg">
        {session && (
          <>
            <SheetHeader>
              <SheetTitle>{session.title}</SheetTitle>
              <SheetDescription>{session.courseTitle}</SheetDescription>
            </SheetHeader>
            <div className="space-y-6 px-4 pb-6">
              {isPast(session) ? (
                <Recording key={session.id} session={session} />
              ) : (
                <LiveAction session={session} className="w-full" />
              )}
              <UserCell name={session.host.name} secondary={session.host.title} size="md" />
              <DescriptionList
                layout="vertical"
                className="grid grid-cols-2 gap-4"
                items={[
                  { key: 'date', term: t('live.columns.date'), detail: longDate(session.startsAt) },
                  {
                    key: 'time',
                    term: t('live.columns.time'),
                    detail: `${time(session.startsAt)} · ${minutes(session.durationMin)}`,
                  },
                  {
                    key: 'seats',
                    term: t('live.columns.seats'),
                    detail: `${session.registered}/${session.capacity}`,
                  },
                  {
                    key: 'attendance',
                    term: t('live.columns.attendance'),
                    detail: percent(attendanceRate(session)),
                  },
                ]}
              />
              <section className="space-y-2">
                <h3 className="text-sm font-medium">{t('live.agenda')}</h3>
                <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
                  {session.agenda.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              </section>
              {session.attendees.length > 0 && (
                <section className="space-y-2">
                  <h3 className="text-sm font-medium">
                    {t('live.attendees', { count: session.attended ?? session.registered })}
                  </h3>
                  <AvatarStack names={session.attendees} max={6} />
                </section>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
