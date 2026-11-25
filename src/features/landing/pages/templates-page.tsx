import { LayoutGrid, SearchX } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { routes } from '@/core/config/routes';
import { useWorkspaceCatalog } from '@/core/feature/workspace-catalog';
import { useTranslation } from '@/core/i18n/use-translation';
import { Head } from '@/core/layout/head';
import { Link } from '@/core/router/router';
import { LayoutWireframe } from '@/core/theme/components/layout-wireframe';
import type { ShellLayout } from '@/core/theme/config';
import { SearchInput } from '@/shared/components/forms/search-input';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';

import { BundleOffer } from '../components/bundle-offer';
import { SimpleHeader } from '../components/simple-header';
import { SiteFooter } from '../components/site-footer';
import { TemplateLightbox } from '../components/template-lightbox';
import { TemplateCard } from '../components/template-preview';
import { TemplateSwitcher } from '../components/template-switcher';
import { useTemplateText } from '../lib/templates';

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex h-8 items-center gap-2 rounded-full border px-3 text-sm whitespace-nowrap transition-colors',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}

/** Full gallery of dashboard templates with filters, search and a lightbox. */
export default function TemplatesPage() {
  const { t } = useTranslation('landing');
  const catalog = useWorkspaceCatalog();
  const textOf = useTemplateText();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [layout, setLayout] = useState<ShellLayout | null>(null);
  const [index, setIndex] = useState<number | null>(null);

  const withText = catalog.map((ws) => ({ ws, text: textOf(ws) }));
  const categories = [...new Set(withText.map((x) => x.text.category).filter(Boolean))];
  const layouts = [...new Set(catalog.map((ws) => ws.layout))];

  const filtered = withText
    .filter((x) => !category || x.text.category === category)
    .filter((x) => !layout || x.ws.layout === layout)
    .filter((x) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return [x.text.name, x.text.description, x.text.category, x.text.layout]
        .join(' ')
        .toLowerCase()
        .includes(q);
    })
    .map((x) => x.ws);

  const reset = () => {
    setQuery('');
    setCategory(null);
    setLayout(null);
  };

  return (
    <div className="flex min-h-svh flex-col">
      <Head title={t('templates.gallery.metaTitle')} />
      <SimpleHeader>
        <nav className="hidden text-sm text-muted-foreground md:block">
          <Link to={routes.home.href()} className="hover:text-foreground">
            {t('templates.gallery.backHome')}
          </Link>
        </nav>
      </SimpleHeader>

      <main className="flex-1">
        <section className="border-b bg-muted/30">
          <div className="mx-auto max-w-6xl px-5 py-14 md:py-20">
            <p className="text-sm font-medium text-primary">{t('templates.eyebrow')}</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-balance md:text-5xl">
              {t('templates.gallery.title')}
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-pretty text-muted-foreground">
              {t('templates.gallery.subtitle', { count: catalog.length })}
            </p>
            <BundleOffer count={catalog.length} />
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-5 py-10">
          <div className="sticky top-16 z-30 -mx-5 space-y-3 border-b bg-background/90 px-5 py-4 backdrop-blur">
            <div className="flex flex-wrap items-center gap-3">
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder={t('templates.gallery.search')}
                containerClassName="w-full sm:w-72"
              />
              <span className="text-sm text-muted-foreground tabular-nums">
                {t('templates.gallery.results', { count: filtered.length })}
              </span>
              {(query || category || layout) && (
                <Button variant="ghost" size="sm" onClick={reset} className="ml-auto">
                  {t('templates.gallery.reset')}
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Chip active={!category} onClick={() => setCategory(null)}>
                <LayoutGrid className="size-3.5" /> {t('templates.gallery.allCategories')}
              </Chip>
              {categories.map((c) => (
                <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
                  {c}
                </Chip>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Chip active={!layout} onClick={() => setLayout(null)}>
                {t('templates.gallery.allLayouts')}
              </Chip>
              {layouts.map((l) => (
                <Chip key={l} active={layout === l} onClick={() => setLayout(l)}>
                  <span className="w-6 overflow-hidden rounded-[3px] border">
                    <LayoutWireframe layout={l} />
                  </span>
                  {t(`templates.layouts.${l}`)}
                </Chip>
              ))}
            </div>
          </div>

          {filtered.length ? (
            <div className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((workspace, i) => (
                <TemplateCard
                  key={workspace.id}
                  workspace={workspace}
                  onDetails={() => setIndex(i)}
                />
              ))}
            </div>
          ) : (
            <div className="mt-16 flex flex-col items-center gap-3 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-muted">
                <SearchX className="size-5 text-muted-foreground" />
              </span>
              <p className="font-medium">{t('templates.gallery.empty')}</p>
              <p className="text-sm text-muted-foreground">{t('templates.gallery.emptyHint')}</p>
              <Button variant="outline" size="sm" onClick={reset}>
                {t('templates.gallery.reset')}
              </Button>
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
      <TemplateSwitcher />
      <TemplateLightbox items={filtered} index={index} onIndexChange={setIndex} />
    </div>
  );
}
