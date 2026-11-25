import { CheckCircle2, CircleDashed, Loader2, Wrench } from 'lucide-react';
import { useState } from 'react';

import { BrandLogo } from '@/core/brand/components/brand-logo';
import { useTranslation } from '@/core/i18n/use-translation';
import { Head } from '@/core/layout/head';
import { notify } from '@/core/notify/notify';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Progress } from '@/shared/ui/progress';

import { BackToGallery } from '../components/template-kit';

const STEPS = [
  { key: 'backup', state: 'done', time: '02:00' },
  { key: 'migrate', state: 'done', time: '02:14' },
  { key: 'reindex', state: 'active', time: '02:31' },
  { key: 'verify', state: 'todo', time: '—' },
] as const;

/** Status template: planned maintenance with live progress and an update sign-up. */
export default function MaintenancePage() {
  const { t } = useTranslation('pages');
  const [email, setEmail] = useState('');

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <Head title={t('templates.maintenance.title')} />
      <header className="flex h-16 items-center px-6">
        <BrandLogo />
      </header>
      <main className="mx-auto grid w-full max-w-5xl flex-1 items-center gap-12 px-6 pb-16 md:grid-cols-[1.1fr_1fr]">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border bg-warning/10 px-3 py-1 text-xs font-medium">
            <Wrench className="size-3.5" /> {t('status.maintenance.badge')}
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-balance">
            {t('status.maintenance.title')}
          </h1>
          <p className="text-muted-foreground">{t('status.maintenance.body')}</p>
          <form
            className="flex max-w-sm gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!/^\S+@\S+\.\S+$/.test(email)) return;
              notify.success(t('status.maintenance.subscribed'));
              setEmail('');
            }}
          >
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              aria-label={t('auth.fields.email')}
            />
            <Button type="submit">{t('status.maintenance.notify')}</Button>
          </form>
        </div>
        <section className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold">{t('status.maintenance.progress')}</h2>
            <span className="text-sm text-muted-foreground tabular-nums">62%</span>
          </div>
          <Progress value={62} className="mt-3" />
          <p className="mt-2 text-xs text-muted-foreground">{t('status.maintenance.eta')}</p>
          <ol className="mt-6 space-y-4">
            {STEPS.map((step) => {
              const Icon =
                step.state === 'done'
                  ? CheckCircle2
                  : step.state === 'active'
                    ? Loader2
                    : CircleDashed;
              return (
                <li key={step.key} className="flex items-start gap-3">
                  <Icon
                    className={cn(
                      'mt-0.5 size-4 shrink-0',
                      step.state === 'done' && 'text-success',
                      step.state === 'active' && 'animate-spin text-primary',
                      step.state === 'todo' && 'text-muted-foreground',
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-sm', step.state === 'todo' && 'text-muted-foreground')}>
                      {t(`status.maintenance.steps.${step.key}`)}
                    </p>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">{step.time}</span>
                </li>
              );
            })}
          </ol>
        </section>
      </main>
      <BackToGallery />
    </div>
  );
}
