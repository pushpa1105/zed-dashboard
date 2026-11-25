import { ChevronDown } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { cn } from '@/shared/lib/cn';

export type OrgNode = {
  id: string;
  name: string;
  title: string;
  /** Small tag under the title (team, location…). */
  tag?: ReactNode;
  reports?: OrgNode[];
};

/**
 * Top-down org chart with connector lines. Each manager can fold their
 * reports; the count shows how many people sit below them.
 */
export function OrgChart({
  root,
  className,
  defaultCollapsed = [],
}: {
  root: OrgNode;
  className?: string;
  defaultCollapsed?: string[];
}) {
  const [collapsed, setCollapsed] = useState(() => new Set(defaultCollapsed));
  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const countBelow = (node: OrgNode): number =>
    (node.reports ?? []).reduce((sum, r) => sum + 1 + countBelow(r), 0);

  const renderNode = (node: OrgNode): ReactNode => {
    const reports = node.reports ?? [];
    const open = reports.length > 0 && !collapsed.has(node.id);
    return (
      <li key={node.id} className="org-node relative flex flex-col items-center px-2 pt-6">
        <div className="relative z-10 w-48 rounded-xl border bg-card p-3 text-center shadow-xs">
          <InitialsAvatar name={node.name} className="mx-auto" />
          <p className="mt-2 truncate text-sm font-semibold">{node.name}</p>
          <p className="truncate text-xs text-muted-foreground">{node.title}</p>
          {node.tag && <div className="mt-2 flex justify-center">{node.tag}</div>}
          {reports.length > 0 && (
            <button
              type="button"
              onClick={() => toggle(node.id)}
              aria-expanded={open}
              className="absolute -bottom-3 left-1/2 flex h-6 -translate-x-1/2 items-center gap-1 rounded-full border bg-card px-2 text-[0.6875rem] font-medium text-muted-foreground shadow-xs hover:text-foreground"
            >
              {countBelow(node)}
              <ChevronDown className={cn('size-3 transition-transform', !open && '-rotate-90')} />
            </button>
          )}
        </div>
        {open && <ul className="org-children relative flex pt-4">{reports.map(renderNode)}</ul>}
      </li>
    );
  };

  return (
    <div className={cn('overflow-x-auto pb-2', className)}>
      {/* Connector lines: a vertical stub above each node, joined by a horizontal bar. */}
      <style>{`
        .org-chart .org-children::before { content: ''; position: absolute; top: 0; left: 50%; height: 1rem; border-left: 1px solid var(--border); }
        .org-chart .org-children > .org-node::before,
        .org-chart .org-children > .org-node::after { content: ''; position: absolute; top: 0; height: 1.5rem; width: 50%; border-top: 1px solid var(--border); }
        .org-chart .org-children > .org-node::before { right: 50%; }
        .org-chart .org-children > .org-node::after { left: 50%; border-left: 1px solid var(--border); }
        .org-chart .org-children > .org-node:first-child::before,
        .org-chart .org-children > .org-node:last-child::after { border-top: 0; }
        .org-chart .org-children > .org-node:only-child::before { display: none; }
        .org-chart .org-children > .org-node:only-child::after { border-top: 0; }
        .org-chart .org-children > .org-node:last-child::before { border-right: 1px solid var(--border); border-top-right-radius: 8px; }
        .org-chart .org-children > .org-node:first-child::after { border-top-left-radius: 8px; }
      `}</style>
      <ul className="org-chart mx-auto flex w-max justify-center [&>.org-node]:pt-0">
        {renderNode(root)}
      </ul>
    </div>
  );
}
