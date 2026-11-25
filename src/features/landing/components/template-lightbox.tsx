import { ChevronLeft, ChevronRight, MonitorPlay } from 'lucide-react';
import { useEffect } from 'react';

import type { WorkspaceSummary } from '@/core/feature/workspace-catalog';
import { useTranslation } from '@/core/i18n/use-translation';
import { Link } from '@/core/router/router';
import { LayoutWireframe } from '@/core/theme/components/layout-wireframe';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/shared/ui/dialog';

import { liveDemoHref, useTemplateText } from '../lib/templates';

import { TemplatePreview } from './template-preview';

/**
 * Large preview of one template with previous/next (buttons or ← →) and a
 * one-click live demo. `index === null` means closed.
 */
export function TemplateLightbox({
  items,
  index,
  onIndexChange,
}: {
  items: WorkspaceSummary[];
  index: number | null;
  onIndexChange: (index: number | null) => void;
}) {
  const { t } = useTranslation('landing');
  const textOf = useTemplateText();
  const open = index !== null && items.length > 0;
  const current = open ? items[Math.min(index, items.length - 1)]! : null;
  const step = (delta: number) =>
    index !== null && onIndexChange((index + delta + items.length) % items.length);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') step(1);
      if (event.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!current) return null;
  const text = textOf(current);

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onIndexChange(null)}>
      <DialogContent className="max-h-[92svh] gap-0 overflow-y-auto p-0 sm:max-w-6xl">
        <div className="grid lg:grid-cols-[1fr_20rem]">
          <div className="relative bg-muted/40 p-4 md:p-6">
            <TemplatePreview key={current.id} workspace={current} size="lg" />
            <div className="mt-4 flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={() => step(-1)}>
                <ChevronLeft /> {t('templates.gallery.previous')}
              </Button>
              <span className="text-xs text-muted-foreground tabular-nums">
                {index! + 1} / {items.length}
              </span>
              <Button variant="outline" size="sm" onClick={() => step(1)}>
                {t('templates.gallery.next')} <ChevronRight />
              </Button>
            </div>
          </div>
          <aside className="flex flex-col gap-6 border-t p-6 lg:border-t-0 lg:border-l">
            <div className="space-y-2">
              {text.category && (
                <p className="text-xs font-medium tracking-wider text-primary uppercase">
                  {text.category}
                </p>
              )}
              <DialogTitle className="text-xl">{text.name}</DialogTitle>
              <DialogDescription>{text.description}</DialogDescription>
            </div>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <dt className="text-xs text-muted-foreground">{t('templates.layout')}</dt>
                <dd className="font-medium">{text.layout}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-xs text-muted-foreground">
                  {t('templates.gallery.pagesLabel')}
                </dt>
                <dd className="font-medium tabular-nums">{current.pageCount}</dd>
              </div>
            </dl>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">{t('templates.gallery.structure')}</p>
              <div className="overflow-hidden rounded-lg border">
                <LayoutWireframe layout={current.layout} />
              </div>
              <p className="text-xs text-muted-foreground">
                {t(`templates.layoutHints.${current.layout}`)}
              </p>
            </div>
            <div className="mt-auto grid gap-2">
              <Button asChild>
                <Link to={liveDemoHref(current.basePath)}>
                  <MonitorPlay /> {t('templates.livePreview')}
                </Link>
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                {t('templates.gallery.noSignup')}
              </p>
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}
