import { Check, ChevronsUpDown, LayoutTemplate } from 'lucide-react';

import { useSession } from '@/core/auth/session';
import { BrandMark } from '@/core/brand/components/brand-logo';
import { routes } from '@/core/config/routes';
import { translateLabel } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Link } from '@/core/router/router';
import { SHELL_LAYOUTS } from '@/core/theme/config';
import { cn } from '@/shared/lib/cn';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';

import { modules } from '../modules';
import { buildAppWorkspace, getWorkspaces, type Workspace } from '../registry';

import { useShell } from './nav/use-shell';

/** The main app shows the brand mark; each dashboard its own icon. */
function WorkspaceMark({ workspace, className }: { workspace: Workspace; className?: string }) {
  if (workspace.id === 'app') return <BrandMark className={cn('size-8 shadow-xs', className)} />;
  const Icon = workspace.icon;
  return (
    <span
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs',
        className,
      )}
    >
      <Icon className="size-4" />
    </span>
  );
}

type SwitcherVariant = 'full' | 'compact' | 'inline';

/**
 * Jumps between dashboard products. Each entry names its default layout, so
 * the switcher doubles as a tour of every shell structure.
 */
export function WorkspaceSwitcher({
  variant = 'full',
  className,
}: {
  variant?: SwitcherVariant;
  className?: string;
}) {
  const { t } = useTranslation();
  const { workspace } = useShell();
  const { data: user } = useSession();
  const all = [buildAppWorkspace(modules, user), ...getWorkspaces(modules)];
  const name = translateLabel(workspace.name, t);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'flex items-center gap-2.5 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
          variant === 'full' &&
            'w-full p-1.5 hover:bg-sidebar-accent data-[state=open]:bg-sidebar-accent',
          variant === 'inline' && 'h-9 px-1.5 hover:bg-accent',
          variant === 'compact' && 'p-0',
          className,
        )}
        aria-label={t('shell.switchWorkspace')}
      >
        <WorkspaceMark workspace={workspace} className={cn(variant === 'compact' && 'size-10')} />
        {variant !== 'compact' && (
          <>
            <span className="grid min-w-0 flex-1 leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate text-sm font-semibold">{name}</span>
              {variant === 'full' && (
                <span className="truncate text-xs text-muted-foreground">
                  {workspace.category
                    ? translateLabel(workspace.category, t)
                    : translateLabel(workspace.description, t)}
                </span>
              )}
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side={variant === 'compact' ? 'right' : 'bottom'}
        className="w-80 p-1.5"
      >
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          {t('shell.switchWorkspace')}
        </DropdownMenuLabel>
        <div className="max-h-[60svh] overflow-y-auto">
          {all.map((ws) => {
            const active = ws.id === workspace.id;
            const layout = SHELL_LAYOUTS.find((l) => l.value === ws.layout)?.label;
            return (
              <DropdownMenuItem key={ws.id} asChild className="items-start gap-3 py-2">
                <Link to={ws.basePath}>
                  <WorkspaceMark
                    workspace={ws}
                    className={cn(!active && 'bg-muted text-foreground shadow-none')}
                  />
                  <span className="grid min-w-0 flex-1 gap-0.5">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <span className="truncate">{translateLabel(ws.name, t)}</span>
                      {ws.id !== 'app' && layout && (
                        <span className="rounded border px-1 text-[0.625rem] font-normal text-muted-foreground">
                          {layout}
                        </span>
                      )}
                    </span>
                    <span className="line-clamp-1 text-xs text-muted-foreground">
                      {translateLabel(ws.description, t)}
                    </span>
                  </span>
                  {active && <Check className="mt-1 size-4 text-primary" />}
                </Link>
              </DropdownMenuItem>
            );
          })}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to={`${routes.home.href()}#templates`}>
            <LayoutTemplate /> {t('shell.browseTemplates')}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
