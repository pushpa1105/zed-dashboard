import type { ReactNode } from 'react';

import { routes } from '@/core/config/routes';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { Link, useLocation } from '@/core/router/router';
import { SubNav } from '@/shared/components/navigation/sub-nav';

import { uiElementsRoutes } from '../routes';

const PAGES = [
  { key: 'dataDisplay', href: routes.uiDataDisplay.href() },
  { key: 'charts', href: routes.uiCharts.href() },
  { key: 'feedback', href: routes.uiFeedback.href() },
  { key: 'navigation', href: routes.uiNavigation.href() },
  { key: 'menus', href: uiElementsRoutes.menus.href() },
  { key: 'trees', href: uiElementsRoutes.trees.href() },
  { key: 'timelines', href: uiElementsRoutes.timelines.href() },
  { key: 'widgets', href: uiElementsRoutes.widgets.href() },
  { key: 'layouts', href: uiElementsRoutes.layouts.href() },
] as const;

/** Frame shared by the showcase pages: title, description and a sub-nav between them. */
export function ElementsPage({
  page,
  children,
}: {
  page: (typeof PAGES)[number]['key'];
  children: ReactNode;
}) {
  const { t } = useTranslation('ui-elements');
  const { pathname } = useLocation();

  return (
    <Page
      width="full"
      title={t(`pages.${page}.title`)}
      description={t(`pages.${page}.description`)}
    >
      <SubNav
        aria-label={t('nav')}
        linkComponent={Link}
        items={PAGES.map((p) => ({
          key: p.key,
          href: p.href,
          label: t(`pages.${p.key}.title`),
          active: pathname === p.href,
        }))}
      />
      {children}
    </Page>
  );
}
