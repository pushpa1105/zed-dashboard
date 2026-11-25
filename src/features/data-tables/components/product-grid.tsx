import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  type ColDef,
  type ICellRendererParams,
  type ValueFormatterParams,
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { Star } from 'lucide-react';
import { useMemo } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { useResolvedThemeMode } from '@/core/theme/engine';

import { LOW_STOCK, type Product } from '../model/product';

import { formatCurrency } from './format';

// Registered once, when this lazy-loaded module is first imported.
ModuleRegistry.registerModules([AllCommunityModule]);

/** AG Grid theme built from the app's CSS tokens, so presets and dark mode carry over. */
const buildTheme = (mode: 'light' | 'dark') =>
  themeQuartz.withParams({
    browserColorScheme: mode,
    fontFamily: 'inherit',
    fontSize: 13,
    headerFontSize: 12,
    backgroundColor: 'var(--card)',
    foregroundColor: 'var(--foreground)',
    textColor: 'var(--foreground)',
    accentColor: 'var(--primary)',
    borderColor: 'var(--border)',
    chromeBackgroundColor: 'var(--card)',
    headerBackgroundColor: 'var(--card)',
    headerTextColor: 'var(--muted-foreground)',
    headerFontWeight: 500,
    rowHoverColor: 'color-mix(in srgb, var(--muted) 70%, transparent)',
    selectedRowBackgroundColor: 'color-mix(in srgb, var(--primary) 8%, transparent)',
    oddRowBackgroundColor: 'color-mix(in srgb, var(--muted) 35%, transparent)',
    wrapperBorderRadius: 10,
    borderRadius: 6,
    spacing: 7,
    rowHeight: 40,
    headerHeight: 40,
  });

function StockCell({ value }: ICellRendererParams<Product, number>) {
  const { t } = useTranslation('data-tables');
  const stock = value ?? 0;
  const low = stock <= LOW_STOCK;
  return (
    <div className="flex h-full items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min(100, (stock / 500) * 100)}%`,
            background: low ? 'var(--destructive)' : 'var(--chart-2)',
          }}
        />
      </div>
      <span className="tabular-nums">{stock}</span>
      {low && <span className="text-xs text-destructive">{t('grid.lowStock')}</span>}
    </div>
  );
}

function RatingCell({ value }: ICellRendererParams<Product, number>) {
  return (
    <span className="inline-flex items-center gap-1 tabular-nums">
      <Star className="size-3.5 fill-warning text-warning" /> {value?.toFixed(1)}
    </span>
  );
}

/** Inventory grid: sorting, floating filters, resizing, pinning, multi-row selection and paging. */
export function ProductGrid({
  rows,
  onSelectionChange,
}: {
  rows: Product[];
  onSelectionChange: (count: number) => void;
}) {
  const { t, i18n } = useTranslation('data-tables');
  const mode = useResolvedThemeMode();
  const theme = useMemo(() => buildTheme(mode), [mode]);

  const columnDefs = useMemo<ColDef<Product>[]>(
    () => [
      {
        field: 'sku',
        headerName: t('columns.sku'),
        pinned: 'left',
        width: 120,
        cellClass: 'font-mono text-xs',
      },
      { field: 'product', headerName: t('columns.product'), flex: 1, minWidth: 180 },
      { field: 'category', headerName: t('columns.category'), width: 140 },
      {
        field: 'stock',
        headerName: t('columns.stock'),
        width: 190,
        filter: 'agNumberColumnFilter',
        cellRenderer: StockCell,
      },
      {
        field: 'price',
        headerName: t('columns.price'),
        width: 120,
        type: 'rightAligned',
        filter: 'agNumberColumnFilter',
        valueFormatter: (p: ValueFormatterParams<Product, number>) =>
          formatCurrency(p.value ?? 0, i18n.language),
      },
      {
        field: 'rating',
        headerName: t('columns.rating'),
        width: 110,
        filter: 'agNumberColumnFilter',
        cellRenderer: RatingCell,
      },
      {
        field: 'updated',
        headerName: t('columns.updated'),
        width: 130,
        filter: 'agDateColumnFilter',
      },
    ],
    [t, i18n.language],
  );

  return (
    <div className="h-[calc(100svh-19rem)] min-h-96">
      <AgGridReact<Product>
        theme={theme}
        rowData={rows}
        columnDefs={columnDefs}
        defaultColDef={{ sortable: true, resizable: true, filter: true, floatingFilter: true }}
        getRowId={(p) => p.data.id}
        rowSelection={{ mode: 'multiRow', headerCheckbox: true }}
        selectionColumnDef={{ pinned: 'left', width: 48 }}
        pagination
        paginationPageSize={50}
        paginationPageSizeSelector={[25, 50, 100, 200]}
        animateRows
        onSelectionChanged={(e) => onSelectionChange(e.api.getSelectedRows().length)}
      />
    </div>
  );
}
