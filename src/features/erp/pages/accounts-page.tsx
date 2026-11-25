import { ChevronRight, ChevronsDownUp, ChevronsUpDown, CircleCheck, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatStrip } from '@/shared/components/dashboard/stat-strip';
import { Tag } from '@/shared/components/display/tag';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Skeleton } from '@/shared/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group';

import { accountsQuery, useAccounts } from '../api/erp-api';
import { ErrorPanel } from '../components/error-panel';
import { accounting, moneyWhole } from '../lib/money';
import { ACCOUNT_TYPES, type AccountNode, type AccountType } from '../model/erp';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(accountsQuery());
    return null;
  };

const TYPE_TONE = {
  asset: 'blue',
  liability: 'orange',
  equity: 'violet',
  revenue: 'aqua',
  expense: 'magenta',
} as const;

type Row = { node: AccountNode; depth: number; hasChildren: boolean };

/** Keeps leaves matching the query plus every ancestor on the way to them. */
function filterTree(nodes: AccountNode[], query: string, type: AccountType | 'all'): AccountNode[] {
  const q = query.trim().toLowerCase();
  return nodes.flatMap((node) => {
    if (type !== 'all' && node.type !== type) return [];
    const self = !q || node.name.toLowerCase().includes(q) || node.code.startsWith(q);
    if (!node.children) return self ? [node] : [];
    const children = self ? node.children : filterTree(node.children, q, type);
    return children.length ? [{ ...node, children }] : [];
  });
}

function collectGroups(nodes: AccountNode[]): string[] {
  return nodes.flatMap((n) => (n.children ? [n.code, ...collectGroups(n.children)] : []));
}

/**
 * Chart of accounts as a tree table: expandable hierarchy with period debit,
 * credit and normal-side balance, plus a trial-balance check.
 */
export default function AccountsPage() {
  const { t } = useTranslation('erp', { keyPrefix: 'accounts' });
  const accounts = useAccounts();
  const [query, setQuery] = useState('');
  const [type, setType] = useState<AccountType | 'all'>('all');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const tree = useMemo(
    () => filterTree(accounts.data ?? [], query, type),
    [accounts.data, query, type],
  );
  const searching = query.trim().length > 0;

  const rows = useMemo(() => {
    const out: Row[] = [];
    const walk = (nodes: AccountNode[], depth: number) =>
      nodes.forEach((node) => {
        out.push({ node, depth, hasChildren: !!node.children?.length });
        if (node.children && (searching || !collapsed.has(node.code)))
          walk(node.children, depth + 1);
      });
    walk(tree, 0);
    return out;
  }, [tree, collapsed, searching]);

  const totals = useMemo(() => {
    const roots = accounts.data ?? [];
    const debit = roots.reduce((s, n) => s + n.debit, 0);
    const credit = roots.reduce((s, n) => s + n.credit, 0);
    const leaves = (nodes: AccountNode[]): number =>
      nodes.reduce((s, n) => s + (n.children ? leaves(n.children) : 1), 0);
    return { debit, credit, count: leaves(roots) };
  }, [accounts.data]);
  const balanced = Math.abs(totals.debit - totals.credit) < 0.5;

  const toggle = (code: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  const allGroups = collectGroups(accounts.data ?? []);
  const anyOpen = collapsed.size < allGroups.length;

  return (
    <Page title={t('title')} description={t('description')} width="full">
      <SectionCard>
        {accounts.data ? (
          <StatStrip
            items={[
              { key: 'debit', label: t('totals.debits'), value: moneyWhole(totals.debit) },
              { key: 'credit', label: t('totals.credits'), value: moneyWhole(totals.credit) },
              {
                key: 'diff',
                label: t('totals.difference'),
                value: moneyWhole(totals.debit - totals.credit),
                hint: balanced ? (
                  <span className="inline-flex items-center gap-1 text-success">
                    <CircleCheck className="size-3.5" /> {t('totals.balanced')}
                  </span>
                ) : (
                  t('totals.unbalanced')
                ),
              },
              { key: 'count', label: t('totals.accounts'), value: totals.count },
            ]}
          />
        ) : (
          <Skeleton className="h-20 w-full" />
        )}
      </SectionCard>

      <SectionCard
        flush
        title={t('table.title')}
        description={t('table.description')}
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCollapsed(anyOpen ? new Set(allGroups) : new Set())}
          >
            {anyOpen ? <ChevronsDownUp /> : <ChevronsUpDown />}
            {anyOpen ? t('collapseAll') : t('expandAll')}
          </Button>
        }
      >
        <div className="flex flex-col gap-3 border-y bg-muted/30 px-6 py-3 md:flex-row md:items-center">
          <div className="relative md:w-72">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('search')}
              className="bg-background pl-9"
              aria-label={t('search')}
            />
          </div>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={type}
            onValueChange={(value) => value && setType(value as AccountType | 'all')}
            className="flex-wrap"
          >
            <ToggleGroupItem value="all">{t('types.all')}</ToggleGroupItem>
            {ACCOUNT_TYPES.map((value) => (
              <ToggleGroupItem key={value} value={value}>
                {t(`types.${value}`)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        {accounts.isError ? (
          <ErrorPanel className="m-6" onRetry={() => void accounts.refetch()} />
        ) : !accounts.data ? (
          <div className="space-y-2 p-6">
            {Array.from({ length: 10 }, (_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm" aria-label={t('table.title')}>
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="h-11 w-24 px-6 text-left font-medium">{t('columns.code')}</th>
                  <th className="px-3 text-left font-medium">{t('columns.account')}</th>
                  <th className="w-32 px-3 text-left font-medium">{t('columns.type')}</th>
                  <th className="w-36 px-3 text-right font-medium">{t('columns.debit')}</th>
                  <th className="w-36 px-3 text-right font-medium">{t('columns.credit')}</th>
                  <th className="w-40 px-6 text-right font-medium">{t('columns.balance')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ node, depth, hasChildren }) => {
                  const open = searching || !collapsed.has(node.code);
                  return (
                    <tr
                      key={node.code}
                      className={cn(
                        'border-b last:border-b-0 hover:bg-muted/40',
                        depth === 0 && 'bg-muted/25',
                      )}
                    >
                      <td className="px-6 py-2.5 font-mono text-xs text-muted-foreground tabular-nums">
                        {node.code}
                      </td>
                      <td className="px-3 py-2.5">
                        <div
                          className="flex items-center gap-1.5"
                          style={{ paddingInlineStart: depth * 20 }}
                        >
                          {hasChildren ? (
                            <button
                              type="button"
                              onClick={() => toggle(node.code)}
                              aria-expanded={open}
                              aria-label={node.name}
                              className="-ml-1 flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
                            >
                              <ChevronRight
                                className={cn('size-4 transition-transform', open && 'rotate-90')}
                              />
                            </button>
                          ) : (
                            <span className="size-5" />
                          )}
                          <span
                            className={cn(hasChildren ? 'font-semibold' : 'text-foreground/90')}
                          >
                            {node.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        {depth === 0 && (
                          <Tag tone={TYPE_TONE[node.type]} size="sm">
                            {t(`types.${node.type}`)}
                          </Tag>
                        )}
                      </td>
                      <td
                        className={cn(
                          'px-3 py-2.5 text-right tabular-nums',
                          hasChildren && 'font-medium',
                        )}
                      >
                        {accounting(node.debit)}
                      </td>
                      <td
                        className={cn(
                          'px-3 py-2.5 text-right tabular-nums',
                          hasChildren && 'font-medium',
                        )}
                      >
                        {accounting(node.credit)}
                      </td>
                      <td
                        className={cn(
                          'px-6 py-2.5 text-right tabular-nums',
                          hasChildren ? 'font-semibold' : 'text-foreground/90',
                          node.balance < 0 && 'text-destructive',
                        )}
                      >
                        {accounting(node.balance)}
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      {t('empty')}
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 bg-muted/40 font-semibold">
                  <td className="px-6 py-3" colSpan={3}>
                    {t('totals.trialBalance')}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">{accounting(totals.debit)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{accounting(totals.credit)}</td>
                  <td className="px-6 py-3 text-right tabular-nums">
                    {accounting(totals.debit - totals.credit)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </SectionCard>
    </Page>
  );
}
