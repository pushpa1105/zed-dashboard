import { routes } from '@/core/config/routes';
import { translateLabel } from '@/core/feature/define-feature';
import type { WorkspaceSummary } from '@/core/feature/workspace-catalog';
import { useTranslation } from '@/core/i18n/use-translation';

/**
 * One click into a dashboard: `/login?demo=admin` signs in automatically and
 * the guest guard then forwards to `redirectTo` (signed-in visitors skip
 * straight to it).
 */
export const liveDemoHref = (basePath: string) =>
  routes.login.href({ demo: 'admin', redirectTo: basePath });

/** Translated texts of a workspace summary, plus its layout name. */
export function useTemplateText() {
  const { t } = useTranslation('landing');
  return (ws: WorkspaceSummary) => ({
    name: translateLabel(ws.name, t),
    description: translateLabel(ws.description, t),
    category: ws.category ? translateLabel(ws.category, t) : '',
    layout: t(`templates.layouts.${ws.layout}`),
    pages: t('templates.pages', { count: ws.pageCount }),
  });
}
