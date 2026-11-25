import { KeyRound, Loader2, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { DataTable } from '@/shared/components/data-table/data-table';
import { createDataTableColumnHelper } from '@/shared/components/data-table/features';
import { useDataTable } from '@/shared/components/data-table/use-data-table';
import { SegmentedControl } from '@/shared/components/forms/segmented-control';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { cn } from '@/shared/lib/cn';
import { getInitials } from '@/shared/lib/format';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

import { useActivity } from '../api/activity-queries';
import { TablesNav } from '../components/tables-nav';
import { type ActivityEvent, type ActivityFilters } from '../model/activity';

const helper = createDataTableColumnHelper<ActivityEvent>();

const SEVERITY_TONE: Record<ActivityEvent['severity'], string> = {
  info: 'bg-muted-foreground/50',
  warning: 'bg-warning',
  critical: 'bg-destructive',
};

/** Cursor-paginated audit log: loads 50 rows at a time as you scroll, rows are virtualized. */
export default function InfiniteTablePage() {
  const { t, i18n } = useTranslation('data-tables');
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState<'all' | ActivityEvent['severity']>('all');
  const q = useDebounce(search, 300);
  const filters: ActivityFilters = { q, severity: severity === 'all' ? null : severity };
  const query = useActivity(filters);

  const rows = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  const total = query.data?.pages[0]?.total ?? 0;

  const columns = useMemo(() => {
    const time = new Intl.DateTimeFormat(i18n.language, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    return helper.columns([
      helper.accessor('at', {
        header: t('infinite.cols.time'),
        size: 190,
        meta: { label: t('infinite.cols.time') },
        cell: (info) => (
          <span className="text-muted-foreground tabular-nums">
            {time.format(new Date(info.getValue()))}
          </span>
        ),
      }),
      helper.accessor('actor', {
        header: t('infinite.cols.actor'),
        size: 220,
        meta: { label: t('infinite.cols.actor') },
        cell: (info) => {
          const actor = info.getValue();
          const token = actor.startsWith('api-token');
          const [first = '', last = ''] = actor.split(' ');
          return (
            <div className="flex items-center gap-2.5">
              <Avatar className="size-7">
                <AvatarFallback
                  className={cn(
                    'text-[0.6875rem]',
                    token ? 'bg-muted' : 'bg-primary/10 text-primary',
                  )}
                >
                  {token ? <KeyRound className="size-3.5" /> : getInitials(first, last)}
                </AvatarFallback>
              </Avatar>
              <span className={cn('truncate', token && 'font-mono text-xs')}>{actor}</span>
            </div>
          );
        },
      }),
      helper.accessor('action', {
        header: t('infinite.cols.action'),
        size: 130,
        meta: { label: t('infinite.cols.action') },
        cell: (info) => (
          <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
            {t(`infinite.actions.${info.getValue()}`)}
          </span>
        ),
      }),
      helper.accessor('resource', {
        header: t('infinite.cols.resource'),
        size: 260,
        meta: { label: t('infinite.cols.resource') },
      }),
      helper.accessor('ip', {
        header: t('infinite.cols.ip'),
        size: 140,
        meta: { label: t('infinite.cols.ip') },
        cell: (info) => (
          <span className="font-mono text-xs text-muted-foreground">{info.getValue()}</span>
        ),
      }),
      helper.accessor('severity', {
        header: t('infinite.cols.severity'),
        size: 130,
        meta: { label: t('infinite.cols.severity') },
        cell: (info) => (
          <span className="inline-flex items-center gap-1.5 text-sm">
            <span className={cn('size-2 rounded-full', SEVERITY_TONE[info.getValue()])} />
            {t(`infinite.severity.${info.getValue()}`)}
          </span>
        ),
      }),
    ]);
  }, [t, i18n.language]);

  const table = useDataTable<ActivityEvent>({
    data: rows,
    columns,
    getRowId: (row) => row.id,
    manualPagination: true,
    manualSorting: true,
  });

  const loadMore = () => {
    if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
  };

  return (
    <Page title={t('infinite.title')} description={t('infinite.description')} width="full">
      <TablesNav />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:w-80">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('infinite.search')}
            aria-label={t('infinite.search')}
            className="pl-9"
          />
        </div>
        <SegmentedControl
          aria-label={t('infinite.cols.severity')}
          value={severity}
          onChange={setSeverity}
          options={[
            { value: 'all', label: t('infinite.all') },
            { value: 'info', label: t('infinite.severity.info') },
            { value: 'warning', label: t('infinite.severity.warning') },
            { value: 'critical', label: t('infinite.severity.critical') },
          ]}
        />
      </div>
      <DataTable
        table={table}
        virtualized
        maxHeight={600}
        density="compact"
        loading={query.isPending}
        error={query.isError ? t('infinite.error') : undefined}
        onRetry={() => void query.refetch()}
        onScrollEnd={loadMore}
        caption={t('infinite.title')}
        labels={{ emptyTitle: t('infinite.empty'), retry: t('error.retry') }}
      />
      <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <span className="tabular-nums">
          {t('infinite.loaded', { count: rows.length, total: total.toLocaleString(i18n.language) })}
        </span>
        {query.isFetchingNextPage ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" /> {t('infinite.loading')}
          </span>
        ) : query.hasNextPage ? (
          <Button variant="outline" size="sm" onClick={loadMore}>
            {t('infinite.loadMore')}
          </Button>
        ) : (
          rows.length > 0 && <span>{t('infinite.end')}</span>
        )}
      </div>
    </Page>
  );
}
