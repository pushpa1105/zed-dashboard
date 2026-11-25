import { Download } from 'lucide-react';
import { useMemo } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { Link, useNavigate } from '@/core/router/router';
import { exportTableToCsv } from '@/shared/components/data-table/csv';
import { DataTable } from '@/shared/components/data-table/data-table';
import { DataTableColumnHeader } from '@/shared/components/data-table/data-table-column-header';
import { DataTableFacetedFilter } from '@/shared/components/data-table/data-table-faceted-filter';
import { DataTablePagination } from '@/shared/components/data-table/data-table-pagination';
import { DataTableToolbar } from '@/shared/components/data-table/data-table-toolbar';
import { DataTableViewOptions } from '@/shared/components/data-table/data-table-view-options';
import { createDataTableColumnHelper } from '@/shared/components/data-table/features';
import { useDataTable } from '@/shared/components/data-table/use-data-table';
import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { Button } from '@/shared/ui/button';

import { dealsQuery, useDeals } from '../api/crm-api';
import { CompanyMark, StageBadge } from '../components/crm-parts';
import { money, shortDate } from '../lib/format';
import { DEAL_STAGES, type Deal } from '../model/crm';
import { crmRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(dealsQuery());
    return null;
  };

const helper = createDataTableColumnHelper<Deal>();
const EMPTY: Deal[] = [];

function useColumns() {
  const { t } = useTranslation('crm');
  return useMemo(
    () =>
      helper.columns([
        helper.accessor('name', {
          header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t('deals.columns.name')} />
          ),
          meta: { label: t('deals.columns.name') },
          size: 300,
          cell: ({ row }) => (
            <div className="flex items-center gap-3">
              <CompanyMark name={row.original.company} className="size-8" />
              <div className="min-w-0">
                <Link
                  to={crmRoutes.deal.href({ dealId: row.original.id })}
                  className="block truncate font-medium hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {row.original.name}
                </Link>
                <span className="block truncate text-xs text-muted-foreground">
                  {row.original.company}
                </span>
              </div>
            </div>
          ),
        }),
        helper.accessor('stage', {
          header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t('deals.columns.stage')} />
          ),
          meta: { label: t('deals.columns.stage') },
          size: 140,
          filterFn: 'arrIncludesSome',
          cell: (info) => <StageBadge stage={info.getValue()} />,
        }),
        helper.accessor('value', {
          header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t('deals.columns.value')} />
          ),
          meta: { label: t('deals.columns.value'), align: 'end' },
          size: 120,
          cell: (info) => (
            <span className="font-medium tabular-nums">{money(info.getValue())}</span>
          ),
        }),
        helper.accessor('probability', {
          header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t('deals.columns.probability')} />
          ),
          meta: { label: t('deals.columns.probability'), align: 'end' },
          size: 90,
          cell: (info) => (
            <span className="text-muted-foreground tabular-nums">{info.getValue()}%</span>
          ),
        }),
        helper.accessor('owner', {
          header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t('deals.columns.owner')} />
          ),
          meta: { label: t('deals.columns.owner') },
          size: 170,
          filterFn: 'arrIncludesSome',
          cell: (info) => (
            <span className="flex items-center gap-2">
              <InitialsAvatar name={info.getValue()} size="xs" />
              <span className="truncate">{info.getValue()}</span>
            </span>
          ),
        }),
        helper.accessor('source', {
          header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t('deals.columns.source')} />
          ),
          meta: { label: t('deals.columns.source') },
          size: 110,
          cell: (info) => <span className="text-muted-foreground">{info.getValue()}</span>,
        }),
        helper.accessor('closeDate', {
          header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t('deals.columns.closeDate')} />
          ),
          meta: { label: t('deals.columns.closeDate') },
          size: 120,
          cell: (info) => (
            <span className="text-muted-foreground tabular-nums">{shortDate(info.getValue())}</span>
          ),
        }),
      ]),
    [t],
  );
}

export default function DealsPage() {
  const { t } = useTranslation('crm');
  const navigate = useNavigate();
  const deals = useDeals();
  const columns = useColumns();
  const table = useDataTable<Deal>({
    data: deals.data ?? EMPTY,
    columns,
    getRowId: (row) => row.id,
    globalFilterFn: 'includesString',
    initialState: {
      sorting: [{ id: 'closeDate', desc: false }],
      pagination: { pageIndex: 0, pageSize: 20 },
      columnPinning: { start: ['name'], end: [] },
    },
  });

  const { columnFilters, globalFilter } = table.state;
  const filterOf = (id: string) =>
    (columnFilters.find((f) => f.id === id)?.value as string[]) ?? [];
  const owners = useMemo(
    () => Array.from(new Set((deals.data ?? []).map((d) => d.owner))).sort(),
    [deals.data],
  );
  const stageCounts = table.getColumn('stage')?.getFacetedUniqueValues();
  const ownerCounts = table.getColumn('owner')?.getFacetedUniqueValues();
  const rows = table.getFilteredRowModel().rows;
  const total = rows.reduce((sum, row) => sum + row.original.value, 0);

  return (
    <Page width="full" title={t('deals.title')} description={t('deals.description')}>
      <div className="space-y-4">
        <DataTableToolbar
          search={(globalFilter as string) ?? ''}
          onSearchChange={(value) => table.setGlobalFilter(value)}
          searchPlaceholder={t('deals.search')}
          resetLabel={t('deals.reset')}
          onReset={() => {
            table.resetColumnFilters();
            table.setGlobalFilter('');
          }}
          actions={
            <>
              <DataTableViewOptions table={table} />
              <Button
                variant="outline"
                onClick={() => exportTableToCsv(table, { filename: 'deals.csv' })}
              >
                <Download /> {t('deals.export')}
              </Button>
            </>
          }
        >
          <DataTableFacetedFilter
            title={t('deals.columns.stage')}
            value={filterOf('stage')}
            onChange={(v) => table.getColumn('stage')?.setFilterValue(v.length ? v : undefined)}
            options={DEAL_STAGES.map((s) => ({
              value: s,
              label: t(`stages.${s}`),
              count: stageCounts?.get(s) ?? 0,
            }))}
          />
          <DataTableFacetedFilter
            title={t('deals.columns.owner')}
            value={filterOf('owner')}
            onChange={(v) => table.getColumn('owner')?.setFilterValue(v.length ? v : undefined)}
            options={owners.map((o) => ({ value: o, label: o, count: ownerCounts?.get(o) ?? 0 }))}
          />
        </DataTableToolbar>
        <DataTable
          table={table}
          loading={deals.isPending}
          error={deals.isError ? t('error.title') : undefined}
          onRetry={() => void deals.refetch()}
          labels={{ retry: t('error.retry') }}
          onRowClick={(row) => void navigate(crmRoutes.deal.href({ dealId: row.original.id }))}
          caption={t('deals.title')}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground tabular-nums">
            {t('deals.totals', { count: rows.length, value: money(total) })}
          </p>
          <DataTablePagination table={table} />
        </div>
      </div>
    </Page>
  );
}
