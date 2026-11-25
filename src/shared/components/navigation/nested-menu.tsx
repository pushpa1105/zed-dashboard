import { ChevronRight, Lock, type LucideIcon } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/ui/collapsible';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';

export type NestedMenuItem = {
  id: string;
  label: string;
  icon?: LucideIcon;
  badge?: ReactNode;
  /** Visible but inert; `disabledReason` shows in a tooltip. */
  disabled?: boolean;
  disabledReason?: string;
  children?: NestedMenuItem[];
};

export type NestedMenuGroup = {
  id: string;
  label?: string;
  /** Lets the user fold the whole group. */
  collapsible?: boolean;
  items: NestedMenuItem[];
};

const row =
  'group/row flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-left text-sm text-muted-foreground transition-colors outline-none hover:bg-accent/70 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 aria-disabled:cursor-not-allowed aria-disabled:opacity-45 aria-disabled:hover:bg-transparent data-[active=true]:bg-accent data-[active=true]:font-medium data-[active=true]:text-accent-foreground [&>svg]:size-4 [&>svg]:shrink-0';

/**
 * Router-agnostic vertical menu: groups (optionally foldable), three levels
 * of nesting, badges, icons and disabled entries with a reason tooltip.
 * Selection is local state: wire `onSelect` to your router.
 */
export function NestedMenu({
  groups,
  activeId,
  onSelect,
  defaultOpen = [],
  className,
}: {
  groups: NestedMenuGroup[];
  activeId?: string;
  onSelect?: (item: NestedMenuItem) => void;
  defaultOpen?: string[];
  className?: string;
}) {
  const [open, setOpen] = useState(() => new Set(defaultOpen));
  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const renderItem = (item: NestedMenuItem, depth: number): ReactNode => {
    const Icon = item.icon;
    const hasKids = Boolean(item.children?.length);
    const isOpen = open.has(item.id);
    const content = (
      <>
        {Icon ? <Icon /> : depth === 0 ? <span className="size-4" /> : null}
        <span className="truncate">{item.label}</span>
        {item.disabled && <Lock className="ml-auto size-3.5!" />}
        {!item.disabled && item.badge !== undefined && (
          <span className={cn('ml-auto', hasKids && 'mr-1')}>{item.badge}</span>
        )}
        {hasKids && !item.disabled && (
          <ChevronRight
            className={cn(
              'size-3.5! transition-transform',
              item.badge === undefined && 'ml-auto',
              isOpen && 'rotate-90',
            )}
          />
        )}
      </>
    );

    const button = (
      <button
        type="button"
        aria-disabled={item.disabled || undefined}
        aria-expanded={hasKids ? isOpen : undefined}
        data-active={activeId === item.id}
        className={row}
        onClick={() => {
          if (item.disabled) return;
          if (hasKids) toggle(item.id);
          else onSelect?.(item);
        }}
      >
        {content}
      </button>
    );

    return (
      <li key={item.id}>
        {item.disabled && item.disabledReason ? (
          <Tooltip>
            <TooltipTrigger asChild>{button}</TooltipTrigger>
            <TooltipContent side="right">{item.disabledReason}</TooltipContent>
          </Tooltip>
        ) : (
          button
        )}
        {hasKids && isOpen && (
          <ul className="mt-0.5 ml-[1.0625rem] space-y-0.5 border-l pl-2.5">
            {item.children!.map((child) => renderItem(child, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <nav className={cn('space-y-4', className)}>
      {groups.map((group) => {
        const list = (
          <ul className="space-y-0.5">{group.items.map((item) => renderItem(item, 0))}</ul>
        );
        if (!group.label) return <div key={group.id}>{list}</div>;
        if (!group.collapsible) {
          return (
            <div key={group.id} className="space-y-1">
              <p className="px-2.5 text-[0.6875rem] font-medium tracking-wider text-muted-foreground/80 uppercase">
                {group.label}
              </p>
              {list}
            </div>
          );
        }
        return (
          <Collapsible key={group.id} defaultOpen className="group/grp space-y-1">
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded px-2.5 text-[0.6875rem] font-medium tracking-wider text-muted-foreground/80 uppercase hover:text-foreground">
              {group.label}
              <ChevronRight className="size-3 transition-transform group-data-[state=open]/grp:rotate-90" />
            </CollapsibleTrigger>
            <CollapsibleContent>{list}</CollapsibleContent>
          </Collapsible>
        );
      })}
    </nav>
  );
}
