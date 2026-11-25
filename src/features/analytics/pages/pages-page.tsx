import { ArrowDown, ArrowUp, ArrowUpDown, DoorOpen, Eye, Timer } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatCard } from '@/shared/components/dashboard/stat-card';
import { KeyValueGrid } from '@/shared/components/display/key-value-grid';
import { SearchInput } from '@/shared/components/forms/search-input';
import { cn } from '@/shared/lib/cn';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/sheet';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { topPagesQuery, useTopPages } from '../api/analytics-api';
import { QueryError } from '../components/query-error';
import { RangeControl } from '../components/range-control';
import { rangeFromRequest, useRangeParams } from '../hooks/use-range';
import { compact, duration, integer, percent } from '../lib/format';
import type { PageRow } from '../model/analytics';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ request }) => {
    await queryClient.prefetchQuery(topPagesQuery(rangeFromRequest(request)));
    return null;
  };

type SortKey = 'views' | 'users' | 'avgTimeSec' | 'bounceRate' | 'exits';

function SortHead({
  label,
  column,
  sort,
  onSort,
  className,
}: {
  label: string;
  column: SortKey;
  sort: { key: SortKey; desc: boolean };
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const active = sort.key === column;
  const Icon = active ? (sort.desc ? ArrowDown : ArrowUp) : ArrowUpDown;
  return (
    <TableHead
      className={cn('text-right', className)}
      aria-sort={active ? (sort.desc ? 'descending' : 'ascending') : 'none'}
    >
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cn(
          'inline-flex items-center gap-1 hover:text-foreground',
          active && 'text-foreground',
        )}
      >
        {label}
        <Icon className="size-3.5" />
      </button>
    </TableHead>
  );
}

function PageDetail({ page, onClose }: { page: PageRow | null; onClose: () => void }) {
  const { t } = useTranslation('analytics');
  return (
    <Sheet open={!!page} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md">
        {page && (
          <>
            <SheetHeader>
              <SheetTitle>{page.title}</SheetTitle>
              <SheetDescription className="font-mono">{page.path}</SheetDescription>
            </SheetHeader>
            <div className="space-y-6 px-4">
              <KeyValueGrid
                columns={2}
                items={[
                  { key: 'views', label: t('pages.columns.views'), value: integer(page.views) },
                  { key: 'users', label: t('pages.columns.users'), value: integer(page.users) },
                  { key: 'time', label: t('pages.columns.time'), value: duration(page.avgTimeSec) },
                  {
                    key: 'bounce',
                    label: t('pages.columns.bounce'),
                    value: percent(page.bounceRate),
                  },
                  {
                    key: 'entrances',
                    label: t('pages.columns.entrances'),
                    value: integer(page.entrances),
                  },
                  { key: 'exits', label: t('pages.columns.exits'), value: integer(page.exits) },
                ]}
              />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{t('pages.columns.scroll')}</span>
                  <span className="font-medium tabular-nums">{percent(page.scrollDepth, 0)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${page.scrollDepth}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{t('pages.scrollHint')}</p>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

/** Content performance: which pages draw, hold and lose visitors. */
export default function PagesPage() {
  const { t } = useTranslation('analytics');
  const { range } = useRangeParams();
  const query = useTopPages(range);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: 'views', desc: true });
  const [selected, setSelected] = useState<PageRow | null>(null);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (query.data ?? [])
      .filter((r) => !q || r.path.toLowerCase().includes(q) || r.title.toLowerCase().includes(q))
      .sort((a, b) => (sort.desc ? b[sort.key] - a[sort.key] : a[sort.key] - b[sort.key]));
  }, [query.data, search, sort]);

  const all = query.data ?? [];
  const mostViewed = all[0];
  const longest = [...all].sort((a, b) => b.avgTimeSec - a.avgTimeSec)[0];
  const leaky = [...all].sort((a, b) => b.exits / b.views - a.exits / a.views)[0];
  const onSort = (key: SortKey) =>
    setSort((prev) => ({ key, desc: prev.key === key ? !prev.desc : true }));

  return (
    <Page
      width="full"
      title={t('pages.title')}
      description={t('pages.description')}
      actions={<RangeControl />}
    >
      {query.isError && !query.data ? (
        <QueryError onRetry={() => void query.refetch()} />
      ) : !mostViewed || !longest || !leaky ? (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-36 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-[28rem] rounded-xl" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <StatCard
              icon={Eye}
              label={t('pages.spotlight.mostViewed')}
              value={compact(mostViewed.views)}
              hint={<span className="truncate font-mono">{mostViewed.path}</span>}
            />
            <StatCard
              icon={Timer}
              color="var(--chart-2)"
              label={t('pages.spotlight.longest')}
              value={duration(longest.avgTimeSec)}
              hint={<span className="truncate font-mono">{longest.path}</span>}
            />
            <StatCard
              icon={DoorOpen}
              color="var(--chart-3)"
              label={t('pages.spotlight.leaky')}
              value={percent((leaky.exits / leaky.views) * 100, 0)}
              hint={<span className="truncate font-mono">{leaky.path}</span>}
            />
          </div>
          <SectionCard
            title={t('pages.table.title')}
            description={t('pages.table.description', { count: rows.length })}
            action={
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={t('pages.search')}
                containerClassName="w-56"
              />
            }
            flush
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">{t('pages.columns.page')}</TableHead>
                  <SortHead
                    label={t('pages.columns.views')}
                    column="views"
                    sort={sort}
                    onSort={onSort}
                  />
                  <SortHead
                    label={t('pages.columns.users')}
                    column="users"
                    sort={sort}
                    onSort={onSort}
                    className="hidden md:table-cell"
                  />
                  <SortHead
                    label={t('pages.columns.time')}
                    column="avgTimeSec"
                    sort={sort}
                    onSort={onSort}
                    className="hidden sm:table-cell"
                  />
                  <SortHead
                    label={t('pages.columns.bounce')}
                    column="bounceRate"
                    sort={sort}
                    onSort={onSort}
                    className="hidden lg:table-cell"
                  />
                  <SortHead
                    label={t('pages.columns.exits')}
                    column="exits"
                    sort={sort}
                    onSort={onSort}
                    className="hidden lg:table-cell"
                  />
                  <TableHead className="hidden w-40 pr-6 xl:table-cell">
                    {t('pages.columns.scroll')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow
                    key={row.path}
                    className="cursor-pointer"
                    onClick={() => setSelected(row)}
                  >
                    <TableCell className="max-w-72 pl-6">
                      <span className="block truncate font-medium">{row.title}</span>
                      <span className="block truncate font-mono text-xs text-muted-foreground">
                        {row.path}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{integer(row.views)}</TableCell>
                    <TableCell className="hidden text-right tabular-nums md:table-cell">
                      {integer(row.users)}
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums sm:table-cell">
                      {duration(row.avgTimeSec)}
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums lg:table-cell">
                      {percent(row.bounceRate)}
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums lg:table-cell">
                      {integer(row.exits)}
                    </TableCell>
                    <TableCell className="hidden pr-6 xl:table-cell">
                      <span className="flex items-center gap-2">
                        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <span
                            className="block h-full rounded-full bg-chart-2"
                            style={{ width: `${row.scrollDepth}%` }}
                          />
                        </span>
                        <span className="w-9 text-right text-xs text-muted-foreground tabular-nums">
                          {percent(row.scrollDepth, 0)}
                        </span>
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SectionCard>
        </div>
      )}
      <PageDetail page={selected} onClose={() => setSelected(null)} />
    </Page>
  );
}
