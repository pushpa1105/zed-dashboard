import {
  KeyRound,
  Layers2,
  LayoutTemplate,
  ListFilter,
  SlidersHorizontal,
  TextCursorInput,
} from 'lucide-react';

import { routes } from '@/core/config/routes';
import { useTranslation } from '@/core/i18n/use-translation';
import { NavLink } from '@/core/router/router';
import { cn } from '@/shared/lib/cn';

import { uiFormsRoutes } from '../routes';

const TABS = [
  { key: 'forms', to: routes.uiForms.href(), icon: TextCursorInput },
  { key: 'layouts', to: uiFormsRoutes.formLayouts.href(), icon: LayoutTemplate },
  { key: 'auth', to: uiFormsRoutes.authForms.href(), icon: KeyRound },
  { key: 'inputs', to: uiFormsRoutes.inputs.href(), icon: SlidersHorizontal },
  { key: 'selects', to: routes.uiSelects.href(), icon: ListFilter },
  { key: 'overlays', to: routes.uiOverlays.href(), icon: Layers2 },
] as const;

/** Sub-navigation between the ui-forms showcase pages. */
export function UiFormsTabs() {
  const { t } = useTranslation('ui-forms');
  return (
    <nav className="-mt-2 flex gap-1 overflow-x-auto border-b" aria-label={t('nav')}>
      {TABS.map(({ key, to, icon: Icon }) => (
        <NavLink
          key={key}
          to={to}
          end
          className={({ isActive }) =>
            cn(
              '-mb-px inline-flex h-10 shrink-0 items-center gap-2 border-b-2 border-transparent px-3 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground',
              isActive && 'border-primary text-foreground',
            )
          }
        >
          <Icon className="size-4" />
          {t(`tabs.${key}`)}
        </NavLink>
      ))}
    </nav>
  );
}
