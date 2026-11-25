import { BellRing, Layers, Share2, Sparkles } from 'lucide-react';
import { useState } from 'react';

import { BrandLogo } from '@/core/brand/components/brand-logo';
import { useTranslation } from '@/core/i18n/use-translation';
import { Head } from '@/core/layout/head';
import { notify } from '@/core/notify/notify';
import { Countdown } from '@/shared/components/display/countdown';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

import { BackToGallery } from '../components/template-kit';

/** Launch in 23 days from the first visit (deterministic within a session). */
const LAUNCH = Date.now() + 23 * 86_400_000 + 7 * 3_600_000;

const TEASERS = [
  { key: 'canvas', icon: Layers },
  { key: 'share', icon: Share2 },
  { key: 'ai', icon: Sparkles },
] as const;

/** Marketing template: pre-launch page with a countdown and a waitlist. */
export default function ComingSoonPage() {
  const { t } = useTranslation('pages');
  const [email, setEmail] = useState('');

  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-background">
      <Head title={t('templates.comingSoon.title')} />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[36rem] bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--primary)_18%,transparent),transparent_65%)]"
      />
      <header className="relative flex h-16 items-center justify-center">
        <BrandLogo />
      </header>
      <main className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col items-center px-6 pt-10 pb-20 text-center">
        <p className="text-sm font-medium text-primary">{t('status.comingSoon.eyebrow')}</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-balance md:text-6xl">
          {t('status.comingSoon.title')}
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted-foreground">{t('status.comingSoon.body')}</p>
        <Countdown
          to={LAUNCH}
          className="mt-10"
          labels={{
            days: t('status.comingSoon.units.days'),
            hours: t('status.comingSoon.units.hours'),
            minutes: t('status.comingSoon.units.minutes'),
            seconds: t('status.comingSoon.units.seconds'),
          }}
        />
        <form
          className="mt-10 flex w-full max-w-md gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!/^\S+@\S+\.\S+$/.test(email)) return;
            notify.success(t('status.comingSoon.joined'), { description: email });
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
          <Button type="submit">
            <BellRing /> {t('status.comingSoon.notify')}
          </Button>
        </form>
        <p className="mt-3 text-xs text-muted-foreground">{t('status.comingSoon.count')}</p>
        <div className="mt-16 grid w-full gap-4 text-left sm:grid-cols-3">
          {TEASERS.map(({ key, icon: Icon }) => (
            <div key={key} className="rounded-xl border bg-card p-5">
              <Icon className="size-4 text-primary" />
              <p className="mt-3 text-sm font-medium">
                {t(`status.comingSoon.teasers.${key}.title`)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t(`status.comingSoon.teasers.${key}.body`)}
              </p>
            </div>
          ))}
        </div>
      </main>
      <BackToGallery />
    </div>
  );
}
