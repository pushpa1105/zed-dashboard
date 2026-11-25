import { Bell, Globe2, SlidersHorizontal, UserPlus, UserRound } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { cn } from '@/shared/lib/cn';
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
import { Separator } from '@/shared/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/ui/sheet';
import { Spinner } from '@/shared/ui/spinner';

import { AccountActions, AccountField } from './account-fields';
import { useAccountForm } from './account-model';

/** 1. Stacked: one column, label above field. The default for narrow forms. */
export function StackedAccountForm() {
  const { form, onSubmit, pending } = useAccountForm();
  return (
    <form onSubmit={onSubmit} noValidate className="mx-auto max-w-md space-y-5">
      <AccountField form={form} name="firstName" />
      <AccountField form={form} name="lastName" />
      <AccountField form={form} name="email" />
      <AccountField form={form} name="role" />
      <AccountActions form={form} pending={pending} align="stretch" />
    </form>
  );
}

/** 2. Two-column grid: related short fields side by side, long ones full width. */
export function GridAccountForm() {
  const { form, onSubmit, pending } = useAccountForm();
  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5 sm:grid-cols-2">
      <AccountField form={form} name="firstName" />
      <AccountField form={form} name="lastName" />
      <AccountField form={form} name="email" className="sm:col-span-2" />
      <AccountField form={form} name="role" />
      <AccountField form={form} name="timezone" />
      <AccountField form={form} name="bio" className="sm:col-span-2" />
      <div className="sm:col-span-2">
        <AccountActions form={form} pending={pending} />
      </div>
    </form>
  );
}

/** 3. Horizontal: label + hint in a left column (settings pages). */
export function HorizontalAccountForm() {
  const { form, onSubmit, pending } = useAccountForm();
  return (
    <form onSubmit={onSubmit} noValidate className="divide-y">
      {(['firstName', 'email', 'timezone', 'bio', 'newsletter'] as const).map((name) => (
        <div key={name} className="py-5 first:pt-0">
          <AccountField form={form} name={name} orientation="horizontal" />
        </div>
      ))}
      <div className="pt-5">
        <AccountActions form={form} pending={pending} />
      </div>
    </form>
  );
}

/** 4. Inline: a single row, labels hidden (filters, quick add, invite bars). */
export function InlineAccountForm() {
  const { t } = useTranslation('ui-forms');
  const { form, onSubmit, pending } = useAccountForm();
  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-3 md:flex-row md:items-start"
    >
      <AccountField form={form} name="firstName" compact className="md:w-40" />
      <AccountField form={form} name="email" compact className="md:flex-1" />
      <AccountField form={form} name="role" compact className="md:w-36" />
      <Button type="submit" disabled={pending} className="md:mt-0">
        {pending ? <Spinner /> : <UserPlus />}
        {t('layouts.invite')}
      </Button>
    </form>
  );
}

/** 5. Card sections: each group in its own bordered card with a footer. */
export function CardSectionsAccountForm() {
  const { t } = useTranslation('ui-forms');
  const { form, onSubmit, pending } = useAccountForm();
  const section = (title: string, hint: string, children: ReactNode) => (
    <section className="overflow-hidden rounded-xl border bg-card">
      <header className="border-b bg-muted/30 px-5 py-4">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </header>
      <div className="grid gap-5 p-5 sm:grid-cols-2">{children}</div>
    </section>
  );
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {section(
        t('layouts.sections.profile'),
        t('layouts.sections.profileHint'),
        <>
          <AccountField form={form} name="firstName" />
          <AccountField form={form} name="lastName" />
          <AccountField form={form} name="bio" className="sm:col-span-2" />
        </>,
      )}
      {section(
        t('layouts.sections.access'),
        t('layouts.sections.accessHint'),
        <>
          <AccountField form={form} name="email" />
          <AccountField form={form} name="role" />
        </>,
      )}
      <AccountActions form={form} pending={pending} />
    </form>
  );
}

/** 6. Settings page: side sub-navigation switches the visible group. */
export function SettingsAccountForm() {
  const { t } = useTranslation('ui-forms');
  const { form, onSubmit, pending } = useAccountForm();
  const tabs = [
    { key: 'profile', icon: UserRound },
    { key: 'regional', icon: Globe2 },
    { key: 'notifications', icon: Bell },
    { key: 'advanced', icon: SlidersHorizontal, disabled: true },
  ] as const;
  const [tab, setTab] = useState<(typeof tabs)[number]['key']>('profile');

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6 md:grid-cols-[13rem_1fr]">
      <nav className="flex gap-1 overflow-x-auto md:flex-col" aria-label={t('layouts.settingsNav')}>
        {tabs.map(({ key, icon: Icon, ...rest }) => (
          <button
            key={key}
            type="button"
            disabled={'disabled' in rest && rest.disabled}
            onClick={() => setTab(key)}
            aria-current={tab === key ? 'page' : undefined}
            className={cn(
              'flex h-9 shrink-0 items-center gap-2.5 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-45',
              tab === key && 'bg-muted font-medium text-foreground',
            )}
          >
            <Icon className="size-4" />
            {t(`layouts.settingsTabs.${key}`)}
          </button>
        ))}
      </nav>
      <div className="space-y-5">
        <div>
          <h3 className="text-base font-semibold">{t(`layouts.settingsTabs.${tab}`)}</h3>
          <p className="text-sm text-muted-foreground">{t(`layouts.settingsHints.${tab}`)}</p>
        </div>
        <Separator />
        {tab === 'profile' && (
          <div className="grid gap-5 sm:grid-cols-2">
            <AccountField form={form} name="firstName" />
            <AccountField form={form} name="lastName" />
            <AccountField form={form} name="bio" className="sm:col-span-2" />
          </div>
        )}
        {tab === 'regional' && (
          <div className="grid gap-5 sm:grid-cols-2">
            <AccountField form={form} name="timezone" />
            <AccountField form={form} name="role" />
          </div>
        )}
        {tab === 'notifications' && (
          <div className="space-y-5">
            <AccountField form={form} name="email" />
            <AccountField form={form} name="newsletter" orientation="horizontal" />
          </div>
        )}
        <AccountActions form={form} pending={pending} />
      </div>
    </form>
  );
}

/** 7. Modal: a dialog with the form; closes on success. */
export function ModalAccountForm() {
  const { t } = useTranslation('ui-forms');
  const [open, setOpen] = useState(false);
  const { form, onSubmit, pending } = useAccountForm(() => setOpen(false));
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">{t('layouts.openModal')}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={onSubmit} noValidate className="space-y-5">
          <DialogHeader>
            <DialogTitle>{t('layouts.modalTitle')}</DialogTitle>
            <DialogDescription>{t('layouts.modalDescription')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 sm:grid-cols-2">
            <AccountField form={form} name="firstName" />
            <AccountField form={form} name="lastName" />
            <AccountField form={form} name="email" className="sm:col-span-2" />
            <AccountField form={form} name="role" className="sm:col-span-2" />
          </div>
          <DialogFooter>
            <AccountActions form={form} pending={pending} onCancel={() => setOpen(false)} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** 8. Drawer: a side sheet with a scrolling body and a pinned footer. */
export function DrawerAccountForm() {
  const { t } = useTranslation('ui-forms');
  const [open, setOpen] = useState(false);
  const { form, onSubmit, pending } = useAccountForm(() => setOpen(false));
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline">{t('layouts.openDrawer')}</Button>
      </SheetTrigger>
      <SheetContent className="w-full gap-0 sm:max-w-md">
        <form onSubmit={onSubmit} noValidate className="flex h-full flex-col">
          <SheetHeader className="border-b">
            <SheetTitle>{t('layouts.drawerTitle')}</SheetTitle>
            <SheetDescription>{t('layouts.drawerDescription')}</SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-5 overflow-y-auto p-4">
            <AccountField form={form} name="firstName" />
            <AccountField form={form} name="lastName" />
            <AccountField form={form} name="email" />
            <AccountField form={form} name="role" />
            <AccountField form={form} name="timezone" />
            <AccountField form={form} name="bio" />
            <AccountField form={form} name="newsletter" />
          </div>
          <SheetFooter className="border-t">
            <AccountActions
              form={form}
              pending={pending}
              onCancel={() => setOpen(false)}
              align="stretch"
            />
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
