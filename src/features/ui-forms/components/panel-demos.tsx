import { CalendarDays, Filter, Info, MapPin } from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { notify } from '@/core/notify/notify';
import { DateRangePicker } from '@/shared/components/forms/date-range-picker';
import { MultiSelect } from '@/shared/components/forms/multi-select';
import { RangeSlider } from '@/shared/components/forms/range-slider';
import { SwitchRow } from '@/shared/components/forms/switch-row';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/shared/ui/drawer';
import { Field, FieldLabel } from '@/shared/ui/field';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/shared/ui/hover-card';
import { Input } from '@/shared/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/ui/sheet';
import { Textarea } from '@/shared/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';

import { TEAM_OPTIONS } from './sample-data';
import { Demo } from './showcase';

const SIDES = ['top', 'right', 'bottom', 'left'] as const;

function FilterSheet({ side }: { side: (typeof SIDES)[number] }) {
  const { t } = useTranslation('ui-forms');
  const [teams, setTeams] = useState<string[]>(['design']);
  const horizontal = side === 'left' || side === 'right';
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="capitalize">
          {t(`panels.sides.${side}`)}
        </Button>
      </SheetTrigger>
      <SheetContent side={side} className={horizontal ? 'sm:max-w-md' : undefined}>
        <SheetHeader>
          <SheetTitle>{t('panels.sheetTitle')}</SheetTitle>
          <SheetDescription>{t('panels.sheetText')}</SheetDescription>
        </SheetHeader>
        <div className={horizontal ? 'grid gap-5 px-4' : 'grid gap-5 px-4 sm:grid-cols-3'}>
          <Field>
            <FieldLabel>{t('panels.dateRange')}</FieldLabel>
            <DateRangePicker />
          </Field>
          <Field>
            <FieldLabel>{t('dialogs.teams')}</FieldLabel>
            <MultiSelect options={TEAM_OPTIONS} value={teams} onChange={setTeams} />
          </Field>
          <Field>
            <FieldLabel>{t('panels.amount')}</FieldLabel>
            <RangeSlider defaultValue={[200, 800]} min={0} max={1000} step={50} inputs={false} />
          </Field>
          <SwitchRow label={t('panels.onlyMine')} description={t('panels.onlyMineHint')} />
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button onClick={() => notify.success(t('panels.applied'))}>{t('panels.apply')}</Button>
          </SheetClose>
          <SheetClose asChild>
            <Button variant="ghost">{t('panels.reset')}</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function DrawerDemo() {
  const { t } = useTranslation('ui-forms');
  const snapPoints = [0.45, 1];
  const [snap, setSnap] = useState<number | string | null>(snapPoints[0]!);
  return (
    <div className="flex flex-wrap gap-2">
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="outline">{t('panels.drawer')}</Button>
        </DrawerTrigger>
        <DrawerContent>
          <div className="mx-auto w-full max-w-md">
            <DrawerHeader>
              <DrawerTitle>{t('panels.drawerTitle')}</DrawerTitle>
              <DrawerDescription>{t('panels.drawerText')}</DrawerDescription>
            </DrawerHeader>
            <div className="px-4">
              <Textarea rows={4} placeholder={t('panels.feedbackPlaceholder')} />
            </div>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button onClick={() => notify.success(t('panels.thanks'))}>
                  {t('panels.send')}
                </Button>
              </DrawerClose>
              <DrawerClose asChild>
                <Button variant="ghost">{t('dialogs.cancel')}</Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
      <Drawer snapPoints={snapPoints} activeSnapPoint={snap} setActiveSnapPoint={setSnap}>
        <DrawerTrigger asChild>
          <Button variant="outline">{t('panels.snapDrawer')}</Button>
        </DrawerTrigger>
        <DrawerContent className="h-full max-h-[96svh]">
          <DrawerHeader>
            <DrawerTitle>{t('panels.snapTitle')}</DrawerTitle>
            <DrawerDescription>{t('panels.snapText')}</DrawerDescription>
          </DrawerHeader>
          <ul className="mx-auto w-full max-w-md divide-y overflow-y-auto px-4">
            {Array.from({ length: 12 }, (_, i) => (
              <li key={i} className="flex items-center gap-3 py-3 text-sm">
                <MapPin className="size-4 text-muted-foreground" />
                {t('panels.stop', { n: i + 1 })}
                <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                  {(i + 1) * 4} min
                </span>
              </li>
            ))}
          </ul>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

function PopoverForm() {
  const { t } = useTranslation('ui-forms');
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <CalendarDays /> {t('panels.popoverForm')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            setOpen(false);
            notify.success(t('panels.reminderSet'));
          }}
        >
          <div className="space-y-1">
            <p className="text-sm font-medium">{t('panels.reminderTitle')}</p>
            <p className="text-xs text-muted-foreground">{t('panels.reminderText')}</p>
          </div>
          <Field>
            <FieldLabel htmlFor="reminder-title">{t('panels.what')}</FieldLabel>
            <Input id="reminder-title" defaultValue={t('panels.reminderDefault')} />
          </Field>
          <Field>
            <FieldLabel htmlFor="reminder-when">{t('panels.when')}</FieldLabel>
            <Input id="reminder-when" type="datetime-local" />
          </Field>
          <Button type="submit" size="sm">
            {t('panels.save')}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}

function UserHoverCard() {
  const { t } = useTranslation('ui-forms');
  return (
    <HoverCard openDelay={150}>
      <HoverCardTrigger asChild>
        <a
          href="#hannah"
          onClick={(e) => e.preventDefault()}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          @hannah.morgan
        </a>
      </HoverCardTrigger>
      <HoverCardContent className="w-72" align="start">
        <div className="flex gap-3">
          <Avatar className="size-10">
            <AvatarFallback className="bg-primary/10 text-primary">HM</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <p className="text-sm font-semibold">Hannah Morgan</p>
            <p className="text-xs text-muted-foreground">{t('panels.hoverRole')}</p>
            <p className="flex items-center gap-1 pt-1 text-xs text-muted-foreground">
              <MapPin className="size-3" /> Kathmandu · 14:20
            </p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 border-t pt-3 text-center">
          {[
            ['128', t('panels.tasks')],
            ['24', t('panels.projects')],
            ['4.9', t('panels.rating')],
          ].map(([value, label]) => (
            <div key={label}>
              <p className="text-sm font-semibold tabular-nums">{value}</p>
              <p className="text-[11px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

function TooltipDemos() {
  const { t } = useTranslation('ui-forms');
  return (
    <div className="flex flex-wrap items-center gap-2">
      {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
        <Tooltip key={side}>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm">
              {t(`panels.sides.${side}`)}
            </Button>
          </TooltipTrigger>
          <TooltipContent side={side}>
            {t('panels.tooltipOn', { side: t(`panels.sides.${side}`) })}
          </TooltipContent>
        </Tooltip>
      ))}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={t('panels.info')}>
            <Info />
          </Button>
        </TooltipTrigger>
        <TooltipContent className="max-w-56">{t('panels.richTooltip')}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={0} className="inline-flex">
            <Button size="sm" disabled>
              <Filter /> {t('panels.disabledAction')}
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>{t('panels.disabledReason')}</TooltipContent>
      </Tooltip>
    </div>
  );
}

/** Sheets, drawers, popovers, hover cards and tooltips. */
export function PanelDemos() {
  const { t } = useTranslation('ui-forms');
  return (
    <>
      <Demo title={t('panels.sheets')} description={t('panels.sheetsText')}>
        <div className="flex flex-wrap gap-2">
          {SIDES.map((side) => (
            <FilterSheet key={side} side={side} />
          ))}
        </div>
      </Demo>
      <Demo title={t('panels.drawers')} description={t('panels.drawersText')}>
        <DrawerDemo />
      </Demo>
      <Demo title={t('panels.popovers')} description={t('panels.popoversText')}>
        <div className="flex flex-wrap items-center gap-4">
          <PopoverForm />
          <UserHoverCard />
        </div>
      </Demo>
      <Demo title={t('panels.tooltips')} description={t('panels.tooltipsText')}>
        <TooltipDemos />
      </Demo>
    </>
  );
}
