import { ArrowRight, BookOpen, LayoutDashboard, LifeBuoy, Search } from 'lucide-react';
import { useState } from 'react';

import { BrandLogo } from '@/core/brand/components/brand-logo';
import { routes } from '@/core/config/routes';
import { useTranslation } from '@/core/i18n/use-translation';
import { Head } from '@/core/layout/head';
import { Link } from '@/core/router/router';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

import { BackToGallery } from '../components/template-kit';
import { pagesRoutes } from '../routes';

const LINKS = [
  { key: 'dashboard', icon: LayoutDashboard, to: routes.app.href() },
  { key: 'docs', icon: BookOpen, to: pagesRoutes.help.href() },
  { key: 'support', icon: LifeBuoy, to: pagesRoutes.help.href() },
] as const;

/** Status template: 404 with search and the three most likely destinations. */
export default function NotFoundTemplatePage() {
  const { t } = useTranslation('pages');
  const [query, setQuery] = useState('');

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <Head title={t('templates.notFound.title')} />
      <header className="flex h-16 items-center px-6">
        <BrandLogo />
      </header>
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 pb-20">
        <p className="font-mono text-sm font-medium text-primary">{t('status.notFound.code')}</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-balance md:text-5xl">
          {t('status.notFound.title')}
        </h1>
        <p className="mt-4 text-muted-foreground">{t('status.notFound.body')}</p>
        <form
          className="relative mt-8"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('status.notFound.search')}
            className="pl-9"
          />
        </form>
        <ul className="mt-8 divide-y rounded-xl border">
          {LINKS.map(({ key, icon: Icon, to }) => (
            <li key={key}>
              <Link
                to={to}
                className="group flex items-center gap-4 p-4 transition-colors hover:bg-muted/50"
              >
                <span className="flex size-10 items-center justify-center rounded-lg border bg-card">
                  <Icon className="size-4 text-primary" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">
                    {t(`status.notFound.links.${key}.title`)}
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    {t(`status.notFound.links.${key}.body`)}
                  </span>
                </span>
                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
        <Button variant="link" asChild className="mt-6 self-start px-0">
          <Link to={routes.home.href()}>{t('status.home')}</Link>
        </Button>
      </main>
      <BackToGallery />
    </div>
  );
}
