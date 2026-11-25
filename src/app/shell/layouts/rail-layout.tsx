import type { ReactNode } from 'react';

import type { NavNode } from '@/core/feature/define-feature';
import { cn } from '@/shared/lib/cn';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';

import { MobileNav } from '../mobile-nav';
import { NavAnchor } from '../nav/nav-item-parts';
import { FlyoutItems } from '../nav/nav-tree';
import { useNavLabel } from '../nav/use-nav-label';
import { useShell } from '../nav/use-shell';
import { ShellHeader } from '../shell-header';
import { UserMenu } from '../user-menu';
import { WorkspaceSwitcher } from '../workspace-switcher';

const iconButton =
  'relative flex size-11 items-center justify-center rounded-xl text-sidebar-foreground/75 transition-colors outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring aria-disabled:pointer-events-none aria-disabled:opacity-40 data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:shadow-md data-[active=true]:shadow-primary/30 [&>svg]:size-5';

function RailItem({ node }: { node: NavNode }) {
  const label = useNavLabel();
  const { trail } = useShell();
  const active = trail.includes(node);
  const Icon = node.icon;
  const text = label(node);
  const dot = node.badge !== undefined && (
    <span className="absolute top-2 right-2 size-2 rounded-full bg-destructive ring-2 ring-sidebar" />
  );

  if (node.children?.length) {
    return (
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger className={iconButton} data-active={active} aria-label={text}>
              {Icon && <Icon />}
              {dot}
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="right">{text}</TooltipContent>
        </Tooltip>
        <DropdownMenuContent side="right" align="start" sideOffset={12} className="min-w-56">
          <DropdownMenuLabel>{text}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <FlyoutItems nodes={node.children} trail={trail} />
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <NavAnchor
          node={node}
          hideExternalIcon
          className={iconButton}
          data-active={active}
          aria-label={text}
          aria-current={active ? 'page' : undefined}
        >
          {Icon && <Icon />}
          {dot}
        </NavAnchor>
      </TooltipTrigger>
      <TooltipContent side="right">{text}</TooltipContent>
    </Tooltip>
  );
}

/**
 * Slim dark icon rail. Top-level entries are icons with tooltips; entries with
 * children open a flyout. On small screens the rail hides behind a menu button.
 */
export function RailLayout({ children }: { children: ReactNode }) {
  const { sections } = useShell();

  return (
    <div className="min-h-svh bg-background">
      <aside className="sidebar-dark fixed inset-y-0 left-0 z-30 hidden w-[5.25rem] flex-col items-center gap-2 bg-sidebar py-4 text-sidebar-foreground md:flex">
        <WorkspaceSwitcher variant="compact" />
        <nav className="mt-4 scrollbar-none flex w-full flex-1 flex-col items-center gap-1.5 overflow-x-hidden overflow-y-auto py-1">
          {sections.map((section, i) => (
            <div key={section.id} className="flex flex-col items-center gap-1.5">
              {i > 0 && <span className="my-2 h-px w-8 bg-sidebar-border" />}
              {section.items.map((node, j) => (
                <RailItem key={node.to ?? j} node={node} />
              ))}
            </div>
          ))}
        </nav>
        <div
          className={cn('[&_[data-slot=avatar]]:ring-2 [&_[data-slot=avatar]]:ring-sidebar-border')}
        >
          <UserMenu variant="header" />
        </div>
      </aside>
      <div className="flex min-h-svh min-w-0 flex-col md:pl-[5.25rem]">
        <ShellHeader leading={<MobileNav className="md:hidden" />} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
