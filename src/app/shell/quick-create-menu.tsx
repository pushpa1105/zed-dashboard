import { Plus } from 'lucide-react';

import { hasRole } from '@/core/auth/access';
import { useSession } from '@/core/auth/session';
import { translateLabel } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Link } from '@/core/router/router';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';

import { useShell } from './nav/use-shell';

/** Header "Create" menu with the workspace's `quickActions`. Renders nothing without any. */
export function QuickCreateMenu() {
  const { t } = useTranslation();
  const { workspace } = useShell();
  const { data: user } = useSession();
  const actions = (workspace.quickActions ?? []).filter((a) => hasRole(user, a.roles));
  if (actions.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className="h-8 gap-1.5 px-2.5 max-sm:size-8 max-sm:px-0">
          <Plus />
          <span className="max-sm:sr-only">{t('shell.create')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          {t('shell.createIn', { workspace: translateLabel(workspace.name, t) })}
        </DropdownMenuLabel>
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <DropdownMenuItem key={action.id} asChild className="items-start gap-3 py-2">
              <Link to={action.to}>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-background">
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">
                    {translateLabel(action.label, t)}
                  </span>
                  {action.description && (
                    <span className="block text-xs text-muted-foreground">
                      {translateLabel(action.description, t)}
                    </span>
                  )}
                </span>
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
