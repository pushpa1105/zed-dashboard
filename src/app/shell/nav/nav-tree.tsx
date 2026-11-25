import { ChevronRight } from 'lucide-react';

import type { NavNode, NavSection } from '@/core/feature/define-feature';
import { cn } from '@/shared/lib/cn';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/shared/ui/sidebar';

import { NavAnchor, NavBadgeView } from './nav-item-parts';
import { useNavLabel } from './use-nav-label';

/** Dropdown entries for a subtree (used when the sidebar is collapsed to icons). */
export function FlyoutItems({ nodes, trail }: { nodes: NavNode[]; trail: NavNode[] }) {
  const label = useNavLabel();
  return (
    <>
      {nodes.map((node, i) =>
        node.children?.length ? (
          <DropdownMenuSub key={node.to ?? i}>
            <DropdownMenuSubTrigger disabled={node.disabled}>
              {node.icon && <node.icon />}
              {label(node)}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="min-w-48">
              <FlyoutItems nodes={node.children} trail={trail} />
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ) : (
          <DropdownMenuItem key={node.to ?? i} asChild disabled={node.disabled}>
            <NavAnchor node={node} data-active={trail.at(-1) === node}>
              {node.icon && <node.icon />}
              <span className="truncate">{label(node)}</span>
              {node.badge !== undefined && <NavBadgeView badge={node.badge} className="ml-auto" />}
            </NavAnchor>
          </DropdownMenuItem>
        ),
      )}
    </>
  );
}

function SubTree({ nodes, trail }: { nodes: NavNode[]; trail: NavNode[] }) {
  const label = useNavLabel();
  return (
    <SidebarMenuSub>
      {nodes.map((node, i) => {
        const active = trail.at(-1) === node;
        if (node.children?.length) {
          const inTrail = trail.includes(node);
          return (
            <SidebarMenuSubItem key={node.to ?? i}>
              <Collapsible defaultOpen={inTrail} className="group/sub">
                <CollapsibleTrigger asChild disabled={node.disabled}>
                  <SidebarMenuSubButton
                    asChild={false}
                    className={cn('w-full cursor-pointer', inTrail && 'text-foreground')}
                    aria-disabled={node.disabled || undefined}
                  >
                    <span>{label(node)}</span>
                    <ChevronRight className="ml-auto size-3.5! transition-transform group-data-[state=open]/sub:rotate-90" />
                  </SidebarMenuSubButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SubTree nodes={node.children} trail={trail} />
                </CollapsibleContent>
              </Collapsible>
            </SidebarMenuSubItem>
          );
        }
        return (
          <SidebarMenuSubItem key={node.to ?? i}>
            <SidebarMenuSubButton asChild isActive={active} aria-disabled={node.disabled}>
              <NavAnchor node={node} aria-current={active ? 'page' : undefined}>
                <span>{label(node)}</span>
                {node.badge !== undefined && (
                  <NavBadgeView badge={node.badge} className="ml-auto" />
                )}
              </NavAnchor>
            </SidebarMenuSubButton>
          </SidebarMenuSubItem>
        );
      })}
    </SidebarMenuSub>
  );
}

function TopItem({ node, trail }: { node: NavNode; trail: NavNode[] }) {
  const label = useNavLabel();
  const { state, isMobile } = useSidebar();
  const collapsed = state === 'collapsed' && !isMobile;
  const inTrail = trail.includes(node);
  const active = trail.at(-1) === node;
  const text = label(node);

  if (!node.children?.length) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={active}
          tooltip={text}
          aria-disabled={node.disabled}
          className="data-active:[&>svg]:text-primary"
        >
          <NavAnchor node={node} aria-current={active ? 'page' : undefined}>
            {node.icon && <node.icon />}
            <span>{text}</span>
          </NavAnchor>
        </SidebarMenuButton>
        {node.badge !== undefined && (
          <NavBadgeView
            badge={node.badge}
            className="pointer-events-none absolute top-2 right-2 group-data-[collapsible=icon]:hidden"
          />
        )}
      </SidebarMenuItem>
    );
  }

  // Collapsed to icons: open the subtree as a flyout instead of inline.
  if (collapsed) {
    return (
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton isActive={inTrail} tooltip={text}>
              {node.icon && <node.icon />}
              <span>{text}</span>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className="min-w-52">
            <DropdownMenuLabel>{text}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <FlyoutItems nodes={node.children} trail={trail} />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    );
  }

  return (
    <Collapsible asChild defaultOpen={inTrail} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild disabled={node.disabled}>
          <SidebarMenuButton
            tooltip={text}
            aria-disabled={node.disabled}
            className={cn(inTrail && 'font-medium text-sidebar-accent-foreground')}
          >
            {node.icon && <node.icon />}
            <span>{text}</span>
            {node.badge !== undefined && <NavBadgeView badge={node.badge} className="ml-auto" />}
            <ChevronRight
              className={cn(
                'size-3.5! transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90',
                node.badge === undefined && 'ml-auto',
              )}
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SubTree nodes={node.children} trail={trail} />
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

/** Nested menu built from shadcn sidebar primitives (collapses to icons with flyouts). */
export function NavTree({ sections, trail }: { sections: NavSection[]; trail: NavNode[] }) {
  const label = useNavLabel();
  return (
    <>
      {sections.map((section) => (
        <SidebarGroup key={section.id}>
          {section.label && (
            <SidebarGroupLabel className="text-[0.6875rem] tracking-wider uppercase">
              {label({ label: section.label })}
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {section.items.map((node, i) => (
                <TopItem key={node.to ?? i} node={node} trail={trail} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}
