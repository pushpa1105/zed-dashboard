import { ChevronRight } from 'lucide-react';
import { useState } from 'react';

import type { NavNode, NavSection } from '@/core/feature/define-feature';
import { cn } from '@/shared/lib/cn';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/ui/collapsible';

import { NavAnchor, NavBadgeView } from './nav-item-parts';
import { useNavLabel } from './use-nav-label';

type NavListProps = {
  sections: NavSection[];
  trail: NavNode[];
  /** Close a mobile sheet after navigating. */
  onNavigate?: () => void;
  showSectionLabels?: boolean;
  className?: string;
};

const rowClass =
  'group/row flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-sm text-muted-foreground transition-colors outline-none hover:bg-accent/70 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 aria-disabled:pointer-events-none aria-disabled:opacity-45 data-[active=true]:bg-accent data-[active=true]:font-medium data-[active=true]:text-accent-foreground [&>svg]:size-4 [&>svg]:shrink-0';

function NavRow({
  node,
  trail,
  depth,
  onNavigate,
}: {
  node: NavNode;
  trail: NavNode[];
  depth: number;
  onNavigate?: () => void;
}) {
  const label = useNavLabel();
  const inTrail = trail.includes(node);
  const isLeafActive = trail.at(-1) === node;
  const [open, setOpen] = useState(inTrail);
  const Icon = node.icon;

  const content = (
    <>
      {Icon ? (
        <Icon className={cn(isLeafActive && 'text-primary')} />
      ) : depth > 0 ? null : (
        <span className="size-4" />
      )}
      <span className="truncate">{label(node)}</span>
      {node.badge !== undefined && <NavBadgeView badge={node.badge} className="ml-auto" />}
    </>
  );

  if (!node.children?.length) {
    return (
      <li>
        <NavAnchor
          node={node}
          onNavigate={onNavigate}
          className={rowClass}
          data-active={isLeafActive}
          aria-current={isLeafActive ? 'page' : undefined}
        >
          {content}
        </NavAnchor>
      </li>
    );
  }

  return (
    <li>
      <Collapsible open={open || (inTrail && !node.to)} onOpenChange={setOpen}>
        <CollapsibleTrigger
          disabled={node.disabled}
          aria-disabled={node.disabled || undefined}
          className={cn(rowClass, inTrail && 'text-foreground')}
        >
          {content}
          <ChevronRight
            className={cn(
              'ml-auto size-3.5! transition-transform duration-200 group-data-[state=open]/row:rotate-90',
              node.badge !== undefined && 'ml-1.5',
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
          <ul className="mt-0.5 ml-[1.0625rem] space-y-0.5 border-l pl-2.5">
            {node.children.map((child, i) => (
              <NavRow
                key={child.to ?? i}
                node={child}
                trail={trail}
                depth={depth + 1}
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
}

/**
 * Standalone nested menu (no sidebar context needed): used by the dual
 * panel, the boxed layout, mobile sheets and the rail flyouts.
 */
export function NavList({
  sections,
  trail,
  onNavigate,
  showSectionLabels = true,
  className,
}: NavListProps) {
  const label = useNavLabel();
  return (
    <nav className={cn('space-y-5', className)}>
      {sections.map((section) => (
        <div key={section.id} className="space-y-1">
          {showSectionLabels && section.label && (
            <p className="px-2.5 pb-1 text-[0.6875rem] font-medium tracking-wider text-muted-foreground/80 uppercase">
              {label({ label: section.label })}
            </p>
          )}
          <ul className="space-y-0.5">
            {section.items.map((node, i) => (
              <NavRow
                key={node.to ?? i}
                node={node}
                trail={trail}
                depth={0}
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
