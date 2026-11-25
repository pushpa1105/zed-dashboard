import { ArrowDown, ArrowUpRight } from 'lucide-react';

import { BrandLogo } from '@/core/brand/components/brand-logo';
import { routes } from '@/core/config/routes';
import { LanguageSwitcher } from '@/core/i18n/components/language-switcher';
import { useTranslation } from '@/core/i18n/use-translation';
import { Head } from '@/core/layout/head';
import { notify } from '@/core/notify/notify';
import { Link } from '@/core/router/router';
import { ModeToggle } from '@/core/theme/components/mode-toggle';
import { cn } from '@/shared/lib/cn';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';

import { EmailCaptureForm } from '../components/email-capture-form';
import { PrimaryCta } from '../components/primary-cta';
import { TemplateSwitcher } from '../components/template-switcher';

const BACKERS = [
  'Ledgerline',
  'Quarry',
  'Northpass',
  'Tidewater',
  'Basalt',
  'Mosaic Labs',
  'Fernway',
  'Oakridge Data',
];
const INVESTORS = ['Northlight Ventures', 'Halyard Capital', 'Tern Fund', 'Sixty Degrees'];

function Marquee() {
  const { t } = useTranslation('landing');
  const items = [...BACKERS, ...BACKERS];

  return (
    <section className="border-y py-6">
      <style>{`
        @keyframes landing-marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        @media (prefers-reduced-motion: reduce) { .landing-marquee { animation: none !important } }
      `}</style>
      <div className="mx-auto flex max-w-[1400px] items-center gap-8 px-5">
        <p className="shrink-0 text-xs tracking-[0.2em] text-muted-foreground uppercase">
          {t('startup.logos')}
        </p>
        <div className="relative min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
          <ul
            className="landing-marquee flex w-max gap-14 text-xl font-semibold tracking-tight text-muted-foreground"
            style={{ animation: 'landing-marquee 40s linear infinite' }}
          >
            {items.map((name, i) => (
              <li
                key={`${name}-${i}`}
                aria-hidden={i >= BACKERS.length}
                className="whitespace-nowrap"
              >
                {name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Cases() {
  const { t } = useTranslation('landing');
  const cases = ['a', 'b', 'c'] as const;

  return (
    <section id="work" className="mx-auto max-w-[1400px] scroll-mt-20 px-5 py-24 md:py-32">
      <div className="grid gap-6 md:grid-cols-12">
        <h2 className="text-5xl font-semibold tracking-tighter md:col-span-5 md:text-7xl">
          {t('startup.cases.title')}
        </h2>
        <p className="max-w-sm self-end text-lg text-muted-foreground md:col-span-4 md:col-start-9">
          {t('startup.cases.subtitle')}
        </p>
      </div>
      <div className="mt-14 grid gap-5 md:grid-cols-12">
        {cases.map((c, i) => (
          <a
            key={c}
            href="#"
            className={cn(
              'group flex flex-col justify-between gap-12 rounded-3xl border p-7 transition-colors hover:border-foreground/30',
              i === 0
                ? 'bg-primary/8 md:col-span-7 md:row-span-2 md:p-10'
                : 'bg-card md:col-span-5',
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold">{t(`startup.cases.${c}.client`)}</p>
                <p className="text-sm text-muted-foreground">{t(`startup.cases.${c}.sector`)}</p>
              </div>
              <ArrowUpRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
            </div>
            <div className="space-y-4">
              <p
                className={cn(
                  'font-semibold tracking-tighter tabular-nums',
                  i === 0 ? 'text-7xl text-primary md:text-9xl' : 'text-5xl',
                )}
              >
                {t(`startup.cases.${c}.metric`)}
                <span className="ml-3 align-middle text-sm font-normal tracking-normal text-muted-foreground">
                  {t(`startup.cases.${c}.metricLabel`)}
                </span>
              </p>
              <h3 className={cn('max-w-md text-balance', i === 0 ? 'text-2xl' : 'text-lg')}>
                {t(`startup.cases.${c}.title`)}
              </h3>
              <p className="text-sm font-medium underline-offset-4 group-hover:underline">
                {t('startup.cases.read')}
              </p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

function Manifesto() {
  const { t } = useTranslation('landing');
  const stats = [
    { key: 'teams', value: '1,200' },
    { key: 'countries', value: '38' },
    { key: 'employees', value: '46' },
    { key: 'raised', value: '$24M' },
  ] as const;

  return (
    <section id="about" className="scroll-mt-16 bg-foreground text-background">
      <div className="mx-auto grid max-w-[1400px] gap-16 px-5 py-24 md:grid-cols-12 md:py-32">
        <p className="text-xs tracking-[0.2em] text-background/50 uppercase md:col-span-3">
          {t('startup.manifesto.label')}
        </p>
        <div className="space-y-10 md:col-span-9">
          <h2 className="text-3xl leading-tight font-medium tracking-tight text-balance md:text-5xl">
            {t('startup.manifesto.title')}
          </h2>
          <div className="grid gap-6 text-background/70 md:grid-cols-2">
            <p>{t('startup.manifesto.p1')}</p>
            <p>{t('startup.manifesto.p2')}</p>
          </div>
          <dl className="grid grid-cols-2 gap-y-8 border-t border-background/15 pt-10 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.key}>
                <dd className="text-4xl font-semibold tracking-tight tabular-nums md:text-5xl">
                  {s.value}
                </dd>
                <dt className="mt-1 text-sm text-background/60">{t(`startup.stats.${s.key}`)}</dt>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

function Team() {
  const { t } = useTranslation('landing');
  const people = ['a', 'b', 'c', 'd'] as const;
  const tints = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)'];

  return (
    <section className="mx-auto max-w-[1400px] px-5 py-24 md:py-32">
      <div className="grid gap-12 md:grid-cols-12">
        <div className="space-y-3 md:col-span-4">
          <h2 className="text-4xl font-semibold tracking-tighter md:text-5xl">
            {t('startup.team.title')}
          </h2>
          <p className="text-muted-foreground">{t('startup.team.subtitle')}</p>
        </div>
        <ul className="grid grid-cols-2 gap-x-5 gap-y-10 md:col-span-8 md:grid-cols-4">
          {people.map((p, i) => {
            const name = t(`startup.team.${p}.name`);
            return (
              <li key={p} className="space-y-3">
                <div
                  className="flex aspect-[4/5] items-end rounded-2xl p-4"
                  style={{ background: `color-mix(in srgb, ${tints[i]} 14%, var(--muted))` }}
                >
                  <Avatar className="size-12 ring-4 ring-background">
                    <AvatarFallback
                      className="text-sm font-semibold text-overlay-foreground"
                      style={{ background: tints[i] }}
                    >
                      {name
                        .split(' ')
                        .map((part) => part[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div>
                  <p className="font-medium">{name}</p>
                  <p className="text-sm text-muted-foreground">{t(`startup.team.${p}.role`)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="mt-20 flex flex-col gap-6 border-t pt-8 md:flex-row md:items-center">
        <p className="shrink-0 text-sm text-muted-foreground">{t('startup.team.investorsTitle')}</p>
        <ul className="flex flex-wrap gap-x-10 gap-y-3 text-lg font-medium md:ml-auto">
          {INVESTORS.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Newsletter() {
  const { t } = useTranslation('landing');

  return (
    <section id="journal" className="scroll-mt-16 border-t bg-muted/40">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-20 md:grid-cols-12 md:items-end">
        <div className="space-y-3 md:col-span-6">
          <h2 className="font-serif text-5xl tracking-tight italic md:text-6xl">
            {t('startup.newsletter.title')}
          </h2>
          <p className="max-w-md text-muted-foreground">{t('startup.newsletter.subtitle')}</p>
        </div>
        <div className="space-y-3 md:col-span-5 md:col-start-8">
          <EmailCaptureForm
            submitLabel={t('startup.newsletter.submit')}
            onSubmitted={() => notify.success(t('startup.newsletter.success'))}
          />
          <p className="text-xs text-muted-foreground">{t('startup.newsletter.privacy')}</p>
        </div>
      </div>
    </section>
  );
}

/** Template 2: editorial / company landing page. */
export default function StartupLandingPage() {
  const { t } = useTranslation('landing');
  const anchors = ['work', 'about', 'journal'] as const;

  return (
    <div className="min-h-svh bg-background">
      <Head title={t('startup.meta')} />
      <header className="mx-auto flex max-w-[1400px] items-center gap-8 px-5 py-6">
        <Link to={routes.landingStartup.href()} aria-label={t('brand')}>
          <BrandLogo />
        </Link>
        <nav className="hidden gap-7 text-sm md:flex">
          {anchors.map((a) => (
            <a key={a} href={`#${a}`} className="text-muted-foreground hover:text-foreground">
              {t(`startup.nav.${a}`)}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <LanguageSwitcher />
          <ModeToggle />
          <PrimaryCta size="default" arrow={false} className="ml-2 rounded-full px-4" />
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-[1400px] gap-10 px-5 pt-12 pb-20 md:grid-cols-12 md:pt-20 md:pb-28">
          <div className="md:col-span-8">
            <p className="mb-8 text-xs tracking-[0.2em] text-muted-foreground uppercase">
              {t('startup.hero.kicker')}
            </p>
            <h1 className="text-[clamp(3.25rem,11vw,9.5rem)] leading-[0.9] font-semibold tracking-[-0.045em]">
              <span className="block">{t('startup.hero.title1')}</span>
              <span className="block pl-[8%] font-serif font-normal text-muted-foreground italic">
                {t('startup.hero.title2')}
              </span>
              <span className="block text-primary">{t('startup.hero.title3')}</span>
            </h1>
          </div>
          <div className="flex flex-col justify-end gap-8 md:col-span-4">
            <p className="text-lg text-pretty text-muted-foreground">{t('startup.hero.body')}</p>
            <div className="flex items-center gap-5">
              <a
                href="#about"
                className="inline-flex items-center gap-2 border-b border-foreground pb-1 text-sm font-medium"
              >
                {t('startup.hero.cta')} <ArrowUpRight className="size-4" />
              </a>
              <a
                href="#work"
                className="ml-auto hidden items-center gap-2 text-xs text-muted-foreground md:inline-flex"
              >
                {t('startup.hero.scroll')} <ArrowDown className="size-3.5" />
              </a>
            </div>
          </div>
        </section>
        <Marquee />
        <Cases />
        <Manifesto />
        <Team />
        <Newsletter />
      </main>

      <footer className="mx-auto flex max-w-[1400px] flex-col gap-4 px-5 py-10 text-sm text-muted-foreground md:flex-row md:items-center">
        <BrandLogo showName={false} />
        <p>
          © {new Date().getFullYear()} {t('brand')}. {t('startup.footer.address')}
        </p>
        <a
          href="#"
          className="font-medium text-foreground underline-offset-4 hover:underline md:ml-auto"
        >
          {t('startup.footer.careers')}
        </a>
      </footer>
      <TemplateSwitcher />
    </div>
  );
}
