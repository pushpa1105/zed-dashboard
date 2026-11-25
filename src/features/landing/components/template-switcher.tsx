import { LayoutTemplate } from 'lucide-react';

import { HOME_AFTER_LOGIN, routes } from '@/core/config/routes';
import { useTranslation } from '@/core/i18n/use-translation';
import { NavLink } from '@/core/router/router';
import { cn } from '@/shared/lib/cn';

import { landingRoutes } from '../routes';

/**
 * Floating pill to hop between the landing templates and into the app.
 * Demo affordance only: delete it when you ship one template.
 */
export function TemplateSwitcher() {
  const { t } = useTranslation('landing');
  const links = [
    { to: routes.home.href(), label: t('switcher.saas') },
    { to: routes.landingStartup.href(), label: t('switcher.startup') },
    { to: routes.landingProduct.href(), label: t('switcher.product') },
    { to: landingRoutes.agency.href(), label: t('switcher.agency') },
    { to: landingRoutes.ai.href(), label: t('switcher.ai') },
    { to: landingRoutes.templates.href(), label: t('switcher.dashboards') },
  ];

  return (
    <nav
      aria-label={t('switcher.label')}
      className="fixed right-4 bottom-4 z-50 flex max-w-[calc(100vw-2rem)] items-center gap-1 overflow-x-auto rounded-full border bg-popover/90 p-1 text-sm shadow-lg backdrop-blur"
    >
      <span className="hidden items-center gap-1.5 pr-1 pl-2.5 text-xs text-muted-foreground sm:flex">
        <LayoutTemplate className="size-3.5" />
        {t('switcher.label')}
      </span>
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end
          className={({ isActive }) =>
            cn(
              'rounded-full px-3 py-1.5 whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground',
              isActive && 'bg-primary text-primary-foreground hover:text-primary-foreground',
            )
          }
        >
          {link.label}
        </NavLink>
      ))}
      <NavLink
        to={HOME_AFTER_LOGIN.href()}
        className="rounded-full border px-3 py-1.5 whitespace-nowrap hover:bg-accent"
      >
        {t('switcher.app')}
      </NavLink>
    </nav>
  );
}
