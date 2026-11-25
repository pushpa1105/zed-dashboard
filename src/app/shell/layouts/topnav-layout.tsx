import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';

import type { NavNode, NavSection } from '@/core/feature/define-feature';
import { cn } from '@/shared/lib/cn';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';

import { MobileNav } from '../mobile-nav';
import { NavAnchor, NavBadgeView } from '../nav/nav-item-parts';
import { FlyoutItems } from '../nav/nav-tree';
import { useNavLabel } from '../nav/use-nav-label';
import { useShell } from '../nav/use-shell';
import { ShellActions, ShellBreadcrumbs } from '../shell-header';
import { WorkspaceSwitcher } from '../workspace-switcher';

type MenuEntry = { key: string; node: NavNode };

/**
 * What goes in the bar: the top-level entries when there are few, otherwise
 * one menu per section (each opening a mega panel of its pages).
 */
function useMenuEntries(sections: NavSection[]): MenuEntry[] {
  const topLevel = sections.flatMap((s) => s.items);
  if (topLevel.length <= 7) {
    return topLevel.map((node, i) => ({ key: node.to ?? `n${i}`, node }));
  }
  return sections.map((section) => ({
    key: section.id,
    node: {
      label: section.label ?? (() => section.id),
      icon: section.icon,
      children: section.items,
    },
  }));
}

/** Wide panel with icon, title and description per page (used for big menus). */
function MegaPanel({ nodes }: { nodes: NavNode[] }) {
  const label = useNavLabel();
  const { trail } = useShell();
  return (
    <div className="grid w-[34rem] grid-cols-2 gap-1 p-1">
      {nodes.map((node, i) => (
        <DropdownMenuItem
          key={node.to ?? i}
          asChild
          disabled={node.disabled}
          className="items-start p-2.5"
        >
          <NavAnchor node={node} data-active={trail.includes(node)}>
            {node.icon && (
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-background [&>svg]:size-4">
                <node.icon />
              </span>
            )}
            <span className="grid min-w-0 gap-0.5">
              <span className="flex items-center gap-1.5 font-medium">
                {label(node)}
                {node.badge !== undefined && <NavBadgeView badge={node.badge} />}
              </span>
              {node.description && (
                <span className="line-clamp-2 text-xs text-muted-foreground">
                  {label({ label: node.description })}
                </span>
              )}
            </span>
          </NavAnchor>
        </DropdownMenuItem>
      ))}
    </div>
  );
}

function BarItem({ entry, style }: { entry: MenuEntry; style: 'pill' | 'tab' }) {
  const label = useNavLabel();
  const { trail } = useShell();
  const { node } = entry;
  const active =
    trail.includes(node) || (node.children?.some((child) => trail.includes(child)) ?? false);
  const itemClass = cn(
    'inline-flex h-9 shrink-0 items-center gap-1.5 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 aria-disabled:pointer-events-none aria-disabled:opacity-45 [&>svg]:size-4',
    style === 'pill' && 'rounded-full px-3.5 hover:bg-accent',
    style === 'pill' && active && 'bg-accent text-accent-foreground',
    style === 'tab' &&
      'relative h-11 rounded-none px-1 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full',
    style === 'tab' && active && 'text-foreground after:bg-primary',
  );

  if (!node.children?.length) {
    return (
      <NavAnchor node={node} className={itemClass} aria-current={active ? 'page' : undefined}>
        {style === 'tab' && node.icon && <node.icon />}
        {label(node)}
        {node.badge !== undefined && <NavBadgeView badge={node.badge} />}
      </NavAnchor>
    );
  }

  const rich = node.children.length > 4 && node.children.some((c) => c.description);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn(itemClass, 'data-[state=open]:text-foreground')}>
        {style === 'tab' && node.icon && <node.icon />}
        {label(node)}
        <ChevronDown className="size-3.5! opacity-70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={8}
        className={rich ? 'w-auto p-1' : 'w-auto min-w-56'}
      >
        {rich ? (
          <MegaPanel nodes={node.children} />
        ) : (
          <FlyoutItems nodes={node.children} trail={trail} />
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Horizontal navigation. `topnav`: one bar with the menu in the middle.
 * `topnav-tabs`: a header bar plus an underline tab row (GitHub/Vercel style).
 */
export function TopnavLayout({ children }: { children: ReactNode }) {
  const { sections, layout } = useShell();
  const entries = useMenuEntries(sections);
  const tabs = layout === 'topnav-tabs';

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-4 md:px-8">
          <MobileNav className="lg:hidden" />
          <WorkspaceSwitcher variant="inline" className="shrink-0" />
          {tabs ? (
            <span className="hidden min-w-0 lg:block">
              <span className="mx-2 text-muted-foreground/50">/</span>
            </span>
          ) : null}
          {tabs ? (
            <ShellBreadcrumbs hideRoot className="hidden lg:flex" />
          ) : (
            <nav className="mx-4 scrollbar-none hidden min-w-0 items-center gap-0.5 overflow-x-auto lg:flex">
              {entries.map((entry) => (
                <BarItem key={entry.key} entry={entry} style="pill" />
              ))}
            </nav>
          )}
          <ShellActions withUser className="ml-auto" />
        </div>
        {tabs && (
          <nav className="mx-auto scrollbar-none hidden h-11 max-w-[1440px] items-center gap-6 overflow-x-auto overflow-y-hidden px-4 md:px-8 lg:flex">
            {entries.map((entry) => (
              <BarItem key={entry.key} entry={entry} style="tab" />
            ))}
          </nav>
        )}
      </header>
      <main className="mx-auto w-full max-w-[1440px] flex-1">{children}</main>
    </div>
  );
}
