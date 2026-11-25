import { Clock, MapPin, Pencil, Repeat, Trash2, Users } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Button } from '@/shared/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';

import { useDeleteEvent } from '../api/calendar-api';
import { fmtDay, fmtOccurrenceTime } from '../lib/format';
import { CALENDAR_COLORS, type Occurrence } from '../model/calendar';

/** Event details on click: when, where, who, plus edit / delete. */
export function EventPopover({
  occurrence: o,
  onEdit,
  children,
}: {
  occurrence: Occurrence;
  onEdit: (o: Occurrence) => void;
  children: ReactNode;
}) {
  const { t, i18n } = useTranslation('app-calendar');
  const [open, setOpen] = useState(false);
  const remove = useDeleteEvent({ onSuccess: () => setOpen(false) });
  const lang = i18n.language;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start" onClick={(e) => e.stopPropagation()}>
        <div className="space-y-3 p-4">
          <div className="flex items-start gap-3">
            <span
              className="mt-1.5 size-3 shrink-0 rounded-[4px]"
              style={{ background: CALENDAR_COLORS[o.calendarId] }}
            />
            <div className="min-w-0">
              <p className="leading-snug font-semibold">{o.title}</p>
              <p className="text-xs text-muted-foreground">{t(`calendars.${o.calendarId}`)}</p>
            </div>
          </div>
          <ul className="space-y-2 text-sm">
            <li className="flex gap-2.5">
              <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <span>
                {fmtDay(o.startDate, lang, { weekday: 'long', day: 'numeric', month: 'long' })}
                <span className="block text-muted-foreground">
                  {fmtOccurrenceTime(o, lang, t('allDay'))}
                </span>
              </span>
            </li>
            {o.repeat !== 'none' && (
              <li className="flex gap-2.5 text-muted-foreground">
                <Repeat className="mt-0.5 size-4 shrink-0" /> {t(`repeat.${o.repeat}`)}
              </li>
            )}
            {o.location && (
              <li className="flex gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" /> {o.location}
              </li>
            )}
            {o.guests.length > 0 && (
              <li className="flex gap-2.5">
                <Users className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0">
                  {t('guests', { count: o.guests.length })}
                  <span className="block truncate text-xs text-muted-foreground">
                    {o.guests.join(', ')}
                  </span>
                </span>
              </li>
            )}
          </ul>
          {o.description && (
            <p className="rounded-md bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
              {o.description}
            </p>
          )}
        </div>
        <div className="flex justify-end gap-1 border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            disabled={remove.isPending}
            onClick={() => remove.mutate(o.id)}
          >
            <Trash2 /> {t('dialog.delete')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setOpen(false);
              onEdit(o);
            }}
          >
            <Pencil /> {t('edit')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
