import { Check, Minus } from 'lucide-react';
import { Fragment, useState } from 'react';

import { BrandLogo } from '@/core/brand/components/brand-logo';
import { routes } from '@/core/config/routes';
import { useTranslation } from '@/core/i18n/use-translation';
import { Head } from '@/core/layout/head';
import { notify } from '@/core/notify/notify';
import { Link } from '@/core/router/router';
import { SegmentedControl } from '@/shared/components/forms/segmented-control';
import { cn } from '@/shared/lib/cn';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/ui/accordion';
import { Button } from '@/shared/ui/button';

import { BackToGallery } from '../components/template-kit';

const PLANS = ['free', 'starter', 'growth', 'scale'] as const;
type Plan = (typeof PLANS)[number];
const PRICE: Record<Plan, [number, number]> = {
  free: [0, 0],
  starter: [29, 24],
  growth: [99, 79],
  scale: [349, 279],
};

type Group = 'usage' | 'features' | 'security';
type RowKey =
  | 'seats'
  | 'dashboards'
  | 'sources'
  | 'refresh'
  | 'alerts'
  | 'embedding'
  | 'api'
  | 'rls'
  | 'sso'
  | 'audit'
  | 'sla';
/** Words shown in cells (translated); numbers are shown as-is. */
type ValueWord = 'unlimited' | 'daily' | 'hourly' | 'fiveMin' | 'oneMin';
type CellValue = boolean | number | ValueWord;

/** Comparison rows: yes/no, a number, or a translated word per plan. */
const MATRIX: Array<{ group: Group; rows: Array<{ key: RowKey; values: CellValue[] }> }> = [
  {
    group: 'usage',
    rows: [
      { key: 'seats', values: [1, 5, 25, 'unlimited'] },
      { key: 'dashboards', values: [3, 20, 'unlimited', 'unlimited'] },
      { key: 'sources', values: [1, 3, 10, 'unlimited'] },
      { key: 'refresh', values: ['daily', 'hourly', 'fiveMin', 'oneMin'] },
    ],
  },
  {
    group: 'features',
    rows: [
      { key: 'alerts', values: [false, true, true, true] },
      { key: 'embedding', values: [false, false, true, true] },
      { key: 'api', values: [false, true, true, true] },
      { key: 'rls', values: [false, false, true, true] },
    ],
  },
  {
    group: 'security',
    rows: [
      { key: 'sso', values: [false, false, true, true] },
      { key: 'audit', values: [false, false, false, true] },
      { key: 'sla', values: [false, false, false, true] },
    ],
  },
];

function Cell({ value }: { value: CellValue }) {
  const { t } = useTranslation('pages');
  if (value === true)
    return <Check className="mx-auto size-4 text-primary" aria-label={t('pricing.yes')} />;
  if (value === false)
    return (
      <Minus className="mx-auto size-4 text-muted-foreground/50" aria-label={t('pricing.no')} />
    );
  return (
    <span className="text-sm tabular-nums">
      {typeof value === 'number' ? value : t(`pricing.values.${value}`)}
    </span>
  );
}

/** Marketing template: plans, full comparison and FAQ. */
export default function PricingTemplatePage() {
  const { t } = useTranslation('pages');
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('yearly');
  const yearly = cycle === 'yearly';

  return (
    <div className="min-h-svh bg-background">
      <Head title={t('templates.pricing.title')} />
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <BrandLogo />
        <Button variant="ghost" asChild>
          <Link to={routes.login.href()}>{t('auth.signIn')}</Link>
        </Button>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-24">
        <section className="pt-12 pb-10 text-center md:pt-20">
          <h1 className="text-4xl font-semibold tracking-tight text-balance md:text-5xl">
            {t('pricing.title')}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            {t('pricing.subtitle')}
          </p>
          <div className="mt-8 flex justify-center">
            <SegmentedControl
              value={cycle}
              onChange={setCycle}
              options={[
                { value: 'monthly', label: t('pricing.monthly') },
                { value: 'yearly', label: t('pricing.yearly') },
              ]}
            />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => {
            const featured = plan === 'growth';
            const price = PRICE[plan][yearly ? 1 : 0];
            return (
              <article
                key={plan}
                className={cn(
                  'relative flex flex-col rounded-2xl border bg-card p-6',
                  featured && 'border-primary shadow-lg ring-1 shadow-primary/10 ring-primary',
                )}
              >
                {featured && (
                  <span className="absolute -top-3 left-6 rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
                    {t('pricing.popular')}
                  </span>
                )}
                <h2 className="font-semibold">{t(`pricing.plans.${plan}.name`)}</h2>
                <p className="mt-1 min-h-10 text-sm text-muted-foreground">
                  {t(`pricing.plans.${plan}.for`)}
                </p>
                <p className="mt-5 flex items-baseline gap-1">
                  <span className="text-4xl font-semibold tracking-tight tabular-nums">
                    ${price}
                  </span>
                  <span className="text-sm text-muted-foreground">{t('pricing.perMonth')}</span>
                </p>
                <p className="mt-1 h-4 text-xs text-muted-foreground">
                  {yearly && price > 0 ? t('pricing.billedYearly', { total: price * 12 }) : ''}
                </p>
                <Button
                  className="mt-6"
                  variant={featured ? 'default' : 'outline'}
                  onClick={() =>
                    notify.success(t('pricing.chosen', { plan: t(`pricing.plans.${plan}.name`) }))
                  }
                >
                  {t(`pricing.plans.${plan}.cta`)}
                </Button>
                <ul className="mt-6 space-y-2.5 border-t pt-6 text-sm">
                  {(['a', 'b', 'c'] as const).map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      {t(`pricing.plans.${plan}.features.${f}`)}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </section>

        <section className="mt-24">
          <h2 className="text-2xl font-semibold tracking-tight">{t('pricing.compare')}</h2>
          <div className="mt-6 overflow-x-auto rounded-2xl border">
            <table className="w-full min-w-[44rem] text-left">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b">
                  <th className="w-1/3 p-4 text-sm font-medium text-muted-foreground">
                    {t('pricing.feature')}
                  </th>
                  {PLANS.map((plan) => (
                    <th
                      key={plan}
                      className={cn(
                        'p-4 text-center text-sm font-semibold',
                        plan === 'growth' && 'text-primary',
                      )}
                    >
                      {t(`pricing.plans.${plan}.name`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MATRIX.map((block) => (
                  <Fragment key={block.group}>
                    <tr className="bg-muted/50">
                      <th
                        colSpan={5}
                        className="px-4 py-2.5 text-xs font-medium tracking-wider text-muted-foreground uppercase"
                      >
                        {t(`pricing.groups.${block.group}`)}
                      </th>
                    </tr>
                    {block.rows.map((row) => (
                      <tr key={row.key} className="border-t">
                        <td className="p-4 text-sm">{t(`pricing.rows.${row.key}`)}</td>
                        {row.values.map((value, i) => (
                          <td
                            key={i}
                            className={cn('p-4 text-center', i === 2 && 'bg-primary/[0.03]')}
                          >
                            <Cell value={value} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-24 grid gap-10 md:grid-cols-[1fr_2fr]">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight">{t('pricing.faq.title')}</h2>
            <p className="text-sm text-muted-foreground">{t('pricing.faq.subtitle')}</p>
          </div>
          <Accordion type="single" collapsible defaultValue="q1">
            {(['q1', 'q2', 'q3', 'q4', 'q5'] as const).map((q) => (
              <AccordionItem key={q} value={q}>
                <AccordionTrigger className="text-base">
                  {t(`pricing.faq.items.${q}.q`)}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {t(`pricing.faq.items.${q}.a`)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <section className="mt-24 flex flex-col items-start justify-between gap-6 rounded-2xl border bg-muted/40 p-8 md:flex-row md:items-center">
          <div>
            <h2 className="text-xl font-semibold">{t('pricing.enterprise.title')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('pricing.enterprise.body')}</p>
          </div>
          <Button size="lg" onClick={() => notify.info(t('pricing.enterprise.toast'))}>
            {t('pricing.enterprise.cta')}
          </Button>
        </section>
      </main>
      <BackToGallery />
    </div>
  );
}
