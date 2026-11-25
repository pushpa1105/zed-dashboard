import {
  ArrowRight,
  BookOpen,
  Code2,
  CreditCard,
  Database,
  LayoutDashboard,
  Mail,
  MessageCircle,
  Phone,
  Rocket,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Head } from '@/core/layout/head';
import { notify } from '@/core/notify/notify';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { SearchInput } from '@/shared/components/forms/search-input';
import { cn } from '@/shared/lib/cn';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/ui/accordion';
import { Button } from '@/shared/ui/button';

import { HELP_ARTICLES, HELP_CATEGORIES } from '../model/demo-data';

type CategoryKey = (typeof HELP_CATEGORIES)[number]['key'];

const CATEGORY_ICON: Record<CategoryKey, LucideIcon> = {
  start: Rocket,
  dashboards: LayoutDashboard,
  data: Database,
  billing: CreditCard,
  security: ShieldCheck,
  api: Code2,
};

const CONTACT = [
  { key: 'chat', icon: MessageCircle },
  { key: 'email', icon: Mail },
  { key: 'call', icon: Phone },
] as const;

/** In-app template: help center with live search, categories, FAQ and contact. */
export default function HelpPage() {
  const { t } = useTranslation('pages');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryKey | null>(null);

  const q = query.trim().toLowerCase();
  const articles = HELP_ARTICLES.filter(
    (a) => (!category || a.category === category) && (!q || a.title.toLowerCase().includes(q)),
  );

  return (
    <div className="pb-12">
      <Head title={t('templates.help.title')} />
      <section className="border-b bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--primary)_10%,transparent),transparent_70%)]">
        <div className="mx-auto max-w-3xl px-4 py-14 text-center md:py-20">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{t('help.title')}</h1>
          <p className="mt-3 text-muted-foreground">{t('help.subtitle')}</p>
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder={t('help.search')}
            containerClassName="mx-auto mt-8 max-w-xl bg-card"
            shortcut
          />
          <p className="mt-3 text-xs text-muted-foreground">{t('help.popular')}</p>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1200px] gap-6 px-4 pt-10 md:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {HELP_CATEGORIES.map(({ key, articles: count }) => {
            const Icon = CATEGORY_ICON[key];
            const active = category === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setCategory(active ? null : key)}
                aria-pressed={active}
                className={cn(
                  'flex items-start gap-4 rounded-xl border bg-card p-5 text-left shadow-xs transition-colors hover:border-primary/40',
                  active && 'border-primary ring-1 ring-primary',
                )}
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block font-medium">{t(`help.categories.${key}.title`)}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">
                    {t(`help.categories.${key}.body`)}
                  </span>
                  <span className="mt-2 block text-xs text-muted-foreground">
                    {t('help.articles', { count })}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
          <SectionCard
            title={category ? t(`help.categories.${category}.title`) : t('help.featured')}
            description={t('help.results', { count: articles.length })}
            flush
            action={
              category ? (
                <Button variant="ghost" size="sm" onClick={() => setCategory(null)}>
                  {t('help.allTopics')}
                </Button>
              ) : undefined
            }
          >
            {articles.length ? (
              <ul className="divide-y border-t">
                {articles.map((article) => (
                  <li key={article.id}>
                    <button
                      type="button"
                      onClick={() => notify.info(article.title)}
                      className="group flex w-full items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-muted/40"
                    >
                      <BookOpen className="size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{article.title}</span>
                        <span className="block text-xs text-muted-foreground">
                          {t(`help.categories.${article.category}.title`)} ·{' '}
                          {t('help.minutes', { count: article.minutes })}
                        </span>
                      </span>
                      <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="border-t px-6 py-10 text-center text-sm text-muted-foreground">
                {t('help.noResults')}
              </p>
            )}
          </SectionCard>

          <SectionCard title={t('help.faq')}>
            <Accordion type="single" collapsible defaultValue="q1">
              {(['q1', 'q2', 'q3', 'q4'] as const).map((key) => (
                <AccordionItem key={key} value={key}>
                  <AccordionTrigger>{t(`help.faqItems.${key}.q`)}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {t(`help.faqItems.${key}.a`)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </SectionCard>
        </div>

        <div>
          <h2 className="text-base font-semibold">{t('help.contact')}</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {CONTACT.map(({ key, icon: Icon }) => (
              <div
                key={key}
                className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-muted">
                    <Icon className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">{t(`help.channels.${key}.title`)}</p>
                    <p className="text-xs text-muted-foreground">
                      {t(`help.channels.${key}.meta`)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="mt-auto"
                  onClick={() => notify.success(t(`help.channels.${key}.toast`))}
                >
                  {t(`help.channels.${key}.cta`)}
                </Button>
              </div>
            ))}
          </div>
          <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="size-2 rounded-full bg-success" /> {t('help.status')}
          </p>
        </div>
      </div>
    </div>
  );
}
