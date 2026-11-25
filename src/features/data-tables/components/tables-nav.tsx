import {
  Database,
  FileSpreadsheet,
  Grid3x3,
  GripVertical,
  Infinity as InfinityIcon,
  LayoutList,
  ListTree,
  PanelBottomOpen,
  Server,
  WalletCards,
} from 'lucide-react';

import { routes } from '@/core/config/routes';
import { useTranslation } from '@/core/i18n/use-translation';
import { NavLink } from '@/core/router/router';
import { cn } from '@/shared/lib/cn';

import { tableRoutes } from '../routes';

const TABS = [
  { to: routes.tables.href(), key: 'server', icon: Server },
  { to: routes.tablesClient.href(), key: 'client', icon: Database },
  { to: tableRoutes.spreadsheet.href(), key: 'spreadsheet', icon: FileSpreadsheet },
  { to: tableRoutes.tree.href(), key: 'tree', icon: ListTree },
  { to: tableRoutes.masterDetail.href(), key: 'masterDetail', icon: PanelBottomOpen },
  { to: tableRoutes.infinite.href(), key: 'infinite', icon: InfinityIcon },
  { to: tableRoutes.views.href(), key: 'views', icon: LayoutList },
  { to: tableRoutes.reorder.href(), key: 'reorder', icon: GripVertical },
  { to: tableRoutes.financial.href(), key: 'financial', icon: WalletCards },
  { to: routes.tablesGrid.href(), key: 'grid', icon: Grid3x3 },
] as const;

/** Underline tabs between every table example (scrolls sideways on small screens). */
export function TablesNav() {
  const { t } = useTranslation('data-tables');
  return (
    <nav aria-label={t('tabs.label')} className="-mt-2 flex gap-1 overflow-x-auto border-b">
      {TABS.map(({ to, key, icon: Icon }) => (
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
