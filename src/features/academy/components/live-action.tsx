import { CalendarPlus, CalendarX2, Video } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Button } from '@/shared/ui/button';
import { Spinner } from '@/shared/ui/spinner';

import { useRegisterLive } from '../api/teaching-api';
import { isJoinable, type LiveSession } from '../model/teaching';

/** Join when the room is open, otherwise reserve or release a spot. */
export function LiveAction({ session, className }: { session: LiveSession; className?: string }) {
  const { t } = useTranslation('academy');
  const register = useRegisterLive();

  if (isJoinable(session))
    return (
      <Button size="sm" className={className} asChild>
        <a href={session.joinUrl} target="_blank" rel="noreferrer">
          <Video /> {t('live.join')}
        </a>
      </Button>
    );

  const full = !session.going && session.registered >= session.capacity;
  return (
    <Button
      size="sm"
      variant={session.going ? 'secondary' : 'outline'}
      className={className}
      disabled={full || register.isPending}
      onClick={() => register.mutate({ id: session.id, going: !session.going })}
    >
      {register.isPending ? <Spinner /> : session.going ? <CalendarX2 /> : <CalendarPlus />}
      {t(full ? 'live.full' : session.going ? 'live.cancel' : 'live.reserve')}
    </Button>
  );
}
