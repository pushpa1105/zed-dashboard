import { ArrowUpRight, PanelsTopLeft } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { Link } from '@/core/router/router';

import { PageThumb } from '../components/page-thumb';
import { IN_APP, PAGE_GROUPS } from '../model/catalog';
import { pagesRoutes } from '../routes';

/** Gallery of every page template, grouped; public ones open full-page. */
export default function PagesIndexPage() {
  const { t } = useTranslation('pages');

  return (
    <Page title={t('gallery.title')} description={t('gallery.description')} width="full">
      <div className="grid gap-10">
        {PAGE_GROUPS.map((group) => (
          <section key={group.key} className="space-y-4">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-base font-semibold">{t(`gallery.groups.${group.key}`)}</h2>
              <p className="text-xs text-muted-foreground">
                {t('gallery.count', { count: group.items.length })}
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {group.items.map((key) => {
                const inApp = IN_APP.includes(key);
                return (
                  <Link
                    key={key}
                    to={pagesRoutes[key].href()}
                    className="group flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-xs transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <PageThumb kind={key} />
                    <div className="flex items-start justify-between gap-3 px-1 pb-1">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {t(`templates.${key}.title`)}
                        </p>
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {t(`templates.${key}.body`)}
                        </p>
                      </div>
                      <span
                        className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[0.6875rem] text-muted-foreground"
                        title={inApp ? t('gallery.inApp') : t('gallery.fullPage')}
                      >
                        {inApp ? (
                          <PanelsTopLeft className="size-3" />
                        ) : (
                          <ArrowUpRight className="size-3" />
                        )}
                        {inApp ? t('gallery.inApp') : t('gallery.fullPage')}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </Page>
  );
}
