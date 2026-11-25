import { zodResolver } from '@hookform/resolvers/zod';
import { Bell, Building2, ShieldCheck, TriangleAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import type { PageModule } from '@/core/feature/define-feature';
import { FormField } from '@/core/forms/form-field';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { notify } from '@/core/notify/notify';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { ErrorState } from '@/shared/components/display/error-state';
import { NumberInput } from '@/shared/components/forms/number-input';
import { SwitchRow } from '@/shared/components/forms/switch-row';
import { TagInput } from '@/shared/components/forms/tag-input';
import { cn } from '@/shared/lib/cn';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ui/alert-dialog';
import { Button } from '@/shared/ui/button';
import { FieldGroup } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Skeleton } from '@/shared/ui/skeleton';

import { settingsQuery, useSaveSettings, useSettings } from '../api/platform-api';
import { REGIONS, settingsSchema, type Settings } from '../model/platform';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(settingsQuery());
    return null;
  };

const SECTIONS = [
  { id: 'general', icon: Building2 },
  { id: 'security', icon: ShieldCheck },
  { id: 'notifications', icon: Bell },
  { id: 'danger', icon: TriangleAlert },
] as const;
const TIMEZONES = [
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Singapore',
  'Australia/Sydney',
];
const CIDR = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;

function SettingsForm({ initial }: { initial: Settings }) {
  const { t } = useTranslation('saas');
  const save = useSaveSettings();
  const [confirm, setConfirm] = useState('');
  const form = useForm<Settings>({ resolver: zodResolver(settingsSchema), defaultValues: initial });
  const { isDirty } = form.formState;

  useEffect(() => form.reset(initial), [initial, form]);

  return (
    <form
      noValidate
      className="min-w-0 space-y-6 pb-24"
      onSubmit={form.handleSubmit((values) => save.mutate(values))}
    >
      <SectionCard
        title={t('settings.sections.general')}
        description={t('settings.hints.general')}
        className="scroll-mt-24"
      >
        <div id="general" className="scroll-mt-24" />
        <FieldGroup className="max-w-xl">
          <FormField
            control={form.control}
            name="workspaceName"
            label={t('settings.name')}
            required
            render={({ field, id, invalid }) => <Input id={id} aria-invalid={invalid} {...field} />}
          />
          <FormField
            control={form.control}
            name="slug"
            label={t('settings.slug')}
            description={t('settings.slugHint')}
            render={({ field, id, invalid }) => (
              <div className="flex">
                <span className="flex h-9 items-center rounded-l-lg border border-r-0 bg-muted px-3 text-sm text-muted-foreground">
                  console.example.com/
                </span>
                <Input id={id} aria-invalid={invalid} className="rounded-l-none" {...field} />
              </div>
            )}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="region"
              label={t('settings.region')}
              render={({ field, id }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id={id} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REGIONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {t(`settings.regions.${r}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FormField
              control={form.control}
              name="timezone"
              label={t('settings.timezone')}
              render={({ field, id }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id={id} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </FieldGroup>
      </SectionCard>

      <SectionCard
        title={t('settings.sections.security')}
        description={t('settings.hints.security')}
      >
        <div id="security" className="scroll-mt-24" />
        <FieldGroup className="max-w-xl">
          <FormField
            control={form.control}
            name="requireMfa"
            render={({ field }) => (
              <SwitchRow
                bordered
                label={t('settings.requireMfa')}
                description={t('settings.requireMfaHint')}
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <FormField
            control={form.control}
            name="sessionTimeout"
            label={t('settings.session')}
            description={t('settings.sessionHint')}
            render={({ field, id, invalid }) => (
              <NumberInput
                id={id}
                value={field.value}
                onChange={(v) => field.onChange(v ?? 15)}
                min={15}
                max={1440}
                step={15}
                suffix={t('settings.minutes')}
                invalid={invalid}
                className="max-w-48"
              />
            )}
          />
          <FormField
            control={form.control}
            name="ipAllowlist"
            label={t('settings.allowlist')}
            description={t('settings.allowlistHint')}
            render={({ field, id }) => (
              <TagInput
                id={id}
                value={field.value}
                onChange={field.onChange}
                placeholder="203.0.113.0/24"
                validate={(tag) => (CIDR.test(tag) ? undefined : t('settings.invalidIp'))}
              />
            )}
          />
        </FieldGroup>
      </SectionCard>

      <SectionCard
        title={t('settings.sections.notifications')}
        description={t('settings.hints.notifications')}
      >
        <div id="notifications" className="scroll-mt-24" />
        <div className="max-w-xl divide-y rounded-lg border">
          {(['usageAlerts', 'incidents', 'weeklyDigest', 'productNews'] as const).map((key) => (
            <FormField
              key={key}
              control={form.control}
              name={`notifications.${key}`}
              render={({ field }) => (
                <SwitchRow
                  className="px-4 py-3"
                  label={t(`settings.notify.${key}`)}
                  description={t(`settings.notifyHints.${key}`)}
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          ))}
        </div>
      </SectionCard>

      <section id="danger" className="scroll-mt-24 rounded-xl border border-destructive/40 bg-card">
        <div className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-destructive">
              {t('settings.sections.danger')}
            </h2>
            <p className="text-sm text-muted-foreground">{t('settings.hints.danger')}</p>
          </div>
          <AlertDialog onOpenChange={() => setConfirm('')}>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive">
                {t('settings.delete')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('settings.deleteTitle')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('settings.deleteDescription', { slug: initial.slug })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Input
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder={initial.slug}
                aria-label={t('settings.deleteConfirmLabel')}
              />
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  disabled={confirm !== initial.slug}
                  onClick={() => notify.info(t('settings.deleteDemo'))}
                >
                  {t('settings.delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </section>

      <div
        className={cn(
          'fixed inset-x-0 bottom-4 z-30 mx-auto flex w-[min(36rem,calc(100%-2rem))] items-center gap-3 rounded-xl border bg-popover/95 px-4 py-3 shadow-lg backdrop-blur transition-all',
          isDirty ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0',
        )}
        role="status"
      >
        <span className="size-2 rounded-full bg-warning" />
        <p className="text-sm font-medium">{t('settings.unsaved')}</p>
        <div className="ml-auto flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => form.reset()}>
            {t('settings.discard')}
          </Button>
          <Button type="submit" size="sm" disabled={save.isPending}>
            {t('settings.save')}
          </Button>
        </div>
      </div>
    </form>
  );
}

/** Workspace settings with a section index on the side. */
export default function SettingsPage() {
  const { t } = useTranslation('saas');
  const settings = useSettings();
  const [active, setActive] = useState<string>('general');

  return (
    <Page width="wide" title={t('settings.title')} description={t('settings.description')}>
      <div className="grid items-start gap-8 lg:grid-cols-[13rem_1fr]">
        <nav
          className="flex gap-1 overflow-x-auto lg:sticky lg:top-24 lg:flex-col"
          aria-label={t('settings.title')}
        >
          {SECTIONS.map(({ id, icon: Icon }) => (
            <a
              key={id}
              href={`#${id}`}
              onClick={() => setActive(id)}
              aria-current={active === id ? 'true' : undefined}
              className={cn(
                'inline-flex h-9 shrink-0 items-center gap-2.5 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
                active === id && 'bg-accent font-medium text-accent-foreground',
                id === 'danger' && 'hover:text-destructive',
              )}
            >
              <Icon className="size-4" />
              {t(`settings.sections.${id}`)}
            </a>
          ))}
        </nav>
        {settings.isError ? (
          <ErrorState title={t('common.error')} onRetry={() => void settings.refetch()} />
        ) : settings.data ? (
          <SettingsForm initial={settings.data} />
        ) : (
          <div className="space-y-6">
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        )}
      </div>
    </Page>
  );
}
