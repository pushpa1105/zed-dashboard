import { Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { TagInput } from '@/shared/components/forms/tag-input';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Switch } from '@/shared/ui/switch';
import { Textarea } from '@/shared/ui/textarea';

import { useCreateEvent, useDeleteEvent, useUpdateEvent } from '../api/calendar-api';
import { fromInputs, toDateInput, toTimeInput } from '../lib/dates';
import {
  CALENDAR_COLORS,
  CALENDAR_IDS,
  REPEATS,
  type CalendarEvent,
  type CalendarId,
  type Repeat,
} from '../model/calendar';

export type EventDraft = {
  /** Present when editing. */
  event?: CalendarEvent;
  start: Date;
  end: Date;
  allDay?: boolean;
  calendarId?: CalendarId;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Fields({ draft, onDone }: { draft: EventDraft; onDone: () => void }) {
  const { t } = useTranslation('app-calendar');
  const source = draft.event;
  const lastDay = draft.allDay ? new Date(draft.end.getTime() - 1) : draft.end;

  const [title, setTitle] = useState(source?.title ?? '');
  const [allDay, setAllDay] = useState(draft.allDay ?? false);
  const [startDate, setStartDate] = useState(toDateInput(draft.start));
  const [startTime, setStartTime] = useState(toTimeInput(draft.start));
  const [endDate, setEndDate] = useState(toDateInput(lastDay));
  const [endTime, setEndTime] = useState(toTimeInput(draft.end));
  const [calendarId, setCalendarId] = useState<CalendarId>(
    source?.calendarId ?? draft.calendarId ?? 'work',
  );
  const [location, setLocation] = useState(source?.location ?? '');
  const [guests, setGuests] = useState<string[]>(source?.guests ?? []);
  const [repeat, setRepeat] = useState<Repeat>(source?.repeat ?? 'none');
  const [description, setDescription] = useState(source?.description ?? '');
  const [error, setError] = useState<string | null>(null);

  const create = useCreateEvent({ onSuccess: onDone });
  const update = useUpdateEvent({ onSuccess: onDone });
  const remove = useDeleteEvent({ onSuccess: onDone });
  const pending = create.isPending || update.isPending || remove.isPending;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setError(t('dialog.errors.title'));
    let start: Date;
    let end: Date;
    if (allDay) {
      start = fromInputs(startDate, '00:00');
      end = fromInputs(endDate, '00:00');
      end.setDate(end.getDate() + 1);
    } else {
      start = fromInputs(startDate, startTime);
      end = fromInputs(endDate, endTime);
    }
    if (end <= start) return setError(t('dialog.errors.range'));
    setError(null);
    const input = {
      title: title.trim(),
      start: start.toISOString(),
      end: end.toISOString(),
      allDay,
      calendarId,
      location: location.trim(),
      guests,
      repeat,
      description: description.trim(),
    };
    if (source) update.mutate({ id: source.id, input });
    else create.mutate(input);
  };

  return (
    <form onSubmit={submit} className="grid gap-5" noValidate>
      <div className="grid gap-2">
        <Label htmlFor="event-title">{t('dialog.title')}</Label>
        <Input
          id="event-title"
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('dialog.titlePlaceholder')}
          aria-invalid={error === t('dialog.errors.title') || undefined}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
        <Label htmlFor="event-all-day" className="font-normal">
          {t('dialog.allDay')}
        </Label>
        <Switch id="event-all-day" checked={allDay} onCheckedChange={setAllDay} />
      </div>

      <div className="grid gap-4">
        <fieldset className="grid gap-2">
          <legend className="mb-2 text-sm font-medium">{t('dialog.starts')}</legend>
          <div className={allDay ? 'grid' : 'grid grid-cols-[1fr_9rem] gap-2'}>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (e.target.value > endDate) setEndDate(e.target.value);
              }}
              aria-label={t('dialog.startDate')}
            />
            {!allDay && (
              <Input
                type="time"
                step={900}
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                aria-label={t('dialog.startTime')}
              />
            )}
          </div>
        </fieldset>
        <fieldset className="grid gap-2">
          <legend className="mb-2 text-sm font-medium">{t('dialog.ends')}</legend>
          <div className={allDay ? 'grid' : 'grid grid-cols-[1fr_9rem] gap-2'}>
            <Input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              aria-label={t('dialog.endDate')}
            />
            {!allDay && (
              <Input
                type="time"
                step={900}
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                aria-label={t('dialog.endTime')}
              />
            )}
          </div>
        </fieldset>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>{t('dialog.calendar')}</Label>
          <Select value={calendarId} onValueChange={(v) => setCalendarId(v as CalendarId)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CALENDAR_IDS.map((id) => (
                <SelectItem key={id} value={id}>
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: CALENDAR_COLORS[id] }}
                  />
                  {t(`calendars.${id}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>{t('dialog.repeat')}</Label>
          <Select value={repeat} onValueChange={(v) => setRepeat(v as Repeat)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REPEATS.map((r) => (
                <SelectItem key={r} value={r}>
                  {t(`repeat.${r}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="event-location">{t('dialog.location')}</Label>
        <Input
          id="event-location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder={t('dialog.locationPlaceholder')}
        />
      </div>

      <div className="grid gap-2">
        <Label>{t('dialog.guests')}</Label>
        <TagInput
          value={guests}
          onChange={setGuests}
          placeholder={t('dialog.guestsPlaceholder')}
          validate={(tag) => (EMAIL.test(tag) ? undefined : t('dialog.errors.email'))}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="event-notes">{t('dialog.notes')}</Label>
        <Textarea
          id="event-notes"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <DialogFooter className="items-center sm:justify-between">
        {source ? (
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            disabled={pending}
            onClick={() => remove.mutate(source.id)}
          >
            <Trash2 /> {t('dialog.delete')}
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onDone}>
            {t('dialog.cancel')}
          </Button>
          <Button type="submit" disabled={pending}>
            {source ? t('dialog.save') : t('dialog.create')}
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}

/** Create or edit an event. The form remounts for every new draft. */
export function EventDialog({ draft, onClose }: { draft: EventDraft | null; onClose: () => void }) {
  const { t } = useTranslation('app-calendar');
  return (
    <Dialog open={!!draft} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{draft?.event ? t('dialog.editTitle') : t('dialog.newTitle')}</DialogTitle>
          <DialogDescription>{t('dialog.description')}</DialogDescription>
        </DialogHeader>
        {draft && (
          <Fields
            key={`${draft.event?.id ?? 'new'}-${draft.start.toISOString()}`}
            draft={draft}
            onDone={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
