import { Download } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { notify } from '@/core/notify/notify';
import { useNavigate } from '@/core/router/router';
import { exportTableToCsv } from '@/shared/components/data-table/csv';
import { DataTable } from '@/shared/components/data-table/data-table';
import { DataTableFacetedFilter } from '@/shared/components/data-table/data-table-faceted-filter';
import { DataTablePagination } from '@/shared/components/data-table/data-table-pagination';
import {
  DataTableToolbar,
  type FilterChip,
} from '@/shared/components/data-table/data-table-toolbar';
import { DataTableViewOptions } from '@/shared/components/data-table/data-table-view-options';
import type { Density } from '@/shared/components/data-table/density';
import { DensityToggle } from '@/shared/components/data-table/density-toggle';
import { useDataTable } from '@/shared/components/data-table/use-data-table';
import { SegmentedControl } from '@/shared/components/forms/segmented-control';
import { Button } from '@/shared/ui/button';

import { shipmentsQuery, useShipments } from '../api/logistics-api';
import { LoadError } from '../components/query-state';
import { useShipmentColumns } from '../components/shipment-columns';
import { SHIPMENT_STATUSES, TRANSPORT_MODES, type Shipment } from '../model/logistics';
import { logisticsRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(shipmentsQuery());
    return null;
  };

const EMPTY: Shipment[] = [];
type Scope = 'all' | 'active' | 'priority' | 'late';

export default function ShipmentsPage() {
  const { t } = useTranslation('logistics');
  const navigate = useNavigate();
  const query = useShipments();
  const columns = useShipmentColumns();
  const [density, setDensity] = useState<Density>('default');
  const [scope, setScope] = useState<Scope>('active');

  const all = query.data ?? EMPTY;
  const data = useMemo(() => {
    switch (scope) {
      case 'active':
        return all.filter((s) => s.status !== 'delivered' && s.status !== 'booked');
      case 'priority':
        return all.filter((s) => s.priority);
      case 'late':
        return all.filter((s) => s.delayMinutes > 0 && s.status !== 'delivered');
      default:
        return all;
    }
  }, [all, scope]);

  const table = useDataTable<Shipment>({
    data,
    columns,
    getRowId: (row) => row.id,
    globalFilterFn: 'includesString',
    initialState: {
      sorting: [{ id: 'eta', desc: false }],
      pagination: { pageIndex: 0, pageSize: 20 },
      columnPinning: { start: ['id'], end: [] },
    },
  });

  const { globalFilter, columnFilters } = table.state;
  const filterOf = (id: string) =>
    (columnFilters.find((f) => f.id === id)?.value as string[]) ?? [];
  const statusFilter = filterOf('status');
  const modeFilter = filterOf('mode');
  const statusCounts = table.getColumn('status')?.getFacetedUniqueValues();
  const modeCounts = table.getColumn('mode')?.getFacetedUniqueValues();

  const chips: FilterChip[] = [
    statusFilter.length > 0 && {
      id: 'status',
      label: `${t('shipments.columns.status')}: ${statusFilter.map((s) => t(`status.${s as Shipment['status']}`)).join(', ')}`,
      onRemove: () => table.getColumn('status')?.setFilterValue(undefined),
    },
    modeFilter.length > 0 && {
      id: 'mode',
      label: `${t('shipments.columns.mode')}: ${modeFilter.map((m) => t(`mode.${m as Shipment['mode']}`)).join(', ')}`,
      onRemove: () => table.getColumn('mode')?.setFilterValue(undefined),
    },
  ].filter(Boolean) as FilterChip[];

  if (query.isError) {
    return (
      <Page title={t('shipments.title')} description={t('shipments.description')} width="full">
        <LoadError onRetry={() => void query.refetch()} />
      </Page>
    );
  }

  return (
    <Page
      title={t('shipments.title')}
      description={t('shipments.description')}
      width="full"
      actions={
        <SegmentedControl<Scope>
          value={scope}
          onChange={setScope}
          options={[
            { value: 'all', label: t('shipments.scope.all') },
            { value: 'active', label: t('shipments.scope.active') },
            { value: 'priority', label: t('shipments.scope.priority') },
            { value: 'late', label: t('shipments.scope.late') },
          ]}
          aria-label={t('shipments.scope.label')}
        />
      }
    >
      <div className="space-y-4">
        <DataTableToolbar
          search={(globalFilter as string | undefined) ?? ''}
          onSearchChange={(value) => table.setGlobalFilter(value)}
          searchPlaceholder={t('shipments.search')}
          chips={chips}
          onReset={() => {
            table.resetColumnFilters();
            table.resetGlobalFilter();
          }}
          resetLabel={t('table.reset')}
          actions={
            <>
              <DataTableViewOptions
                table={table}
                label={t('table.columns')}
                resetLabel={t('table.reset')}
              />
              <DensityToggle
                value={density}
                onChange={setDensity}
                labels={{
                  compact: t('table.compact'),
                  default: t('table.default'),
                  comfortable: t('table.comfortable'),
                }}
              />
              <Button
                variant="outline"
                onClick={() => {
                  exportTableToCsv(table, { filename: 'shipments.csv' });
                  notify.success(t('shipments.exported'));
                }}
              >
                <Download /> {t('table.export')}
              </Button>
            </>
          }
        >
          <DataTableFacetedFilter
            title={t('shipments.columns.status')}
            value={statusFilter}
            onChange={(value) =>
              table.getColumn('status')?.setFilterValue(value.length ? value : undefined)
            }
            options={SHIPMENT_STATUSES.map((s) => ({
              value: s,
              label: t(`status.${s}`),
              count: statusCounts?.get(s) ?? 0,
            }))}
          />
          <DataTableFacetedFilter
            title={t('shipments.columns.mode')}
            value={modeFilter}
            onChange={(value) =>
              table.getColumn('mode')?.setFilterValue(value.length ? value : undefined)
            }
            options={TRANSPORT_MODES.map((m) => ({
              value: m,
              label: t(`mode.${m}`),
              count: modeCounts?.get(m) ?? 0,
            }))}
          />
        </DataTableToolbar>

        <DataTable
          table={table}
          density={density}
          loading={query.isPending}
          caption={t('shipments.title')}
          labels={{ emptyTitle: t('shipments.empty'), emptyDescription: t('shipments.emptyHint') }}
          onRowClick={(row) =>
            void navigate(logisticsRoutes.shipment.href({ shipmentId: row.original.id }))
          }
        />
        <DataTablePagination
          table={table}
          labels={{
            rowsPerPage: t('table.rowsPerPage'),
            range: (from, to, total) => t('table.range', { from, to, total }),
            first: t('table.first'),
            previous: t('table.previous'),
            next: t('table.next'),
            last: t('table.last'),
          }}
        />
      </div>
    </Page>
  );
}
