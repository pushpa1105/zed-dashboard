import { useMemo } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { useNavigate } from '@/core/router/router';
import { createSelectColumn } from '@/shared/components/data-table/column-factories';
import { DataTable } from '@/shared/components/data-table/data-table';
import { DataTableColumnHeader } from '@/shared/components/data-table/data-table-column-header';
import { DataTableFacetedFilter } from '@/shared/components/data-table/data-table-faceted-filter';
import { DataTablePagination } from '@/shared/components/data-table/data-table-pagination';
import { DataTableToolbar } from '@/shared/components/data-table/data-table-toolbar';
import { createDataTableColumnHelper } from '@/shared/components/data-table/features';
import { useDataTable } from '@/shared/components/data-table/use-data-table';
import { StatusBadge } from '@/shared/components/display/status-badge';
import { Tag } from '@/shared/components/display/tag';
import { UserCell } from '@/shared/components/display/user-cell';

import { peopleQuery, usePeople } from '../api/crm-api';
import { relativeDays } from '../lib/format';
import type { Person } from '../model/crm';
import { crmRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(peopleQuery());
    return null;
  };

const helper = createDataTableColumnHelper<Person>();
const EMPTY: Person[] = [];
const STATUS_TONE = { customer: 'success', prospect: 'info', churned: 'neutral' } as const;
const STATUSES = ['customer', 'prospect', 'churned'] as const;

export default function PeoplePage() {
  const { t, i18n } = useTranslation('crm');
  const navigate = useNavigate();
  const people = usePeople();

  const columns = useMemo(
    () =>
      helper.columns([
        createSelectColumn<Person>({ label: t('people.columns.name') }),
        helper.accessor('name', {
          header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t('people.columns.name')} />
          ),
          meta: { label: t('people.columns.name') },
          size: 260,
          cell: ({ row }) => <UserCell name={row.original.name} secondary={row.original.email} />,
        }),
        helper.accessor('company', {
          header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t('people.columns.company')} />
          ),
          meta: { label: t('people.columns.company') },
          size: 220,
          cell: ({ row }) => (
            <div className="min-w-0">
              <p className="truncate">{row.original.company}</p>
              <p className="truncate text-xs text-muted-foreground">{row.original.title}</p>
            </div>
          ),
        }),
        helper.accessor('tags', {
          header: t('people.columns.tags'),
          meta: { label: t('people.columns.tags') },
          size: 230,
          enableSorting: false,
          cell: (info) => (
            <div className="flex flex-wrap gap-1">
              {info.getValue().map((tag) => (
                <Tag key={tag} size="sm" tone={tag === 'Champion' ? 'violet' : 'neutral'}>
                  {tag}
                </Tag>
              ))}
            </div>
          ),
        }),
        helper.accessor('status', {
          header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t('people.columns.status')} />
          ),
          meta: { label: t('people.columns.status') },
          size: 130,
          filterFn: 'arrIncludesSome',
          cell: (info) => (
            <StatusBadge
              status={info.getValue()}
              label={t(`people.status.${info.getValue()}`)}
              tone={STATUS_TONE[info.getValue()]}
            />
          ),
        }),
        helper.accessor('owner', {
          header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t('people.columns.owner')} />
          ),
          meta: { label: t('people.columns.owner') },
          size: 150,
          cell: (info) => <span className="text-muted-foreground">{info.getValue()}</span>,
        }),
        helper.accessor('lastContactedAt', {
          header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t('people.columns.lastContacted')} />
          ),
          meta: { label: t('people.columns.lastContacted') },
          size: 150,
          cell: (info) => (
            <span className="text-muted-foreground">
              {relativeDays(info.getValue(), i18n.language)}
            </span>
          ),
        }),
      ]),
    [t, i18n.language],
  );

  const table = useDataTable<Person>({
    data: people.data ?? EMPTY,
    columns,
    getRowId: (row) => row.id,
    globalFilterFn: 'includesString',
    initialState: {
      pagination: { pageIndex: 0, pageSize: 15 },
      sorting: [{ id: 'lastContactedAt', desc: true }],
    },
  });
  const { columnFilters, globalFilter } = table.state;
  const statusFilter = (columnFilters.find((f) => f.id === 'status')?.value as string[]) ?? [];
  const counts = table.getColumn('status')?.getFacetedUniqueValues();

  return (
    <Page
      width="full"
      title={t('people.title')}
      description={t('people.description')}
      actions={
        <span className="text-sm text-muted-foreground">
          {t('people.count', { count: people.data?.length ?? 0 })}
        </span>
      }
    >
      <div className="space-y-4">
        <DataTableToolbar
          search={(globalFilter as string) ?? ''}
          onSearchChange={(v) => table.setGlobalFilter(v)}
          searchPlaceholder={t('people.search')}
          resetLabel={t('deals.reset')}
          onReset={() => {
            table.resetColumnFilters();
            table.setGlobalFilter('');
          }}
        >
          <DataTableFacetedFilter
            title={t('people.columns.status')}
            value={statusFilter}
            onChange={(v) => table.getColumn('status')?.setFilterValue(v.length ? v : undefined)}
            options={STATUSES.map((s) => ({
              value: s,
              label: t(`people.status.${s}`),
              count: counts?.get(s) ?? 0,
            }))}
          />
        </DataTableToolbar>
        <DataTable
          table={table}
          loading={people.isPending}
          error={people.isError ? t('error.title') : undefined}
          onRetry={() => void people.refetch()}
          onRowClick={(row) =>
            void navigate(crmRoutes.contact.href({ contactId: row.original.id }))
          }
          caption={t('people.title')}
        />
        <DataTablePagination table={table} />
      </div>
    </Page>
  );
}
