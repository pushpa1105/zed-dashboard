import {
  Bell,
  CreditCard,
  Download,
  KeyRound,
  Laptop,
  Plug,
  ShieldCheck,
  Smartphone,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { notify } from '@/core/notify/notify';
import { useSearchParams } from '@/core/router/router';
import { MeterList } from '@/shared/components/dashboard/meter-list';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatusBadge } from '@/shared/components/display/status-badge';
import { AvatarUpload } from '@/shared/components/forms/avatar-upload';
import { PasswordInput } from '@/shared/components/forms/password-input';
import { SwitchRow } from '@/shared/components/forms/switch-row';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Switch } from '@/shared/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Textarea } from '@/shared/ui/textarea';

import { INTEGRATIONS, INVOICES, PROFILE, SESSIONS } from '../model/demo-data';

const SECTIONS: Array<{ key: Section; icon: LucideIcon }> = [
  { key: 'profile', icon: UserRound },
  { key: 'security', icon: ShieldCheck },
  { key: 'notifications', icon: Bell },
  { key: 'billing', icon: CreditCard },
  { key: 'integrations', icon: Plug },
];
type Section = 'profile' | 'security' | 'notifications' | 'billing' | 'integrations';
const isSection = (value: string | null): value is Section => SECTIONS.some((s) => s.key === value);

/** Label column + fields, the standard settings row. */
function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="grid gap-3 border-t py-6 first:border-t-0 first:pt-0 md:grid-cols-[14rem_1fr] md:gap-8">
      <div className="space-y-1">
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      </div>
      <div className="max-w-xl min-w-0">{children}</div>
    </div>
  );
}

function ProfileSection() {
  const { t } = useTranslation('pages');
  return (
    <SectionCard
      title={t('account.sections.profile')}
      description={t('account.profile.description')}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost">{t('account.cancel')}</Button>
          <Button onClick={() => notify.success(t('account.saved'))}>{t('account.save')}</Button>
        </div>
      }
    >
      <Row label={t('account.profile.photo')} hint={t('account.profile.photoHint')}>
        <AvatarUpload fallback="HM" />
      </Row>
      <Row label={t('account.profile.name')}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input defaultValue="Hannah" aria-label={t('account.profile.firstName')} />
          <Input defaultValue="Morgan" aria-label={t('account.profile.lastName')} />
        </div>
      </Row>
      <Row label={t('account.profile.email')} hint={t('account.profile.emailHint')}>
        <Input type="email" defaultValue={PROFILE.email} />
      </Row>
      <Row label={t('account.profile.timezone')}>
        <Select defaultValue="lisbon">
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lisbon">Europe/Lisbon (UTC+0)</SelectItem>
            <SelectItem value="berlin">Europe/Berlin (UTC+1)</SelectItem>
            <SelectItem value="ny">America/New_York (UTC−5)</SelectItem>
            <SelectItem value="tokyo">Asia/Tokyo (UTC+9)</SelectItem>
          </SelectContent>
        </Select>
      </Row>
      <Row label={t('account.profile.bio')} hint={t('account.profile.bioHint')}>
        <Textarea rows={4} defaultValue={PROFILE.bio} />
      </Row>
    </SectionCard>
  );
}

function SecuritySection() {
  const { t } = useTranslation('pages');
  const [sessions, setSessions] = useState<readonly (typeof SESSIONS)[number][]>(SESSIONS);
  return (
    <div className="grid gap-6">
      <SectionCard
        title={t('account.security.password')}
        description={t('account.security.passwordHint')}
        footer={
          <div className="flex justify-end">
            <Button onClick={() => notify.success(t('account.saved'))}>
              <KeyRound /> {t('account.security.update')}
            </Button>
          </div>
        }
      >
        <div className="grid max-w-xl gap-4">
          <div className="grid gap-2">
            <Label htmlFor="acc-current">{t('account.security.current')}</Label>
            <PasswordInput id="acc-current" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="acc-new">{t('account.security.new')}</Label>
            <PasswordInput id="acc-new" showStrength />
          </div>
        </div>
      </SectionCard>
      <SectionCard
        title={t('account.security.twoFactor')}
        description={t('account.security.twoFactorHint')}
      >
        <div className="grid gap-3">
          <SwitchRow
            bordered
            defaultChecked
            icon={<Smartphone className="size-4" />}
            label={t('account.security.app')}
            description={t('account.security.appHint')}
          />
          <SwitchRow
            bordered
            icon={<KeyRound className="size-4" />}
            label={t('account.security.keys')}
            description={t('account.security.keysHint')}
          />
        </div>
      </SectionCard>
      <SectionCard
        title={t('account.security.sessions')}
        description={t('account.security.sessionsHint')}
        flush
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSessions((s) => s.filter((x) => x.current))}
          >
            {t('account.security.signOutOthers')}
          </Button>
        }
      >
        <ul className="divide-y border-t">
          {sessions.map((s) => (
            <li key={s.id} className="flex items-center gap-4 px-6 py-4">
              <span className="flex size-9 items-center justify-center rounded-lg bg-muted">
                {s.device.includes('iPhone') ? (
                  <Smartphone className="size-4" />
                ) : (
                  <Laptop className="size-4" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{s.device}</p>
                <p className="text-xs text-muted-foreground">
                  {s.location} · {s.active}
                </p>
              </div>
              {s.current ? (
                <StatusBadge status="active" label={t('account.security.thisDevice')} />
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSessions((list) => list.filter((x) => x.id !== s.id));
                    notify.success(t('account.security.revoked'));
                  }}
                >
                  {t('account.security.revoke')}
                </Button>
              )}
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}

const EVENTS = ['mentions', 'assigned', 'digest', 'alerts', 'billing', 'product'] as const;
const CHANNELS = ['email', 'push', 'slack'] as const;

function NotificationsSection() {
  const { t } = useTranslation('pages');
  return (
    <SectionCard
      title={t('account.sections.notifications')}
      description={t('account.notifications.description')}
      flush
      footer={
        <div className="flex justify-end">
          <Button onClick={() => notify.success(t('account.saved'))}>{t('account.save')}</Button>
        </div>
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-6">{t('account.notifications.event')}</TableHead>
            {CHANNELS.map((c) => (
              <TableHead key={c} className="w-24 text-center">
                {t(`account.notifications.channels.${c}`)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {EVENTS.map((event, i) => (
            <TableRow key={event}>
              <TableCell className="pl-6 whitespace-normal">
                <p className="font-medium">{t(`account.notifications.events.${event}.title`)}</p>
                <p className="text-xs text-muted-foreground">
                  {t(`account.notifications.events.${event}.hint`)}
                </p>
              </TableCell>
              {CHANNELS.map((c, j) => (
                <TableCell key={c} className="text-center">
                  <Checkbox
                    defaultChecked={(i + j) % 3 !== 2}
                    aria-label={`${t(`account.notifications.events.${event}.title`)} · ${t(`account.notifications.channels.${c}`)}`}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  );
}

function BillingSection() {
  const { t } = useTranslation('pages');
  return (
    <div className="grid gap-6">
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <SectionCard
          title={t('account.billing.plan')}
          action={<Button size="sm">{t('account.billing.upgrade')}</Button>}
        >
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-semibold tracking-tight tabular-nums">$790</p>
            <p className="text-sm text-muted-foreground">{t('account.billing.perMonth')}</p>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{t('account.billing.planName')}</p>
          <MeterList
            className="mt-6"
            items={[
              { key: 'seats', label: t('account.billing.seats'), value: 21, max: 25 },
              { key: 'dash', label: t('account.billing.dashboards'), value: 64, max: 100 },
              {
                key: 'api',
                label: t('account.billing.api'),
                value: 1.8,
                max: 5,
                display: '1.8M / 5M',
              },
            ]}
          />
        </SectionCard>
        <SectionCard title={t('account.billing.method')}>
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-foreground to-foreground/80 p-5 text-background">
            <p className="text-xs opacity-70">{t('account.billing.card')}</p>
            <p className="mt-6 font-mono text-lg tracking-widest">•••• •••• •••• 4242</p>
            <div className="mt-4 flex justify-between text-xs opacity-80">
              <span>Hannah Morgan</span>
              <span>09 / 28</span>
            </div>
          </div>
          <Button variant="outline" className="mt-4 w-full">
            {t('account.billing.change')}
          </Button>
        </SectionCard>
      </div>
      <SectionCard title={t('account.billing.invoices')} flush>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">{t('account.billing.invoice')}</TableHead>
              <TableHead>{t('account.billing.date')}</TableHead>
              <TableHead>{t('account.billing.status')}</TableHead>
              <TableHead className="text-right">{t('account.billing.amount')}</TableHead>
              <TableHead className="w-16 pr-6" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {INVOICES.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="pl-6 font-mono text-xs">{invoice.id}</TableCell>
                <TableCell className="text-muted-foreground">{invoice.date}</TableCell>
                <TableCell>
                  <StatusBadge
                    status={invoice.status}
                    label={t(`account.billing.statuses.${invoice.status}`)}
                  />
                </TableCell>
                <TableCell className="text-right tabular-nums">{invoice.amount}</TableCell>
                <TableCell className="pr-6 text-right">
                  <Button variant="ghost" size="icon-sm" aria-label={t('account.billing.download')}>
                    <Download />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}

function IntegrationsSection() {
  const { t } = useTranslation('pages');
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {INTEGRATIONS.map((app) => (
        <div key={app.key} className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg border bg-muted/50 text-sm font-semibold">
              {app.name.slice(0, 2)}
            </span>
            <Switch
              defaultChecked={app.connected}
              aria-label={app.name}
              onCheckedChange={(on) =>
                notify.success(
                  t(on ? 'account.integrations.connected' : 'account.integrations.disconnected', {
                    name: app.name,
                  }),
                )
              }
            />
          </div>
          <div>
            <p className="font-medium">{app.name}</p>
            <p className="text-sm text-muted-foreground">
              {t(`account.integrations.items.${app.key}`)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/** In-app template: account settings with a side menu (state in `?section=`). */
export default function AccountPage() {
  const { t } = useTranslation('pages');
  const [params, setParams] = useSearchParams();
  const raw = params.get('section');
  const section: Section = isSection(raw) ? raw : 'profile';

  return (
    <Page title={t('account.title')} description={t('account.description')} width="full">
      <div className="grid gap-6 lg:grid-cols-[15rem_1fr] lg:gap-8">
        <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label={t('account.title')}>
          {SECTIONS.map(({ key, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setParams({ section: key }, { replace: true })}
              aria-current={section === key ? 'page' : undefined}
              className={cn(
                'flex h-9 shrink-0 items-center gap-2.5 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground',
                section === key && 'bg-accent font-medium text-accent-foreground',
              )}
            >
              <Icon className="size-4" />
              {t(`account.sections.${key}`)}
            </button>
          ))}
        </nav>
        <div className="min-w-0">
          {section === 'profile' && <ProfileSection />}
          {section === 'security' && <SecuritySection />}
          {section === 'notifications' && <NotificationsSection />}
          {section === 'billing' && <BillingSection />}
          {section === 'integrations' && <IntegrationsSection />}
        </div>
      </div>
    </Page>
  );
}
