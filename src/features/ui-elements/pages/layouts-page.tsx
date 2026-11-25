import { ArrowUpRight, Check, RotateCcw, Sparkles } from 'lucide-react';

import { translateLabel } from '@/core/feature/define-feature';
import { useWorkspaceCatalog } from '@/core/feature/workspace-catalog';
import { useTranslation } from '@/core/i18n/use-translation';
import { Link } from '@/core/router/router';
import { LayoutWireframe } from '@/core/theme/components/layout-wireframe';
import { SHELL_LAYOUTS } from '@/core/theme/config';
import { useThemeStore } from '@/core/theme/store';
import { Tag } from '@/shared/components/display/tag';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';

import { ElementsPage } from '../components/elements-page';

export default function LayoutsPage() {
  const { t } = useTranslation('ui-elements');
  const { t: tAny } = useTranslation();
  const catalog = useWorkspaceCatalog();
  const layout = useThemeStore((s) => s.layout);
  const setLayout = useThemeStore((s) => s.setLayout);

  return (
    <ElementsPage page="layouts">
      <div
        className={cn(
          'flex flex-wrap items-center justify-between gap-4 rounded-xl border p-5',
          layout === 'auto' ? 'border-primary/40 bg-primary/5' : 'bg-card',
        )}
      >
        <div className="flex items-start gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="size-5" />
          </span>
          <div>
            <p className="font-semibold">{t('layoutsUi.autoTitle')}</p>
            <p className="text-sm text-muted-foreground">{t('layoutsUi.autoHint')}</p>
          </div>
        </div>
        {layout === 'auto' ? (
          <Tag tone="primary" icon={Check}>
            {t('layoutsUi.current')}
          </Tag>
        ) : (
          <Button variant="outline" onClick={() => setLayout('auto')}>
            <RotateCcw /> {t('layoutsUi.reset')}
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
        {SHELL_LAYOUTS.map((item) => {
          const users = catalog.filter((ws) => ws.layout === item.value);
          const example = users[0];
          const active = layout === item.value;
          return (
            <article
              key={item.value}
              className={cn(
                'flex flex-col overflow-hidden rounded-xl border bg-card shadow-xs transition-shadow hover:shadow-md',
                active && 'border-primary ring-2 ring-primary/20',
              )}
            >
              <div className="border-b bg-muted/40 p-5">
                <LayoutWireframe layout={item.value} className="rounded-lg border" />
              </div>
              <div className="flex flex-1 flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-semibold">{item.label}</h2>
                    <p className="text-sm text-muted-foreground">{item.hint}</p>
                  </div>
                  {active && (
                    <Tag tone="primary" size="sm" icon={Check}>
                      {t('layoutsUi.current')}
                    </Tag>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {users.length ? (
                    <>
                      {t('layoutsUi.usedBy')}:{' '}
                      <span className="text-foreground">
                        {users.map((ws) => translateLabel(ws.name, tAny)).join(', ')}
                      </span>
                    </>
                  ) : (
                    t('layoutsUi.noExample')
                  )}
                </p>
                <div className="mt-auto grid gap-2 pt-1">
                  <Button
                    size="sm"
                    variant={active ? 'secondary' : 'default'}
                    disabled={active}
                    onClick={() => setLayout(item.value)}
                  >
                    {t('layoutsUi.apply')}
                  </Button>
                  {example && (
                    <Button size="sm" variant="outline" asChild>
                      <Link to={example.basePath}>
                        {t('layoutsUi.open', { name: translateLabel(example.name, tAny) })}
                        <ArrowUpRight />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </ElementsPage>
  );
}
