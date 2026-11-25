import {
  BellOff,
  Check,
  CircleCheck,
  Minus,
  MousePointerClick,
  ScrollText,
  TrainFront,
  X,
} from 'lucide-react';
import { useState } from 'react';

import { BrandLogo } from '@/core/brand/components/brand-logo';
import { routes } from '@/core/config/routes';
import { LanguageSwitcher } from '@/core/i18n/components/language-switcher';
import { useTranslation } from '@/core/i18n/use-translation';
import { Head } from '@/core/layout/head';
import { Link } from '@/core/router/router';
import { ModeToggle } from '@/core/theme/components/mode-toggle';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';

import { EmailCaptureForm } from '../components/email-capture-form';
import { TemplateSwitcher } from '../components/template-switcher';

function Waitlist() {
  const { t } = useTranslation('landing');
  const [joined, setJoined] = useState<string | null>(null);

  if (joined) {
    return (
      <div role="status" className="rounded-2xl border bg-card p-5 text-left">
        <p className="flex items-center gap-2 font-medium">
          <CircleCheck className="size-5 text-success" />
          {t('product.waitlist.successTitle')}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('product.waitlist.successBody', { email: joined })}
        </p>
        <Button variant="link" className="mt-1 h-auto px-0" onClick={() => setJoined(null)}>
          {t('product.waitlist.again')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <EmailCaptureForm submitLabel={t('product.waitlist.submit')} onSubmitted={setJoined} />
      <p className="text-xs text-muted-foreground">{t('product.waitlist.count')}</p>
    </div>
  );
}

/** A phone showing the morning brief: real markup, themed with the app. */
function PhoneBrief() {
  const { t } = useTranslation('landing');
  const lines = [
    { key: 'line1', tone: 'up' },
    { key: 'line2', tone: 'down' },
    { key: 'line3', tone: 'flat' },
  ] as const;

  return (
    <div
      aria-hidden
      className="mx-auto w-full max-w-[19rem] rounded-[2.6rem] border-[10px] border-foreground/90 bg-background shadow-2xl"
    >
      <div className="space-y-5 px-5 pt-3 pb-8">
        <div className="flex items-center justify-between text-[0.7rem] font-semibold">
          <span>{t('product.brief.time')}</span>
          <span className="h-5 w-20 rounded-full bg-foreground/90" />
          <span className="tabular-nums">87%</span>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t('product.brief.date')}</p>
          <p className="text-xl font-semibold tracking-tight">{t('product.brief.title')}</p>
        </div>
        <ul className="space-y-2.5">
          {lines.map(({ key, tone }) => (
            <li key={key} className="rounded-2xl border bg-card p-3.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{t(`product.brief.${key}`)}</span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
                    tone === 'up' && 'bg-success/10 text-success',
                    tone === 'down' && 'bg-destructive/10 text-destructive',
                    tone === 'flat' && 'bg-muted text-muted-foreground',
                  )}
                >
                  {t(`product.brief.${key}Value`)}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{t(`product.brief.${key}Note`)}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

type Cell = 'yes' | 'no' | 'partial';
const COMPARE: Array<{
  key: 'brief' | 'why' | 'mobile' | 'alerts' | 'setup';
  cells: [Cell, Cell, Cell];
}> = [
  { key: 'brief', cells: ['yes', 'no', 'no'] },
  { key: 'why', cells: ['yes', 'partial', 'no'] },
  { key: 'mobile', cells: ['yes', 'partial', 'no'] },
  { key: 'alerts', cells: ['yes', 'yes', 'no'] },
  { key: 'setup', cells: ['yes', 'no', 'yes'] },
];

function CompareCell({ value }: { value: Cell }) {
  const { t } = useTranslation('landing');
  if (value === 'yes')
    return <Check className="mx-auto size-4 text-primary" aria-label={t('product.compare.yes')} />;
  if (value === 'no')
    return (
      <X className="mx-auto size-4 text-muted-foreground/60" aria-label={t('product.compare.no')} />
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Minus className="size-3.5" />
      {t('product.compare.partial')}
    </span>
  );
}

/** Template 3: minimal product / app launch page with a waitlist. */
export default function ProductLandingPage() {
  const { t } = useTranslation('landing');
  const features = [
    { key: 'brief', icon: ScrollText },
    { key: 'why', icon: MousePointerClick },
    { key: 'quiet', icon: BellOff },
    { key: 'offline', icon: TrainFront },
  ] as const;
  const changes = ['a', 'b', 'c'] as const;

  return (
    <div className="min-h-svh bg-background">
      <Head title={t('product.meta')} />
      <header className="mx-auto flex max-w-2xl items-center gap-2 px-5 py-6">
        <Link to={routes.landingProduct.href()} aria-label={t('brand')}>
          <BrandLogo />
        </Link>
        <div className="ml-auto flex items-center gap-1">
          <LanguageSwitcher />
          <ModeToggle />
          <Button variant="ghost" size="sm" asChild>
            <Link to={routes.login.href()}>{t('common.signIn')}</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5">
        <section className="pt-10 pb-16 md:pt-16">
          <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <span className="size-1.5 rounded-full bg-success" />
            {t('product.badge')}
          </p>
          <h1 className="mt-5 text-4xl leading-[1.1] font-semibold tracking-tight text-balance md:text-5xl">
            {t('product.title')}
          </h1>
          <p className="mt-4 text-lg text-pretty text-muted-foreground">{t('product.subtitle')}</p>
          <div className="mt-8 max-w-md">
            <Waitlist />
          </div>
        </section>

        <section className="py-8">
          <PhoneBrief />
        </section>

        <section className="border-t py-16">
          <h2 className="text-sm font-medium text-muted-foreground">
            {t('product.features.title')}
          </h2>
          <dl className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {features.map(({ key, icon: Icon }) => (
              <div key={key} className="space-y-1.5">
                <dt className="flex items-center gap-2.5 font-medium">
                  <Icon className="size-4 text-primary" />
                  {t(`product.features.${key}.title`)}
                </dt>
                <dd className="text-sm text-muted-foreground">
                  {t(`product.features.${key}.body`)}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="border-t py-16">
          <h2 className="text-sm font-medium text-muted-foreground">
            {t('product.compare.title')}
          </h2>
          <div className="mt-6 overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[30rem] text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium">
                    <span className="sr-only">{t('product.compare.feature')}</span>
                  </th>
                  <th className="px-4 py-3 font-semibold text-primary">
                    {t('product.compare.us')}
                  </th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">
                    {t('product.compare.bi')}
                  </th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">
                    {t('product.compare.sheets')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {COMPARE.map((row) => (
                  <tr key={row.key}>
                    <th scope="row" className="px-4 py-3 text-left font-normal">
                      {t(`product.compare.rows.${row.key}`)}
                    </th>
                    {row.cells.map((cell, i) => (
                      <td
                        key={i}
                        className={cn('px-4 py-3 text-center', i === 0 && 'bg-primary/5')}
                      >
                        <CompareCell value={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="border-t py-16">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">
              {t('product.changelog.title')}
            </h2>
            <a href="#" className="text-sm underline-offset-4 hover:underline">
              {t('product.changelog.all')}
            </a>
          </div>
          <ol className="mt-8 space-y-8">
            {changes.map((c) => (
              <li key={c} className="grid gap-1 sm:grid-cols-[6rem_1fr]">
                <time className="text-sm text-muted-foreground tabular-nums">
                  {t(`product.changelog.${c}.date`)}
                </time>
                <div>
                  <p className="font-medium">{t(`product.changelog.${c}.title`)}</p>
                  <p className="text-sm text-muted-foreground">
                    {t(`product.changelog.${c}.body`)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <figure className="border-t py-16">
          <blockquote className="text-2xl leading-snug tracking-tight text-pretty">
            “{t('product.testimonial.quote')}”
          </blockquote>
          <figcaption className="mt-5 text-sm">
            <span className="font-medium">{t('product.testimonial.name')}</span>
            <span className="text-muted-foreground"> · {t('product.testimonial.role')}</span>
          </figcaption>
        </figure>
      </main>

      <footer className="mx-auto flex max-w-2xl flex-wrap items-center gap-x-6 gap-y-2 border-t px-5 py-8 pb-24 text-sm text-muted-foreground">
        <span>{t('product.footer.made')}</span>
        <a href="#" className="hover:text-foreground sm:ml-auto">
          {t('product.footer.privacy')}
        </a>
        <a href="#" className="hover:text-foreground">
          {t('product.footer.terms')}
        </a>
        <a href="#" className="hover:text-foreground">
          {t('product.footer.press')}
        </a>
      </footer>
      <TemplateSwitcher />
    </div>
  );
}
