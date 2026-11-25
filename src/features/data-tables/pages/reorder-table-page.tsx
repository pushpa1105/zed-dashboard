import { ArrowDown, ArrowUp, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { notify } from '@/core/notify/notify';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { DataTable } from '@/shared/components/data-table/data-table';
import { createDataTableColumnHelper } from '@/shared/components/data-table/features';
import { SortableRowsTable } from '@/shared/components/data-table/sortable-rows-table';
import { useDataTable } from '@/shared/components/data-table/use-data-table';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';

import { TablesNav } from '../components/tables-nav';
import { BACKLOG, seedTasks, type BacklogItem, type ProjectTask } from '../model/showcase-data';

const helper = createDataTableColumnHelper<ProjectTask>();
const TASKS = seedTasks().slice(0, 8);

const PRESETS = {
  planning: {
    order: ['key', 'title', 'assignee', 'due', 'status', 'project', 'priority', 'estimate'],
    sizing: {
      key: 90,
      title: 300,
      assignee: 170,
      due: 120,
      status: 130,
      project: 110,
      priority: 100,
      estimate: 90,
    },
  },
  triage: {
    order: ['priority', 'status', 'title', 'key', 'assignee', 'due', 'estimate', 'project'],
    sizing: {
      priority: 100,
      status: 130,
      title: 340,
      key: 90,
      assignee: 150,
      due: 110,
      estimate: 90,
      project: 100,
    },
  },
  compact: {
    order: ['key', 'title', 'status', 'estimate', 'assignee', 'project', 'priority', 'due'],
    sizing: {
      key: 80,
      title: 220,
      status: 110,
      estimate: 70,
      assignee: 130,
      project: 90,
      priority: 90,
      due: 100,
    },
  },
} as const;
type Preset = keyof typeof PRESETS;

/** Drag rows to rank a backlog; drag headers or apply presets to arrange columns. */
export default function ReorderTablePage() {
  const { t } = useTranslation('data-tables');
  const [items, setItems] = useState<BacklogItem[]>(BACKLOG);
  const [lastMove, setLastMove] = useState<{ title: string; from: number; to: number } | null>(
    null,
  );
  const [preset, setPreset] = useState<Preset>('planning');

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('key', {
          header: t('viewsPage.cols.key'),
          meta: { label: t('viewsPage.cols.key') },
          cell: (i) => <span className="font-mono text-xs">{i.getValue()}</span>,
        }),
        helper.accessor('title', {
          header: t('viewsPage.cols.title'),
          meta: { label: t('viewsPage.cols.title') },
        }),
        helper.accessor('assignee', {
          header: t('viewsPage.cols.assignee'),
          meta: { label: t('viewsPage.cols.assignee') },
        }),
        helper.accessor('due', {
          header: t('viewsPage.cols.due'),
          meta: { label: t('viewsPage.cols.due') },
        }),
        helper.accessor('status', {
          header: t('viewsPage.cols.status'),
          meta: { label: t('viewsPage.cols.status') },
          cell: (i) => t(`viewsPage.status.${i.getValue()}`),
        }),
        helper.accessor('project', {
          header: t('viewsPage.cols.project'),
          meta: { label: t('viewsPage.cols.project') },
        }),
        helper.accessor('priority', {
          header: t('viewsPage.cols.priority'),
          meta: { label: t('viewsPage.cols.priority') },
          cell: (i) => t(`viewsPage.priority.${i.getValue()}`),
        }),
        helper.accessor('estimate', {
          header: t('reorder.cols.estimate'),
          meta: { label: t('reorder.cols.estimate'), align: 'end' },
        }),
      ]),
    [t],
  );

  const table = useDataTable<ProjectTask>({
    data: TASKS,
    columns,
    getRowId: (row) => row.id,
    manualPagination: true,
    initialState: {
      columnOrder: [...PRESETS.planning.order],
      columnSizing: { ...PRESETS.planning.sizing },
    },
  });

  const applyPreset = (name: Preset) => {
    setPreset(name);
    table.setColumnOrder([...PRESETS[name].order]);
    table.setColumnSizing({ ...PRESETS[name].sizing });
  };

  return (
    <Page title={t('reorder.title')} description={t('reorder.description')} width="full">
      <TablesNav />
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <SectionCard
          title={t('reorder.backlog')}
          description={t('reorder.backlogHint')}
          flush
          action={
            <Button variant="ghost" size="sm" onClick={() => setItems(BACKLOG)}>
              <RotateCcw /> {t('reorder.reset')}
            </Button>
          }
        >
          <div className="px-6 pb-6">
            <SortableRowsTable
              rows={items}
              getRowId={(row) => row.id}
              caption={t('reorder.backlog')}
              handleLabel={(row) => t('reorder.move', { title: row.title })}
              onReorder={(next, move) => {
                setItems(next);
                setLastMove({ title: next[move.to]!.title, from: move.from + 1, to: move.to + 1 });
              }}
              columns={[
                {
                  id: 'rank',
                  header: '#',
                  width: 56,
                  cell: (_, index) => (
                    <span
                      className={cn(
                        'flex size-7 items-center justify-center rounded-md text-xs font-semibold tabular-nums',
                        index < 3 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {index + 1}
                    </span>
                  ),
                },
                {
                  id: 'title',
                  header: t('reorder.cols.request'),
                  cell: (row) => <span className="font-medium">{row.title}</span>,
                },
                {
                  id: 'segment',
                  header: t('reorder.cols.segment'),
                  width: 130,
                  cell: (row) => <span className="text-muted-foreground">{row.segment}</span>,
                },
                {
                  id: 'effort',
                  header: t('reorder.cols.effort'),
                  width: 90,
                  align: 'center',
                  cell: (row) => (
                    <span className="rounded-md border px-1.5 py-0.5 font-mono text-xs">
                      {row.effort}
                    </span>
                  ),
                },
                {
                  id: 'votes',
                  header: t('reorder.cols.votes'),
                  width: 90,
                  align: 'end',
                  cell: (row) => row.votes,
                },
              ]}
            />
          </div>
        </SectionCard>

        <SectionCard
          title={t('reorder.changes')}
          description={t('reorder.changesHint')}
          className="h-fit"
        >
          {lastMove ? (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                <p className="font-medium">{lastMove.title}</p>
                <p className="mt-1 flex items-center gap-1.5 text-muted-foreground tabular-nums">
                  {lastMove.to < lastMove.from ? (
                    <ArrowUp className="size-4 text-success" />
                  ) : (
                    <ArrowDown className="size-4 text-destructive" />
                  )}
                  {t('reorder.moved', { from: lastMove.from, to: lastMove.to })}
                </p>
              </div>
              <ol className="space-y-1.5 text-sm">
                {items.slice(0, 5).map((item, i) => (
                  <li key={item.id} className="flex gap-2">
                    <span className="w-5 text-muted-foreground tabular-nums">{i + 1}.</span>
                    <span className="truncate">{item.title}</span>
                  </li>
                ))}
              </ol>
              <Button className="w-full" onClick={() => notify.success(t('reorder.saved'))}>
                {t('reorder.save')}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t('reorder.noChanges')}</p>
          )}
        </SectionCard>
      </div>

      <SectionCard
        title={t('reorder.columnsTitle')}
        description={t('reorder.columnsHint')}
        action={
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(PRESETS) as Preset[]).map((name) => (
              <Button
                key={name}
                variant={preset === name ? 'default' : 'outline'}
                size="sm"
                onClick={() => applyPreset(name)}
              >
                {t(`reorder.presets.${name}`)}
              </Button>
            ))}
          </div>
        }
      >
        <DataTable table={table} reorderableColumns caption={t('reorder.columnsTitle')} />
      </SectionCard>
    </Page>
  );
}
