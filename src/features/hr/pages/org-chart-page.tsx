import { ChevronDown, ChevronUp, Maximize2, Minus, Plus, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { Link } from '@/core/router/router';
import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { ButtonGroup } from '@/shared/ui/button-group';
import { Skeleton } from '@/shared/ui/skeleton';

import { peopleQuery, useEmployees } from '../api/hr-api';
import { DepartmentLabel } from '../components/hr-parts';
import { WidgetError } from '../components/widget-error';
import { departmentColor, type Employee } from '../model/hr';
import { hrRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(peopleQuery());
    return null;
  };

type Node = Employee & { children: Node[] };

function buildTree(people: Employee[]): Node[] {
  const nodes = new Map(people.map((p) => [p.id, { ...p, children: [] as Node[] }]));
  const roots: Node[] = [];
  for (const node of nodes.values()) {
    const parent = node.managerId ? nodes.get(node.managerId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}

const ZOOMS = [0.6, 0.75, 0.9, 1, 1.15] as const;

function OrgNode({
  node,
  expanded,
  onToggle,
}: {
  node: Node;
  expanded: Set<string>;
  onToggle: (id: string) => void;
}) {
  const { t } = useTranslation('hr');
  const open = expanded.has(node.id);
  const color = departmentColor(node.department);

  return (
    <>
      <div
        className="relative w-52 overflow-hidden rounded-xl border bg-card text-left shadow-xs"
        style={{ borderTopColor: color, borderTopWidth: 3 }}
      >
        <Link
          to={hrRoutes.person.href({ personId: node.id })}
          className="flex items-center gap-3 p-3 hover:bg-muted/50"
        >
          <InitialsAvatar name={node.name} size="md" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{node.name}</p>
            <p className="truncate text-xs text-muted-foreground">{node.title}</p>
          </div>
        </Link>
        {node.children.length > 0 && (
          <button
            type="button"
            onClick={() => onToggle(node.id)}
            aria-expanded={open}
            className="flex w-full items-center justify-center gap-1 border-t py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          >
            {t('org.reports', { count: node.children.length })}
            {open ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </button>
        )}
      </div>
      {open && node.children.length > 0 && (
        <>
          <span className="h-6 w-px bg-border" aria-hidden />
          <ul className="flex">
            {node.children.map((child) => (
              <li
                key={child.id}
                className={cn(
                  'relative flex flex-col items-center px-3 pt-6',
                  // Connectors: a horizontal rail across siblings + a stub down to each card.
                  'before:absolute before:top-0 before:right-0 before:left-0 before:h-px before:bg-border first:before:left-1/2 last:before:right-1/2 only:before:hidden',
                  'after:absolute after:top-0 after:left-1/2 after:h-6 after:w-px after:bg-border',
                )}
              >
                <OrgNode node={child} expanded={expanded} onToggle={onToggle} />
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

export default function OrgChartPage() {
  const { t } = useTranslation('hr');
  const people = useEmployees();
  const tree = useMemo(() => buildTree(people.data ?? []), [people.data]);
  const roots = tree;
  const [expanded, setExpanded] = useState<Set<string> | null>(null);
  const [zoom, setZoom] = useState<(typeof ZOOMS)[number]>(0.75);

  // Default: the top two levels are open.
  const open = expanded ?? new Set(roots.flatMap((r) => [r.id]));
  const toggle = (id: string) => {
    const next = new Set(open);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpanded(next);
  };
  const departments = Array.from(new Set((people.data ?? []).map((p) => p.department)));
  const zoomIndex = ZOOMS.indexOf(zoom);

  return (
    <Page
      width="full"
      title={t('org.title')}
      description={t('org.description')}
      actions={
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setExpanded(new Set((people.data ?? []).map((p) => p.id)))}
          >
            <Maximize2 /> {t('org.expandAll')}
          </Button>
          <Button variant="outline" onClick={() => setExpanded(new Set())}>
            {t('org.collapseAll')}
          </Button>
        </div>
      }
    >
      <section className="overflow-hidden rounded-xl border bg-card shadow-xs">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b px-6 py-3">
          <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            {t('org.legend')}
          </span>
          {departments.map((d) => (
            <DepartmentLabel key={d} department={d} className="text-sm" />
          ))}
          <ButtonGroup className="ml-auto">
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={t('org.zoomOut')}
              disabled={zoomIndex === 0}
              onClick={() => setZoom(ZOOMS[Math.max(0, zoomIndex - 1)]!)}
            >
              <Minus />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-16 tabular-nums"
              aria-label={t('org.reset')}
              onClick={() => setZoom(1)}
            >
              {Math.round(zoom * 100)}%
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={t('org.zoomIn')}
              disabled={zoomIndex === ZOOMS.length - 1}
              onClick={() => setZoom(ZOOMS[Math.min(ZOOMS.length - 1, zoomIndex + 1)]!)}
            >
              <Plus />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={t('org.reset')}
              onClick={() => {
                setZoom(0.75);
                setExpanded(null);
              }}
            >
              <RotateCcw />
            </Button>
          </ButtonGroup>
        </div>
        {people.isError ? (
          <div className="p-6">
            <WidgetError onRetry={() => void people.refetch()} />
          </div>
        ) : !people.data ? (
          <Skeleton className="m-6 h-96" />
        ) : (
          <div className="max-h-[calc(100svh-17rem)] min-h-[28rem] overflow-auto bg-[radial-gradient(circle,var(--border)_1px,transparent_1px)] [background-size:20px_20px]">
            <div className="inline-flex min-w-full justify-center p-10" style={{ zoom }}>
              <div className="flex flex-col items-center">
                {roots.map((root) => (
                  <OrgNode key={root.id} node={root} expanded={open} onToggle={toggle} />
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </Page>
  );
}
