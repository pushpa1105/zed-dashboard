import { ArrowDownToLine, ArrowUpFromLine, CalendarPlus } from 'lucide-react';
import { useEffect, useState } from 'react';

import { getErrorMessage } from '@/core/api/errors';
import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { cn } from '@/shared/lib/cn';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Skeleton } from '@/shared/ui/skeleton';

import { docksQuery, useBookSlot, useDocks } from '../api/logistics-api';
import { LoadError } from '../components/query-state';
import { hourLabel } from '../lib/format';
import type { DockDay, DockSlot, NewDockSlot } from '../model/logistics';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(docksQuery());
    return null;
  };

function useNowHour() {
  const read = () => new Date().getHours() + new Date().getMinutes() / 60;
  const [hour, setHour] = useState(read);
  useEffect(() => {
    const id = window.setInterval(() => setHour(read()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  return hour;
}

function SlotBlock({ slot, day }: { slot: DockSlot; day: DockDay }) {
  const { t } = useTranslation('logistics');
  const span = day.closeHour - day.openHour;
  const inbound = slot.direction === 'inbound';
  const color = inbound ? 'var(--chart-4)' : 'var(--chart-1)';
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'absolute inset-y-1.5 flex min-w-0 flex-col justify-center overflow-hidden rounded-md border-l-[3px] px-2 text-left text-xs transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring',
            slot.status === 'done' && 'opacity-45',
          )}
          style={{
            left: `${((slot.start - day.openHour) / span) * 100}%`,
            width: `${((slot.end - slot.start) / span) * 100}%`,
            borderLeftColor: color,
            background: `color-mix(in srgb, ${color} 14%, var(--card))`,
          }}
        >
          <span className="truncate font-medium">{slot.carrier}</span>
          <span className="truncate text-[0.6875rem] text-muted-foreground tabular-nums">
            {hourLabel(slot.start)}–{hourLabel(slot.end)} · {slot.pallets} plt
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 space-y-3 text-sm">
        <div className="flex items-center gap-2">
          {inbound ? (
            <ArrowDownToLine className="size-4" style={{ color }} />
          ) : (
            <ArrowUpFromLine className="size-4" style={{ color }} />
          )}
          <p className="font-medium">{slot.carrier}</p>
        </div>
        <dl className="grid grid-cols-2 gap-2 text-xs">
          <dt className="text-muted-foreground">{t('docks.dock')}</dt>
          <dd>{slot.dock}</dd>
          <dt className="text-muted-foreground">{t('docks.window')}</dt>
          <dd className="tabular-nums">
            {hourLabel(slot.start)}–{hourLabel(slot.end)}
          </dd>
          <dt className="text-muted-foreground">{t('docks.trailer')}</dt>
          <dd className="font-mono">{slot.trailer}</dd>
          <dt className="text-muted-foreground">{t('docks.pallets')}</dt>
          <dd className="tabular-nums">{slot.pallets}</dd>
          <dt className="text-muted-foreground">{t('docks.status')}</dt>
          <dd>{t(`docks.slotStatus.${slot.status}`)}</dd>
        </dl>
      </PopoverContent>
    </Popover>
  );
}

const QUARTERS = (open: number, close: number) =>
  Array.from({ length: (close - open) * 4 }, (_, i) => open + i / 4);

function BookSlotDialog({ day }: { day: DockDay }) {
  const { t } = useTranslation('logistics');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<NewDockSlot>({
    dock: day.docks[0]!,
    start: 14,
    end: 15,
    direction: 'inbound',
    carrier: '',
    trailer: '',
    pallets: 12,
  });
  const book = useBookSlot({ onSuccess: () => setOpen(false) });
  const set = <K extends keyof NewDockSlot>(key: K, value: NewDockSlot[K]) =>
    setForm((f) => ({ ...f, [key]: value }));
  const duration = form.end - form.start;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) book.reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <CalendarPlus /> {t('docks.book')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('docks.bookTitle')}</DialogTitle>
          <DialogDescription>{t('docks.bookDescription')}</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            book.mutate(form);
          }}
        >
          {book.isError && (
            <Alert variant="destructive" className="sm:col-span-2">
              <AlertDescription>{getErrorMessage(book.error)}</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-2">
            <Label>{t('docks.dock')}</Label>
            <Select value={form.dock} onValueChange={(v) => set('dock', v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {day.docks.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>{t('docks.direction')}</Label>
            <Select
              value={form.direction}
              onValueChange={(v) => set('direction', v as NewDockSlot['direction'])}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inbound">{t('docks.inbound')}</SelectItem>
                <SelectItem value="outbound">{t('docks.outbound')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>{t('docks.start')}</Label>
            <Select
              value={String(form.start)}
              onValueChange={(v) => setForm((f) => ({ ...f, start: +v, end: +v + duration }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {QUARTERS(day.openHour, day.closeHour - 1).map((q) => (
                  <SelectItem key={q} value={String(q)}>
                    {hourLabel(q)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>{t('docks.duration')}</Label>
            <Select
              value={String(duration)}
              onValueChange={(v) => set('end', Math.min(day.closeHour, form.start + +v))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[0.5, 0.75, 1, 1.5, 2, 3].map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    {t('docks.minutes', { value: d * 60 })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="slot-carrier">{t('docks.carrier')}</Label>
            <Input
              id="slot-carrier"
              required
              value={form.carrier}
              onChange={(e) => set('carrier', e.target.value)}
              placeholder="Northline Freight"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="slot-trailer">{t('docks.trailer')}</Label>
              <Input
                id="slot-trailer"
                value={form.trailer}
                onChange={(e) => set('trailer', e.target.value)}
                placeholder="TR-512"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slot-pallets">{t('docks.pallets')}</Label>
              <Input
                id="slot-pallets"
                type="number"
                min={1}
                max={33}
                value={form.pallets}
                onChange={(e) => set('pallets', Number(e.target.value))}
              />
            </div>
          </div>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t('actions.cancel')}
            </Button>
            <Button type="submit" disabled={book.isPending || !form.carrier.trim()}>
              {t('docks.confirm')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DockGrid({ day }: { day: DockDay }) {
  const { t } = useTranslation('logistics');
  const now = useNowHour();
  const span = day.closeHour - day.openHour;
  const hours = Array.from({ length: span + 1 }, (_, i) => day.openHour + i);
  const showNow = now >= day.openHour && now <= day.closeHour;

  return (
    <div className="overflow-x-auto">
      <div className="relative min-w-[60rem]">
        <div className="grid grid-cols-[9rem_1fr] border-b">
          <div className="px-6 py-3 text-xs font-medium text-muted-foreground">
            {t('docks.dock')}
          </div>
          <div className="relative h-10">
            {hours.map((h) => (
              <span
                key={h}
                className="absolute top-3 -translate-x-1/2 text-[0.6875rem] text-muted-foreground tabular-nums first:translate-x-0 last:-translate-x-full"
                style={{ left: `${((h - day.openHour) / span) * 100}%` }}
              >
                {hourLabel(h)}
              </span>
            ))}
          </div>
        </div>
        {day.docks.map((dock) => {
          const slots = day.slots.filter((s) => s.dock === dock);
          const used = slots.reduce((sum, s) => sum + (s.end - s.start), 0);
          return (
            <div key={dock} className="grid grid-cols-[9rem_1fr] border-b last:border-b-0">
              <div className="flex flex-col justify-center px-6 py-3">
                <p className="text-sm font-medium">{dock}</p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {t('docks.utilisation', { value: Math.round((used / span) * 100) })}
                </p>
              </div>
              <div className="relative h-16">
                {hours.slice(1, -1).map((h) => (
                  <span
                    key={h}
                    className="absolute inset-y-0 w-px bg-border/70"
                    style={{ left: `${((h - day.openHour) / span) * 100}%` }}
                  />
                ))}
                {slots.map((slot) => (
                  <SlotBlock key={slot.id} slot={slot} day={day} />
                ))}
              </div>
            </div>
          );
        })}
        {showNow && (
          <div className="pointer-events-none absolute inset-y-0 right-0 left-[9rem]">
            <span
              className="absolute top-0 bottom-0 w-0.5 bg-destructive"
              style={{ left: `${((now - day.openHour) / span) * 100}%` }}
            >
              <span className="absolute top-0 left-1/2 -translate-x-1/2 rounded-b bg-destructive px-1.5 py-0.5 text-[0.625rem] font-medium whitespace-nowrap text-destructive-foreground">
                {t('docks.now')} {hourLabel(now)}
              </span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DocksPage() {
  const { t } = useTranslation('logistics');
  const query = useDocks();
  const day = query.data;
  const now = useNowHour();

  const inbound = day?.slots.filter((s) => s.direction === 'inbound').length ?? 0;
  const outbound = day?.slots.filter((s) => s.direction === 'outbound').length ?? 0;
  const active = day?.slots.filter((s) => s.status === 'loading' || s.status === 'arrived') ?? [];

  return (
    <Page
      title={t('docks.title')}
      description={t('docks.description')}
      width="full"
      actions={day && <BookSlotDialog day={day} />}
    >
      {query.isError ? (
        <LoadError onRetry={() => void query.refetch()} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3 md:gap-6">
            {[
              {
                key: 'inbound',
                label: t('docks.inboundToday'),
                value: inbound,
                color: 'var(--chart-4)',
              },
              {
                key: 'outbound',
                label: t('docks.outboundToday'),
                value: outbound,
                color: 'var(--chart-1)',
              },
              {
                key: 'active',
                label: t('docks.atDocks'),
                value: active.length,
                color: 'var(--chart-2)',
              },
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-center gap-4 rounded-xl border bg-card p-5 shadow-xs"
              >
                <span className="h-10 w-1.5 rounded-full" style={{ background: item.color }} />
                <div>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="text-2xl font-semibold tabular-nums">{day ? item.value : '—'}</p>
                </div>
              </div>
            ))}
          </div>

          <SectionCard
            title={t('docks.schedule')}
            description={t('docks.scheduleDescription', { time: hourLabel(now) })}
            action={
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-sm bg-chart-4" /> {t('docks.inbound')}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-sm bg-chart-1" /> {t('docks.outbound')}
                </span>
              </div>
            }
            flush
          >
            {day ? (
              <div className="border-t">
                <DockGrid day={day} />
              </div>
            ) : (
              <Skeleton className="mx-6 mb-6 h-[30rem]" />
            )}
          </SectionCard>
        </>
      )}
    </Page>
  );
}
