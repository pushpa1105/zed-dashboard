import {
  ArrowRight,
  BellRing,
  Braces,
  Check,
  Code2,
  FileText,
  ShieldCheck,
  Sigma,
} from 'lucide-react';
import { useState } from 'react';

import { useSession } from '@/core/auth/session';
import { BrandLogo } from '@/core/brand/components/brand-logo';
import { routes } from '@/core/config/routes';
import { useWorkspaceCatalog } from '@/core/feature/workspace-catalog';
import { LanguageSwitcher } from '@/core/i18n/components/language-switcher';
import { useTranslation } from '@/core/i18n/use-translation';
import { Head } from '@/core/layout/head';
import { Link } from '@/core/router/router';
import { ModeToggle } from '@/core/theme/components/mode-toggle';
import { cn } from '@/shared/lib/cn';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/ui/accordion';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';

import { PrimaryCta } from '../components/primary-cta';
import { ProductPreview } from '../components/product-preview';
import { SiteFooter } from '../components/site-footer';
import { LiveDemoLink } from '../components/template-preview';
import { TemplateSwitcher } from '../components/template-switcher';
import { TemplatesSection } from '../components/templates-section';

const LOGOS = [
  { name: 'Fieldwork', className: 'font-semibold tracking-tight' },
  { name: 'PARCELPOINT', className: 'font-bold tracking-[0.18em] text-xs' },
  { name: 'Lumen Health', className: 'font-serif italic' },
  { name: 'brightline', className: 'font-mono lowercase' },
  { name: 'Kestrel&Co', className: 'font-extrabold' },
  { name: 'Copperleaf', className: 'font-medium tracking-wide' },
];

function SectionIntro({
  eyebrow,
  title,
  subtitle,
  className,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={cn('max-w-2xl space-y-3', className)}>
      <p className="text-sm font-medium text-primary">{eyebrow}</p>
      <h2 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">{title}</h2>
      {subtitle && <p className="text-lg text-pretty text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function Header() {
  const { t } = useTranslation('landing');
  const { data: user } = useSession();
  const anchors = ['templates', 'product', 'customers', 'pricing', 'faq'] as const;

  return (
    <header className="sticky top-0 z-40 border-b border-transparent bg-background/80 backdrop-blur supports-[backdrop-filter]:border-border/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5">
        <Link to={routes.home.href()} aria-label={t('brand')}>
          <BrandLogo />
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          {anchors.map((anchor) => (
            <a key={anchor} href={`#${anchor}`} className="transition-colors hover:text-foreground">
              {t(`saas.nav.${anchor}`)}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <LanguageSwitcher />
          <ModeToggle />
          {user ? (
            <PrimaryCta size="default" arrow={false} className="ml-1" />
          ) : (
            <>
              <Button variant="ghost" asChild className="hidden sm:inline-flex">
                <Link to={routes.login.href()}>{t('common.signIn')}</Link>
              </Button>
              <Button asChild className="ml-1">
                <Link to={routes.register.href()}>{t('saas.pricing.cta')}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function Hero() {
  const { t } = useTranslation('landing');
  const catalog = useWorkspaceCatalog();

  return (
    <section className="relative overflow-hidden">
      {/* Faint grid, masked to fade out: texture without decoration. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)] opacity-60"
        style={{
          backgroundImage:
            'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />
      <div className="relative mx-auto max-w-6xl px-5 pt-16 pb-10 md:pt-24">
        <div className="max-w-3xl">
          <a
            href="#product"
            className="group inline-flex items-center gap-2 rounded-full border bg-card py-1 pr-3 pl-1 text-xs shadow-xs"
          >
            <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
              v4.2
            </span>
            {t('saas.hero.eyebrow')}
            <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
          </a>
          <h1 className="mt-6 text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl md:text-6xl">
            {t('saas.hero.title')}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-pretty text-muted-foreground">
            {t('saas.hero.subtitle')}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <PrimaryCta />
            <Button size="lg" variant="outline" asChild>
              <a href="#customers">{t('saas.hero.secondary')}</a>
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            <LiveDemoLink basePath={catalog[0]?.basePath ?? routes.app.href()} />
            <span className="text-xs text-muted-foreground">{t('saas.hero.note')}</span>
          </div>
        </div>
        <ProductPreview className="mt-14" />
      </div>
    </section>
  );
}

function Logos() {
  const { t } = useTranslation('landing');
  return (
    <section className="mx-auto max-w-6xl px-5 py-12">
      <p className="text-center text-sm text-muted-foreground">{t('saas.logos')}</p>
      <ul className="mt-6 grid grid-cols-2 items-center gap-x-6 gap-y-5 text-muted-foreground sm:grid-cols-3 md:grid-cols-6">
        {LOGOS.map((logo) => (
          <li key={logo.name} className={cn('text-center text-lg opacity-80', logo.className)}>
            {logo.name}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Features() {
  const { t } = useTranslation('landing');

  return (
    <section id="product" className="scroll-mt-20 border-t bg-muted/30">
      <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <SectionIntro
          eyebrow={t('saas.features.eyebrow')}
          title={t('saas.features.title')}
          subtitle={t('saas.features.subtitle')}
        />
        <div className="mt-12 grid gap-4 md:grid-cols-6">
          {/* Large tile: metric definition */}
          <article className="flex flex-col justify-between gap-8 rounded-2xl border bg-card p-6 md:col-span-4">
            <div className="max-w-md space-y-2">
              <Sigma className="size-5 text-primary" />
              <h3 className="text-lg font-semibold">{t('saas.features.metrics.title')}</h3>
              <p className="text-sm text-muted-foreground">{t('saas.features.metrics.body')}</p>
            </div>
            <pre className="overflow-x-auto rounded-xl border bg-muted/50 p-4 font-mono text-xs leading-relaxed">
              <code>
                <span className="text-muted-foreground">metric</span>{' '}
                <span className="text-primary">net_revenue</span> {'{'}
                {'\n'}
                {'  '}sql: <span className="text-chart-2">sum(amount) - sum(refunds)</span>
                {'\n'}
                {'  '}grain: <span className="text-chart-2">day</span>
                {'\n'}
                {'  '}owner: <span className="text-chart-2">finance@</span>
                {'\n'}
                {'  '}version: <span className="text-chart-2">14</span>
                {'\n'}
                {'}'}
              </code>
            </pre>
          </article>

          {/* Alert tile */}
          <article className="flex flex-col gap-6 rounded-2xl border bg-card p-6 md:col-span-2">
            <div className="space-y-2">
              <BellRing className="size-5 text-primary" />
              <h3 className="text-lg font-semibold">{t('saas.features.alerts.title')}</h3>
              <p className="text-sm text-muted-foreground">{t('saas.features.alerts.body')}</p>
            </div>
            <div className="mt-auto space-y-2 rounded-xl border bg-background p-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-medium">Net revenue</span>
                <span className="rounded-full bg-destructive/10 px-1.5 py-0.5 font-medium text-destructive tabular-nums">
                  −8.1%
                </span>
              </div>
              <p className="text-muted-foreground">
                Annual plans · DE · Card payments via provider B
              </p>
            </div>
          </article>

          {(
            [
              { key: 'sql', icon: Code2 },
              { key: 'access', icon: ShieldCheck },
              { key: 'share', icon: FileText },
            ] as const
          ).map(({ key, icon: Icon }) => (
            <article key={key} className="space-y-2 rounded-2xl border bg-card p-6 md:col-span-2">
              <Icon className="size-5 text-primary" />
              <h3 className="font-semibold">{t(`saas.features.${key}.title`)}</h3>
              <p className="text-sm text-muted-foreground">{t(`saas.features.${key}.body`)}</p>
            </article>
          ))}

          <article className="flex flex-col gap-4 rounded-2xl border bg-card p-6 md:col-span-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <Braces className="mt-0.5 size-5 shrink-0 text-primary" />
              <div className="space-y-1">
                <h3 className="font-semibold">{t('saas.features.api.title')}</h3>
                <p className="max-w-xl text-sm text-muted-foreground">
                  {t('saas.features.api.body')}
                </p>
              </div>
            </div>
            <code className="rounded-lg border bg-muted/50 px-3 py-2 font-mono text-xs whitespace-nowrap">
              GET /v1/metrics/net_revenue?grain=week
            </code>
          </article>
        </div>
      </div>
    </section>
  );
}

function Metrics() {
  const { t } = useTranslation('landing');
  const items = [
    { key: 'uptime', value: '99.98%' },
    { key: 'refresh', value: '5 min' },
    { key: 'queries', value: '38M' },
    { key: 'setup', value: '11 min' },
  ] as const;

  return (
    <section className="border-y">
      <dl className="mx-auto grid max-w-6xl grid-cols-2 px-5 md:grid-cols-4">
        {items.map((item, i) => (
          <div
            key={item.key}
            className={cn(
              'space-y-1 py-10 pr-4',
              i > 0 && 'md:border-l md:pl-8',
              i % 2 === 1 && 'border-l pl-6 md:pl-8',
            )}
          >
            <dd className="text-3xl font-semibold tracking-tight tabular-nums md:text-4xl">
              {item.value}
            </dd>
            <dt className="text-sm text-muted-foreground">{t(`saas.metrics.${item.key}`)}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}

function Steps() {
  const { t } = useTranslation('landing');
  const steps = ['one', 'two', 'three'] as const;

  return (
    <section className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-[1fr_1.3fr] md:py-28">
      <SectionIntro
        eyebrow={t('saas.steps.eyebrow')}
        title={t('saas.steps.title')}
        className="md:sticky md:top-24 md:self-start"
      />
      <ol className="relative space-y-10 border-l pl-8">
        {steps.map((step, i) => (
          <li key={step} className="relative">
            <span className="absolute top-0 -left-[calc(2rem+0.8125rem)] flex size-6.5 items-center justify-center rounded-full border bg-background text-xs font-medium tabular-nums">
              {i + 1}
            </span>
            <h3 className="font-semibold">{t(`saas.steps.${step}.title`)}</h3>
            <p className="mt-1 text-muted-foreground">{t(`saas.steps.${step}.body`)}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Testimonials() {
  const { t } = useTranslation('landing');
  const quotes = ['a', 'b', 'c'] as const;
  const initials = (name: string) =>
    name
      .split(' ')
      .map((part) => part[0])
      .join('');

  return (
    <section id="customers" className="scroll-mt-20 border-t bg-muted/30">
      <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <SectionIntro
          eyebrow={t('saas.testimonials.eyebrow')}
          title={t('saas.testimonials.title')}
        />
        <div className="mt-12 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          {quotes.map((q, i) => (
            <figure
              key={q}
              className={cn(
                'flex flex-col justify-between gap-8 rounded-2xl border bg-card p-6',
                i === 0 && 'lg:row-span-2 lg:p-10',
              )}
            >
              <blockquote
                className={cn(
                  'text-pretty',
                  i === 0 ? 'text-xl leading-relaxed md:text-2xl' : 'text-muted-foreground',
                )}
              >
                “{t(`saas.testimonials.${q}.quote`)}”
              </blockquote>
              <figcaption className="flex items-center gap-3">
                <Avatar className="size-9">
                  <AvatarFallback className="bg-primary/10 text-xs text-primary">
                    {initials(t(`saas.testimonials.${q}.name`))}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <p className="font-medium">{t(`saas.testimonials.${q}.name`)}</p>
                  <p className="text-muted-foreground">{t(`saas.testimonials.${q}.role`)}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

const TIERS = [
  { key: 'starter', monthly: 29, yearly: 24, features: ['f1', 'f2', 'f3', 'f4'] },
  { key: 'growth', monthly: 149, yearly: 124, features: ['f1', 'f2', 'f3', 'f4', 'f5'] },
  { key: 'scale', monthly: 499, yearly: 416, features: ['f1', 'f2', 'f3', 'f4'] },
] as const;

function Pricing() {
  const { t } = useTranslation('landing');
  const [yearly, setYearly] = useState(true);

  return (
    <section id="pricing" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20 md:py-28">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionIntro
          eyebrow={t('saas.pricing.eyebrow')}
          title={t('saas.pricing.title')}
          subtitle={t('saas.pricing.subtitle')}
        />
        <div role="group" className="inline-flex rounded-full border bg-muted/60 p-1 text-sm">
          {[false, true].map((value) => (
            <button
              key={String(value)}
              type="button"
              aria-pressed={yearly === value}
              onClick={() => setYearly(value)}
              className={cn(
                'rounded-full px-4 py-1.5 text-muted-foreground transition-colors',
                yearly === value && 'bg-card text-foreground shadow-xs',
              )}
            >
              {value ? t('saas.pricing.yearly') : t('saas.pricing.monthly')}
              {value && (
                <span className="ml-2 text-xs font-medium text-primary">
                  {t('saas.pricing.save')}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-12 grid gap-4 lg:grid-cols-3">
        {TIERS.map((tier) => {
          const featured = tier.key === 'growth';
          return (
            <article
              key={tier.key}
              className={cn(
                'relative flex flex-col rounded-2xl border bg-card p-6',
                featured && 'border-primary shadow-lg ring-1 ring-primary lg:-my-3 lg:py-9',
              )}
            >
              {featured && (
                <p className="absolute -top-3 left-6 rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
                  {t('saas.pricing.popular')}
                </p>
              )}
              <h3 className="font-semibold">{t(`saas.pricing.${tier.key}.name`)}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t(`saas.pricing.${tier.key}.description`)}
              </p>
              <p className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight tabular-nums">
                  ${yearly ? tier.yearly : tier.monthly}
                </span>
                <span className="text-sm text-muted-foreground">{t('saas.pricing.perMonth')}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {yearly ? t('saas.pricing.billedYearly') : t('saas.pricing.billedMonthly')}
              </p>
              <ul className="mt-6 mb-8 space-y-2.5 text-sm">
                {tier.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    {t(`saas.pricing.${tier.key}.${f}` as 'saas.pricing.growth.f1')}
                  </li>
                ))}
              </ul>
              <Button
                variant={featured ? 'default' : 'outline'}
                className="mt-auto w-full"
                size="lg"
                asChild
              >
                <Link to={routes.register.href()}>
                  {tier.key === 'scale' ? t('saas.pricing.contact') : t('saas.pricing.cta')}
                </Link>
              </Button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Faq() {
  const { t } = useTranslation('landing');
  const questions = ['q1', 'q2', 'q3', 'q4', 'q5'] as const;

  return (
    <section id="faq" className="scroll-mt-20 border-t">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-[1fr_1.6fr] md:py-28">
        <h2 className="text-3xl font-semibold tracking-tight text-balance">
          {t('saas.faq.title')}
        </h2>
        <Accordion type="single" collapsible defaultValue="q1">
          {questions.map((q) => (
            <AccordionItem key={q} value={q}>
              <AccordionTrigger className="text-base">{t(`saas.faq.${q}.q`)}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {t(`saas.faq.${q}.a`)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

function FinalCta() {
  const { t } = useTranslation('landing');

  return (
    <section className="mx-auto max-w-6xl px-5 pb-20 md:pb-28">
      <div className="flex flex-col gap-8 rounded-3xl bg-primary px-6 py-12 text-primary-foreground md:flex-row md:items-end md:justify-between md:px-12 md:py-16">
        <h2 className="max-w-2xl text-2xl font-semibold tracking-tight text-balance md:text-4xl">
          {t('saas.cta.title')}
        </h2>
        <div className="flex shrink-0 flex-wrap gap-3">
          <Button
            size="lg"
            className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
            asChild
          >
            <Link to={routes.register.href()}>
              {t('saas.pricing.cta')} <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            asChild
          >
            <a href="#pricing">{t('saas.cta.secondary')}</a>
          </Button>
        </div>
      </div>
    </section>
  );
}

/** Template 1: SaaS product landing page (the app's home page). */
export default function SaasLandingPage() {
  const { t } = useTranslation('landing');

  return (
    <div className="min-h-svh bg-background">
      <Head title={t('saas.meta')} />
      <Header />
      <main>
        <Hero />
        <Logos />
        <TemplatesSection />
        <Features />
        <Metrics />
        <Steps />
        <Testimonials />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
      <TemplateSwitcher />
    </div>
  );
}
