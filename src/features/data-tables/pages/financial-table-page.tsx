import { Download } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { downloadFile, toCsv } from '@/shared/components/data-table/csv';
import { DataTable } from '@/shared/components/data-table/data-table';
import {
  createDataTableColumnHelper,
  type DataTableColumnDef,
} from '@/shared/components/data-table/features';
import { useDataTable } from '@/shared/components/data-table/use-data-table';
import { SegmentedControl } from '@/shared/components/forms/segmented-control';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';

import { TablesNav } from '../components/tables-nav';
import { MONTHS, seedPnl, type PnlLine } from '../model/showcase-data';

type Row = {
  id: string;
  line: string;
  kind: 'line' | 'subtotal' | 'heading';
  values: number[];
  budget: number;
};

const sumValues = (lines: PnlLine[]) =>
  MONTHS.map((_, m) => lines.reduce((s, l) => s + l.values[m]!, 0));
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

/** Builds the statement: line items plus computed subtotal rows. */
function buildStatement(lines: PnlLine[], label: (key: string) => string): Row[] {
  const by = (section: PnlLine['section']) => lines.filter((l) => l.section === section);
  const revenue = sumValues(by('revenue'));
  const cogs = sumValues(by('cogs'));
  const opex = sumValues(by('opex'));
  const gross = revenue.map((v, m) => v + cogs[m]!);
  const operating = gross.map((v, m) => v + opex[m]!);
  const budgetOf = (ls: PnlLine[]) => ls.reduce((s, l) => s + l.budget, 0);
  const asRows = (ls: PnlLine[]): Row[] => ls.map((l) => ({ ...l, kind: 'line' }));

  return [
    { id: 'h-rev', line: label('revenue'), kind: 'heading', values: [], budget: 0 },
    ...asRows(by('revenue')),
    {
      id: 'total-rev',
      line: label('totalRevenue'),
      kind: 'subtotal',
      values: revenue,
      budget: budgetOf(by('revenue')),
    },
    { id: 'h-cogs', line: label('cogs'), kind: 'heading', values: [], budget: 0 },
    ...asRows(by('cogs')),
    {
      id: 'gross',
      line: label('grossProfit'),
      kind: 'subtotal',
      values: gross,
      budget: budgetOf(by('revenue')) + budgetOf(by('cogs')),
    },
    { id: 'h-opex', line: label('opex'), kind: 'heading', values: [], budget: 0 },
    ...asRows(by('opex')),
    {
      id: 'operating',
      line: label('operatingIncome'),
      kind: 'subtotal',
      values: operating,
      budget: budgetOf(by('revenue')) + budgetOf(by('cogs')) + budgetOf(by('opex')),
    },
  ];
}

const helper = createDataTableColumnHelper<Row>();

export default function FinancialTablePage() {
  const { t, i18n } = useTranslation('data-tables');
  const [unit, setUnit] = useState<'thousands' | 'exact'>('thousands');
  const lines = useMemo(() => seedPnl(), []);
  const rows = useMemo(
    () => buildStatement(lines, (k) => t(`financial.rows.${k as 'revenue'}`)),
    [lines, t],
  );
  const revenue = rows.find((r) => r.id === 'total-rev')!.values;
  const operating = rows.find((r) => r.id === 'operating')!.values;

  const columns = useMemo(() => {
    const nf = new Intl.NumberFormat(i18n.language, {
      maximumFractionDigits: unit === 'thousands' ? 1 : 0,
    });
    /** Accounting style: negatives in parentheses, thousands shown as 12.3k. */
    const fmt = (n: number) => {
      const v = unit === 'thousands' ? Math.abs(n) / 1000 : Math.abs(n);
      const text = `${nf.format(v)}${unit === 'thousands' ? 'k' : ''}`;
      return n < 0 ? `(${text})` : text;
    };
    const money = (n: number | undefined, row: Row) =>
      row.kind === 'heading' || n === undefined ? null : (
        <span
          className={cn(n < 0 && 'text-destructive', row.kind === 'subtotal' && 'font-semibold')}
        >
          {fmt(n)}
        </span>
      );
    const margin = (m: number) => {
      const r = m < 0 ? sum(revenue) : revenue[m]!;
      const o = m < 0 ? sum(operating) : operating[m]!;
      const pct = r ? (o / r) * 100 : 0;
      return (
        <span className={pct < 0 ? 'text-destructive' : 'text-success'}>{pct.toFixed(1)}%</span>
      );
    };

    const month = (m: number) =>
      helper.accessor((row) => row.values[m], {
        id: `m${m}`,
        header: MONTHS[m],
        size: 92,
        meta: { label: MONTHS[m], align: 'end' },
        cell: ({ getValue, row }) => money(getValue(), row.original),
        footer: () => margin(m),
      });

    return helper.columns([
      helper.accessor('line', {
        header: t('financial.cols.line'),
        size: 240,
        meta: { label: t('financial.cols.line') },
        cell: ({ getValue, row }) => (
          <span
            className={cn(
              row.original.kind === 'heading' &&
                'text-xs font-semibold tracking-wider text-muted-foreground uppercase',
              row.original.kind === 'line' && 'pl-3',
              row.original.kind === 'subtotal' && 'font-semibold',
            )}
          >
            {getValue()}
          </span>
        ),
        footer: () => t('financial.margin'),
      }),
      ...[0, 1, 2, 3].map((q) =>
        helper.group({
          id: `q${q + 1}`,
          header: () => <span className="block text-center">Q{q + 1}</span>,
          columns: [month(q * 3), month(q * 3 + 1), month(q * 3 + 2)] as DataTableColumnDef<Row>[],
        }),
      ),
      helper.group({
        id: 'fy',
        header: () => <span className="block text-center">{t('financial.cols.fy')}</span>,
        columns: [
          helper.accessor((row) => sum(row.values), {
            id: 'actual',
            header: t('financial.cols.actual'),
            size: 110,
            meta: { label: t('financial.cols.actual'), align: 'end', cellClassName: 'bg-muted/30' },
            cell: ({ getValue, row }) => money(getValue(), row.original),
            footer: () => margin(-1),
          }),
          helper.accessor('budget', {
            header: t('financial.cols.budget'),
            size: 110,
            meta: { label: t('financial.cols.budget'), align: 'end', cellClassName: 'bg-muted/30' },
            cell: ({ getValue, row }) =>
              row.original.kind === 'heading' ? null : (
                <span className="text-muted-foreground">{fmt(getValue())}</span>
              ),
          }),
          helper.display({
            id: 'variance',
            header: t('financial.cols.variance'),
            size: 120,
            meta: {
              label: t('financial.cols.variance'),
              align: 'end',
              cellClassName: 'bg-muted/30',
            },
            cell: ({ row }) => {
              if (row.original.kind === 'heading') return null;
              const actual = sum(row.original.values);
              const diff = actual - row.original.budget;
              const pct = row.original.budget ? (diff / Math.abs(row.original.budget)) * 100 : 0;
              // Over budget on revenue is good; over budget on a cost (more negative) is bad.
              const good = diff >= 0;
              return (
                <span
                  className={cn(
                    'inline-flex items-center justify-end rounded px-1.5 py-0.5 text-xs font-semibold tabular-nums',
                    good ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive',
                  )}
                >
                  {pct >= 0 ? '+' : ''}
                  {pct.toFixed(1)}%
                </span>
              );
            },
          }),
        ] as DataTableColumnDef<Row>[],
      }),
    ]);
  }, [t, i18n.language, unit, revenue, operating]);

  const table = useDataTable<Row>({
    data: rows,
    columns,
    getRowId: (row) => row.id,
    manualPagination: true,
    enableSorting: false,
    initialState: { columnPinning: { start: ['line'], end: [] } },
  });

  const exportCsv = () => {
    const header = [
      t('financial.cols.line'),
      ...MONTHS,
      t('financial.cols.actual'),
      t('financial.cols.budget'),
    ];
    const body = rows
      .filter((r) => r.kind !== 'heading')
      .map((r) => [r.line, ...r.values.map(String), String(sum(r.values)), String(r.budget)]);
    downloadFile('pnl-2026.csv', toCsv(header, body));
  };

  return (
    <Page
      title={t('financial.title')}
      description={t('financial.description')}
      width="full"
      actions={
        <>
          <SegmentedControl
            aria-label={t('financial.units')}
            value={unit}
            onChange={setUnit}
            options={[
              { value: 'thousands', label: t('financial.thousands') },
              { value: 'exact', label: t('financial.exact') },
            ]}
          />
          <Button variant="outline" onClick={exportCsv}>
            <Download /> {t('financial.export')}
          </Button>
        </>
      }
    >
      <TablesNav />
      <DataTable
        table={table}
        bordered
        showFooter
        density="compact"
        maxHeight={620}
        caption={t('financial.title')}
        rowClassName={(row) =>
          row.original.kind === 'subtotal'
            ? '[&>td]:border-t-2 [&>td]:border-t-foreground/15 [&>td]:bg-muted/50'
            : row.original.kind === 'heading'
              ? '[&>td]:bg-card [&>td]:pt-4'
              : undefined
        }
      />
      <p className="text-xs text-muted-foreground">{t('financial.note')}</p>
    </Page>
  );
}
