import {
  ArrowUp,
  BookOpenCheck,
  Check,
  Database,
  FileSearch,
  LockKeyhole,
  Sparkles,
  TimerReset,
  Workflow,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { routes } from '@/core/config/routes';
import { useTranslation } from '@/core/i18n/use-translation';
import { Head } from '@/core/layout/head';
import { Link } from '@/core/router/router';
import { BarChart } from '@/shared/components/charts/bar-chart';
import { cn } from '@/shared/lib/cn';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/ui/accordion';
import { Button } from '@/shared/ui/button';
import { Switch } from '@/shared/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';

import { SimpleHeader } from '../components/simple-header';
import { SiteFooter } from '../components/site-footer';
import { TemplateSwitcher } from '../components/template-switcher';

/** Canned answers for the hero demo: question key → chart data. */
const PROMPTS = {
  churn: [
    { x: 'Jul', v: 3.1 },
    { x: 'Aug', v: 2.9 },
    { x: 'Sep', v: 3.4 },
    { x: 'Oct', v: 4.6 },
    { x: 'Nov', v: 3.2 },
  ],
  regions: [
    { x: 'DACH', v: 412 },
    { x: 'Nordics', v: 268 },
    { x: 'UK & IE', v: 231 },
    { x: 'Benelux', v: 174 },
    { x: 'Iberia', v: 96 },
  ],
  forecast: [
    { x: 'W45', v: 81 },
    { x: 'W46', v: 86 },
    { x: 'W47', v: 84 },
    { x: 'W48', v: 92 },
    { x: 'W49', v: 97 },
  ],
} as const;
type PromptKey = keyof typeof PROMPTS;

const FEATURES: Array<{
  key: 'citations' | 'sql' | 'guardrails' | 'metrics' | 'workflows' | 'speed';
  icon: LucideIcon;
  span?: string;
}> = [
  { key: 'citations', icon: FileSearch, span: 'md:col-span-2' },
  { key: 'sql', icon: Database },
  { key: 'guardrails', icon: LockKeyhole },
  { key: 'metrics', icon: BookOpenCheck },
  { key: 'workflows', icon: Workflow },
  { key: 'speed', icon: TimerReset, span: 'md:col-span-2' },
];

const USE_CASES = ['finance', 'sales', 'product', 'support'] as const;
const INTEGRATIONS = [
  ['Postgres', 'warehouse'],
  ['Snowflake', 'warehouse'],
  ['BigQuery', 'warehouse'],
  ['Stripe', 'billing'],
  ['HubSpot', 'crm'],
  ['Salesforce', 'crm'],
  ['Zendesk', 'support'],
  ['Slack', 'delivery'],
] as const;
const PLANS = ['team', 'business', 'enterprise'] as const;
const PRICES = { team: [49, 39], business: [199, 159], enterprise: [null, null] } as const;

/** Types out the question, then reveals the answer. Remounted (keyed) per prompt. */
function PromptAnswer({ active }: { active: PromptKey }) {
  const { t } = useTranslation('landing');
  const question = t(`ai.demo.prompts.${active}.question`);
  const [count, setCount] = useState(() =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ? Infinity : 0,
  );

  useEffect(() => {
    if (count >= question.length) return;
    const id = window.setTimeout(() => setCount((c) => c + 2), 18);
    return () => window.clearTimeout(id);
  }, [count, question.length]);

  const typed = question.slice(0, count);
  const done = count >= question.length;

  return (
    <div>
      <div className="rounded-2xl border bg-card p-2 shadow-lg shadow-primary/5">
        <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-3">
          <Sparkles className="size-4 shrink-0 text-primary" />
          <p className="min-h-6 flex-1 text-sm md:text-base" aria-live="polite">
            {typed}
            {!done && (
              <span className="ml-0.5 inline-block h-4 w-px animate-pulse bg-foreground align-middle" />
            )}
          </p>
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ArrowUp className="size-4" />
          </span>
        </div>
        <div
          className={cn(
            'grid gap-5 p-4 transition-opacity duration-300 md:grid-cols-[1fr_1.1fr] md:p-5',
            done ? 'opacity-100' : 'opacity-0',
          )}
        >
          <div className="space-y-3">
            <p className="text-sm leading-relaxed">{t(`ai.demo.prompts.${active}.answer`)}</p>
            <p className="text-xs text-muted-foreground">
              {t('ai.demo.sources')}{' '}
              <span className="rounded bg-muted px-1.5 py-0.5 font-mono">
                {t(`ai.demo.prompts.${active}.source`)}
              </span>
            </p>
          </div>
          <BarChart
            data={[...PROMPTS[active]]}
            xKey="x"
            series={[{ key: 'v', label: t(`ai.demo.prompts.${active}.series`) }]}
            highlight="last"
            className="h-40"
            hideGrid
          />
        </div>
      </div>
    </div>
  );
}

function PromptDemo() {
  const { t } = useTranslation('landing');
  const [active, setActive] = useState<PromptKey>('churn');

  return (
    <div className="mx-auto mt-12 max-w-3xl text-left">
      <PromptAnswer key={active} active={active} />
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {(Object.keys(PROMPTS) as PromptKey[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setActive(key)}
            aria-pressed={active === key}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs transition-colors',
              active === key
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'bg-card text-muted-foreground hover:text-foreground',
            )}
          >
            {t(`ai.demo.prompts.${key}.chip`)}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Template 5: AI analyst product — interactive prompt hero, use cases, usage pricing. */
export default function AiLandingPage() {
  const { t } = useTranslation('landing');
  const [yearly, setYearly] = useState(true);

  return (
    <div className="min-h-svh bg-background">
      <Head title={t('ai.meta')} />
      <SimpleHeader>
        <nav className="hidden gap-6 text-sm text-muted-foreground md:flex">
          {(['features', 'useCases', 'pricing', 'faq'] as const).map((anchor) => (
            <a key={anchor} href={`#${anchor}`} className="hover:text-foreground">
              {t(`ai.nav.${anchor}`)}
            </a>
          ))}
        </nav>
      </SimpleHeader>

      <main>
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--primary)_16%,transparent),transparent_65%)]"
          />
          <div className="relative mx-auto max-w-6xl px-5 pt-16 pb-20 text-center md:pt-24 md:pb-28">
            <p className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" /> {t('ai.hero.eyebrow')}
            </p>
            <h1 className="mx-auto mt-6 max-w-3xl text-4xl leading-[1.05] font-semibold tracking-tight text-balance md:text-6xl">
              {t('ai.hero.title')}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-pretty text-muted-foreground">
              {t('ai.hero.subtitle')}
            </p>
            <PromptDemo />
          </div>
        </section>

        <section id="features" className="scroll-mt-20 border-t bg-muted/30">
          <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
            <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance md:text-4xl">
              {t('ai.features.title')}
            </h2>
            <div className="mt-12 grid gap-4 md:grid-cols-4">
              {FEATURES.map(({ key, icon: Icon, span }) => (
                <article key={key} className={cn('rounded-2xl border bg-card p-6', span)}>
                  <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </span>
                  <h3 className="mt-5 font-semibold">{t(`ai.features.items.${key}.title`)}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {t(`ai.features.items.${key}.body`)}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="useCases" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20 md:py-28">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            {t('ai.useCases.title')}
          </h2>
          <Tabs defaultValue="finance" className="mt-8">
            <TabsList>
              {USE_CASES.map((u) => (
                <TabsTrigger key={u} value={u}>
                  {t(`ai.useCases.items.${u}.tab`)}
                </TabsTrigger>
              ))}
            </TabsList>
            {USE_CASES.map((u) => (
              <TabsContent key={u} value={u} className="mt-6">
                <div className="grid gap-6 rounded-2xl border bg-card p-6 md:grid-cols-2 md:p-8">
                  <div className="space-y-3">
                    <p className="text-xs tracking-wider text-muted-foreground uppercase">
                      {t('ai.useCases.ask')}
                    </p>
                    <p className="text-xl font-medium text-balance">
                      “{t(`ai.useCases.items.${u}.question`)}”
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t(`ai.useCases.items.${u}.who`)}
                    </p>
                  </div>
                  <div className="space-y-3 rounded-xl bg-muted/50 p-5">
                    <p className="text-xs tracking-wider text-muted-foreground uppercase">
                      {t('ai.useCases.get')}
                    </p>
                    <p className="text-sm leading-relaxed">{t(`ai.useCases.items.${u}.answer`)}</p>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </section>

        <section className="border-y bg-muted/30">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <p className="text-sm text-muted-foreground">{t('ai.integrations.title')}</p>
            <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {INTEGRATIONS.map(([name, kind]) => (
                <li
                  key={name}
                  className="flex items-center justify-between rounded-xl border bg-card px-4 py-3"
                >
                  <span className="font-medium">{name}</span>
                  <span className="text-xs text-muted-foreground">
                    {t(`ai.integrations.kinds.${kind}`)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20 md:py-28">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                {t('ai.pricing.title')}
              </h2>
              <p className="text-muted-foreground">{t('ai.pricing.subtitle')}</p>
            </div>
            <label className="flex items-center gap-3 text-sm">
              <Switch checked={yearly} onCheckedChange={setYearly} />
              {t('ai.pricing.yearly')}
            </label>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {PLANS.map((plan) => {
              const price = PRICES[plan][yearly ? 1 : 0];
              const featured = plan === 'business';
              return (
                <article
                  key={plan}
                  className={cn(
                    'flex flex-col rounded-2xl border bg-card p-6',
                    featured && 'border-primary shadow-lg ring-1 shadow-primary/10 ring-primary',
                  )}
                >
                  <h3 className="font-semibold">{t(`ai.pricing.plans.${plan}.name`)}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t(`ai.pricing.plans.${plan}.for`)}
                  </p>
                  <p className="mt-6 text-4xl font-semibold tracking-tight tabular-nums">
                    {price === null ? t('ai.pricing.custom') : `$${price}`}
                    {price !== null && (
                      <span className="text-sm font-normal text-muted-foreground">
                        {' '}
                        {t('ai.pricing.perSeat')}
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t(`ai.pricing.plans.${plan}.questions`)}
                  </p>
                  <ul className="mt-6 space-y-2.5 text-sm">
                    {(['a', 'b', 'c'] as const).map((f) => (
                      <li key={f} className="flex gap-2">
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                        {t(`ai.pricing.plans.${plan}.features.${f}`)}
                      </li>
                    ))}
                  </ul>
                  <Button asChild variant={featured ? 'default' : 'outline'} className="mt-8">
                    <Link to={routes.register.href()}>{t(`ai.pricing.plans.${plan}.cta`)}</Link>
                  </Button>
                </article>
              );
            })}
          </div>
        </section>

        <section id="faq" className="scroll-mt-20 border-t">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-[1fr_2fr] md:py-28">
            <h2 className="text-3xl font-semibold tracking-tight">{t('ai.faq.title')}</h2>
            <Accordion type="single" collapsible defaultValue="q1">
              {(['q1', 'q2', 'q3', 'q4'] as const).map((q) => (
                <AccordionItem key={q} value={q}>
                  <AccordionTrigger className="text-base">
                    {t(`ai.faq.items.${q}.q`)}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {t(`ai.faq.items.${q}.a`)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      </main>
      <SiteFooter />
      <TemplateSwitcher />
    </div>
  );
}
