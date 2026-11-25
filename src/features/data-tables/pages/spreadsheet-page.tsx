import { Plus, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { StatStrip } from '@/shared/components/dashboard/stat-strip';
import { Spreadsheet } from '@/shared/components/data-table/spreadsheet';
import type { SheetColumn } from '@/shared/components/data-table/spreadsheet-model';
import { Button } from '@/shared/ui/button';
import { Kbd } from '@/shared/ui/kbd';

import { formatCurrency } from '../components/format';
import { TablesNav } from '../components/tables-nav';
import { BUDGET_CATEGORIES, seedBudget, type BudgetLine } from '../model/showcase-data';

const total = (r: BudgetLine) => (r.qty ?? 0) * (r.unitCost ?? 0);
const money = (v: unknown) => (typeof v === 'number' ? formatCurrency(v) : '');

export default function SpreadsheetPage() {
  const { t } = useTranslation('data-tables');
  const [rows, setRows] = useState<BudgetLine[]>(seedBudget);

  const columns = useMemo<SheetColumn<BudgetLine>[]>(
    () => [
      { key: 'item', label: t('spreadsheet.cols.item'), type: 'text', width: 230 },
      {
        key: 'category',
        label: t('spreadsheet.cols.category'),
        type: 'select',
        options: BUDGET_CATEGORIES,
        width: 130,
      },
      { key: 'owner', label: t('spreadsheet.cols.owner'), type: 'text', width: 160 },
      {
        key: 'due',
        label: t('spreadsheet.cols.due'),
        type: 'date',
        width: 130,
        format: (v) =>
          v
            ? new Date(`${String(v)}T00:00:00`).toLocaleDateString(undefined, {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            : '',
      },
      { key: 'qty', label: t('spreadsheet.cols.qty'), type: 'number', width: 90, total: true },
      {
        key: 'unitCost',
        label: t('spreadsheet.cols.unitCost'),
        type: 'number',
        width: 130,
        format: money,
      },
      {
        key: 'id',
        label: t('spreadsheet.cols.total'),
        type: 'formula',
        compute: total,
        width: 140,
        format: money,
        total: true,
      },
      { key: 'approved', label: t('spreadsheet.cols.approved'), type: 'checkbox', width: 100 },
    ],
    [t],
  );

  const planned = rows.reduce((s, r) => s + total(r), 0);
  const approved = rows.filter((r) => r.approved).reduce((s, r) => s + total(r), 0);

  return (
    <Page
      title={t('spreadsheet.title')}
      description={t('spreadsheet.description')}
      width="full"
      actions={
        <>
          <Button variant="outline" onClick={() => setRows(seedBudget())}>
            <RotateCcw /> {t('spreadsheet.reset')}
          </Button>
          <Button
            onClick={() =>
              setRows((prev) => [
                ...prev,
                {
                  id: `b${Date.now()}`,
                  item: '',
                  category: 'Software',
                  owner: '',
                  due: '',
                  qty: 1,
                  unitCost: null,
                  approved: false,
                },
              ])
            }
          >
            <Plus /> {t('spreadsheet.addRow')}
          </Button>
        </>
      }
    >
      <TablesNav />
      <StatStrip
        className="rounded-xl border bg-card px-5"
        items={[
          { key: 'lines', label: t('spreadsheet.stats.lines'), value: rows.length },
          { key: 'planned', label: t('spreadsheet.stats.planned'), value: formatCurrency(planned) },
          {
            key: 'approved',
            label: t('spreadsheet.stats.approved'),
            value: formatCurrency(approved),
          },
          {
            key: 'share',
            label: t('spreadsheet.stats.share'),
            value: `${planned ? Math.round((approved / planned) * 100) : 0}%`,
          },
        ]}
      />
      <Spreadsheet
        columns={columns}
        rows={rows}
        onChange={setRows}
        getRowId={(r) => r.id}
        frozenColumns={1}
        height={560}
        labels={{
          grid: t('spreadsheet.title'),
          undo: t('spreadsheet.undo'),
          redo: t('spreadsheet.redo'),
          total: t('spreadsheet.total'),
          selection: (cells, sum) =>
            sum === null
              ? t('spreadsheet.selection', { count: cells })
              : t('spreadsheet.selectionSum', { count: cells, sum: sum.toLocaleString() }),
        }}
      />
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
        {(
          [
            ['Enter', 'edit'],
            ['Tab', 'next'],
            ['Shift ↑↓←→', 'extend'],
            ['Ctrl C / Ctrl V', 'copyPaste'],
            ['Ctrl Z / Ctrl Y', 'undoRedo'],
            ['Delete', 'clear'],
            ['Space', 'toggle'],
          ] as const
        ).map(([keys, label]) => (
          <span key={label} className="inline-flex items-center gap-1.5">
            <Kbd>{keys}</Kbd> {t(`spreadsheet.keys.${label}`)}
          </span>
        ))}
      </div>
    </Page>
  );
}
