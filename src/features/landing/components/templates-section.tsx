import { ArrowRight } from 'lucide-react';
import { useState } from 'react';

import { useWorkspaceCatalog } from '@/core/feature/workspace-catalog';
import { useTranslation } from '@/core/i18n/use-translation';
import { Link } from '@/core/router/router';
import { Button } from '@/shared/ui/button';

import { landingRoutes } from '../routes';

import { TemplateLightbox } from './template-lightbox';
import { TemplateCard } from './template-preview';

/**
 * "See every dashboard before you buy": every workspace with a screenshot,
 * a one-click live demo and a detail lightbox. Lists all registered
 * workspaces, so it follows the module registry.
 */
export function TemplatesSection({ limit }: { limit?: number }) {
  const { t } = useTranslation('landing');
  const catalog = useWorkspaceCatalog();
  const items = limit ? catalog.slice(0, limit) : catalog;
  const [index, setIndex] = useState<number | null>(null);

  if (!catalog.length) return null;

  return (
    <section id="templates" className="scroll-mt-20 border-t">
      <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <p className="text-sm font-medium text-primary">{t('templates.eyebrow')}</p>
            <h2 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">
              {t('templates.title', { count: catalog.length })}
            </h2>
            <p className="text-lg text-pretty text-muted-foreground">{t('templates.subtitle')}</p>
          </div>
          <Button variant="outline" asChild>
            <Link to={landingRoutes.templates.href()}>
              {t('templates.viewAll')} <ArrowRight />
            </Link>
          </Button>
        </div>
        <div className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((workspace, i) => (
            <TemplateCard key={workspace.id} workspace={workspace} onDetails={() => setIndex(i)} />
          ))}
        </div>
      </div>
      <TemplateLightbox items={items} index={index} onIndexChange={setIndex} />
    </section>
  );
}
