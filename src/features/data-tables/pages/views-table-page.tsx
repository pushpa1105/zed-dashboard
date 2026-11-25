import { CalendarDays, Kanban, LayoutGrid, List, Search, Table2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { DataTable } from '@/shared/components/data-table/data-table';
import { DataTableColumnHeader } from '@/shared/components/data-table/data-table-column-header';
import { createDataTableColumnHelper } from '@/shared/components/data-table/features';
import { useTableAppearance } from '@/shared/components/data-table/table-appearance';
import { TableAppearancePanel } from '@/shared/components/data-table/table-appearance-panel';
import { useDataTable } from '@/shared/components/data-table/use-data-table';
import { SegmentedControl } from '@/shared/components/forms/segmented-control';
import { cn } from '@/shared/lib/cn';
import { getInitials } from '@/shared/lib/format';
import { storage } from '@/shared/lib/storage';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';
import { Input } from '@/shared/ui/input';

import { TablesNav } from '../components/tables-nav';
import { useTableLabels } from '../hooks/use-table-labels';
import { seedTasks, TASK_STATUSES, type ProjectTask } from '../model/showcase-data';

type View = 'table' | 'cards' | 'list' | 'board';
const VIEW_KEY = 'data-tables:views:mode';
const helper = createDataTableColumnHelper<ProjectTask>();
const TASKS = seedTasks();

const STATUS_DOT: Record<ProjectTask['status'], string> = {
  backlog: 'bg-muted-foreground/40',
  todo: 'bg-chart-4',
  in_progress: 'bg-chart-1',
  review: 'bg-warning',
  done: 'bg-success',
};
const PRIORITY_TONE: Record<ProjectTask['priority'], string> = {
  low: 'text-muted-foreground',
  medium: 'text-foreground',
  high: 'text-chart-3',
  urgent: 'text-destructive',
};

function Assignee({ name, size = 'size-6' }: { name: string; size?: string }) {
  const [first = '', last = ''] = name.split(' ');
  return (
    <Avatar className={size}>
      <AvatarFallback className="bg-primary/10 text-[0.625rem] font-medium text-primary">
        {getInitials(first, last)}
      </AvatarFallback>
    </Avatar>
  );
}

/** One dataset, four presentations, with per-user appearance settings that persist. */
export default function ViewsTablePage() {
  const { t } = useTranslation('data-tables');
  const { header: headerLabels } = useTableLabels();
  const [view, setView] = useState<View>(() => storage.get<View>(VIEW_KEY) ?? 'table');
  const [search, setSearch] = useState('');
  const { appearance, update, reset } = useTableAppearance('data-tables:views', {
    density: 'default',
  });

  const changeView = (next: View) => {
    setView(next);
    storage.set(VIEW_KEY, next);
  };

  const statusLabel = (s: ProjectTask['status']) => t(`viewsPage.status.${s}`);
  const priorityLabel = (p: ProjectTask['priority']) => t(`viewsPage.priority.${p}`);

  const data = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q
      ? TASKS.filter((task) =>
          `${task.title} ${task.key} ${task.assignee} ${task.project}`.toLowerCase().includes(q),
        )
      : TASKS;
  }, [search]);

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('key', {
          header: ({ column }) => (
            <DataTableColumnHeader
              column={column}
              title={t('viewsPage.cols.key')}
              labels={headerLabels}
            />
          ),
          size: 100,
          meta: { label: t('viewsPage.cols.key') },
          cell: (info) => (
            <span className="font-mono text-xs text-muted-foreground">{info.getValue()}</span>
          ),
        }),
        helper.accessor('title', {
          header: ({ column }) => (
            <DataTableColumnHeader
              column={column}
              title={t('viewsPage.cols.title')}
              labels={headerLabels}
            />
          ),
          size: 300,
          meta: { label: t('viewsPage.cols.title') },
          cell: (info) => <span className="font-medium">{info.getValue()}</span>,
        }),
        helper.accessor('project', {
          header: ({ column }) => (
            <DataTableColumnHeader
              column={column}
              title={t('viewsPage.cols.project')}
              labels={headerLabels}
            />
          ),
          size: 120,
          meta: { label: t('viewsPage.cols.project') },
        }),
        helper.accessor('status', {
          header: ({ column }) => (
            <DataTableColumnHeader
              column={column}
              title={t('viewsPage.cols.status')}
              labels={headerLabels}
            />
          ),
          size: 140,
          meta: { label: t('viewsPage.cols.status') },
          cell: (info) => (
            <span className="inline-flex items-center gap-2">
              <span className={cn('size-2 rounded-full', STATUS_DOT[info.getValue()])} />
              {statusLabel(info.getValue())}
            </span>
          ),
        }),
        helper.accessor('priority', {
          header: ({ column }) => (
            <DataTableColumnHeader
              column={column}
              title={t('viewsPage.cols.priority')}
              labels={headerLabels}
            />
          ),
          size: 110,
          meta: { label: t('viewsPage.cols.priority') },
          cell: (info) => (
            <span className={cn('font-medium', PRIORITY_TONE[info.getValue()])}>
              {priorityLabel(info.getValue())}
            </span>
          ),
        }),
        helper.accessor('assignee', {
          header: ({ column }) => (
            <DataTableColumnHeader
              column={column}
              title={t('viewsPage.cols.assignee')}
              labels={headerLabels}
            />
          ),
          size: 180,
          meta: { label: t('viewsPage.cols.assignee') },
          cell: (info) => (
            <span className="flex items-center gap-2">
              <Assignee name={info.getValue()} />
              <span className="truncate">{info.getValue()}</span>
            </span>
          ),
        }),
        helper.accessor('due', {
          header: ({ column }) => (
            <DataTableColumnHeader
              column={column}
              title={t('viewsPage.cols.due')}
              labels={headerLabels}
            />
          ),
          size: 120,
          meta: { label: t('viewsPage.cols.due') },
          cell: (info) => (
            <span className="text-muted-foreground tabular-nums">{info.getValue()}</span>
          ),
        }),
        helper.accessor('progress', {
          header: ({ column }) => (
            <DataTableColumnHeader
              column={column}
              title={t('viewsPage.cols.progress')}
              labels={headerLabels}
            />
          ),
          size: 150,
          meta: { label: t('viewsPage.cols.progress') },
          cell: (info) => (
            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${info.getValue()}%` }}
                />
              </div>
              <span className="w-9 text-right text-xs text-muted-foreground tabular-nums">
                {info.getValue()}%
              </span>
            </div>
          ),
        }),
      ]),
    // statusLabel/priorityLabel derive from t.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, headerLabels],
  );

  const table = useDataTable<ProjectTask>({
    data,
    columns,
    getRowId: (row) => row.id,
    manualPagination: true,
    state: { columnVisibility: appearance.columnVisibility },
    onColumnVisibilityChange: (updater) =>
      update({
        columnVisibility:
          typeof updater === 'function' ? updater(appearance.columnVisibility) : updater,
      }),
  });

  const visible = (id: keyof ProjectTask) => appearance.columnVisibility[id] !== false;
  const pad = { compact: 'p-3', default: 'p-4', comfortable: 'p-5' }[appearance.density];

  return (
    <Page
      title={t('viewsPage.title')}
      description={t('viewsPage.description')}
      width="full"
      actions={
        <TableAppearancePanel
          appearance={appearance}
          onChange={update}
          onReset={reset}
          columns={columns
            .filter((c) => c.id !== 'title' && c.id !== 'key')
            .map((c) => ({ id: c.id!, label: (c.meta as { label: string }).label }))}
          labels={{
            trigger: t('viewsPage.settings.trigger'),
            title: t('viewsPage.settings.title'),
            density: t('viewsPage.settings.density'),
            densities: {
              compact: t('density.compact'),
              default: t('density.default'),
              comfortable: t('density.comfortable'),
            },
            striped: t('viewsPage.settings.striped'),
            bordered: t('viewsPage.settings.bordered'),
            stickyHeader: t('viewsPage.settings.stickyHeader'),
            columns: t('viewsPage.settings.columns'),
            reset: t('viewsPage.settings.reset'),
          }}
        />
      }
    >
      <TablesNav />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:w-80">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('viewsPage.search')}
            aria-label={t('viewsPage.search')}
            className="pl-9"
          />
        </div>
        <SegmentedControl<View>
          aria-label={t('viewsPage.switcher')}
          value={view}
          onChange={changeView}
          options={[
            {
              value: 'table',
              label: t('viewsPage.modes.table'),
              icon: <Table2 className="size-3.5" />,
            },
            {
              value: 'cards',
              label: t('viewsPage.modes.cards'),
              icon: <LayoutGrid className="size-3.5" />,
            },
            {
              value: 'list',
              label: t('viewsPage.modes.list'),
              icon: <List className="size-3.5" />,
            },
            {
              value: 'board',
              label: t('viewsPage.modes.board'),
              icon: <Kanban className="size-3.5" />,
            },
          ]}
        />
      </div>

      {view === 'table' && (
        <DataTable
          table={table}
          density={appearance.density}
          striped={appearance.striped}
          bordered={appearance.bordered}
          stickyHeader={appearance.stickyHeader}
          maxHeight={appearance.stickyHeader ? 560 : undefined}
          caption={t('viewsPage.title')}
        />
      )}

      {view === 'cards' && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {data.map((task) => (
            <article
              key={task.id}
              className={cn(
                'flex flex-col gap-3 rounded-xl border bg-card shadow-xs',
                pad,
                appearance.bordered && 'border-2',
              )}
            >
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-mono text-muted-foreground">{task.key}</span>
                {visible('priority') && (
                  <span className={cn('font-medium', PRIORITY_TONE[task.priority])}>
                    {priorityLabel(task.priority)}
                  </span>
                )}
              </div>
              <h3 className="text-sm leading-snug font-semibold">{task.title}</h3>
              {visible('status') && (
                <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <span className={cn('size-2 rounded-full', STATUS_DOT[task.status])} />
                  {statusLabel(task.status)}
                  {visible('project') && <span>· {task.project}</span>}
                </span>
              )}
              {visible('progress') && (
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              )}
              <div className="mt-auto flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                {visible('assignee') ? (
                  <span className="flex items-center gap-2">
                    <Assignee name={task.assignee} />
                    {task.assignee}
                  </span>
                ) : (
                  <span />
                )}
                {visible('due') && (
                  <span className="inline-flex items-center gap-1 tabular-nums">
                    <CalendarDays className="size-3.5" />
                    {task.due}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {view === 'list' && (
        <ul
          className={cn(
            'divide-y overflow-hidden rounded-xl border bg-card',
            appearance.striped && '[&>li:nth-child(even)]:bg-muted/40',
          )}
        >
          {data.map((task) => (
            <li key={task.id} className={cn('flex items-center gap-4', pad)}>
              {visible('status') && (
                <span
                  className={cn('size-2.5 shrink-0 rounded-full', STATUS_DOT[task.status])}
                  title={statusLabel(task.status)}
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{task.title}</p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-mono">{task.key}</span>
                  {visible('project') && <> · {task.project}</>}
                  {visible('due') && <> · {task.due}</>}
                </p>
              </div>
              {visible('priority') && (
                <span
                  className={cn(
                    'hidden text-xs font-medium sm:block',
                    PRIORITY_TONE[task.priority],
                  )}
                >
                  {priorityLabel(task.priority)}
                </span>
              )}
              {visible('assignee') && <Assignee name={task.assignee} size="size-7" />}
            </li>
          ))}
        </ul>
      )}

      {view === 'board' && (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {TASK_STATUSES.map((status) => {
            const items = data.filter((task) => task.status === status);
            return (
              <section
                key={status}
                className="flex w-72 shrink-0 flex-col rounded-xl bg-muted/50 p-2"
              >
                <header className="flex items-center gap-2 px-2 py-1.5 text-sm font-medium">
                  <span className={cn('size-2 rounded-full', STATUS_DOT[status])} />
                  {statusLabel(status)}
                  <span className="ml-auto rounded-full bg-card px-1.5 text-xs text-muted-foreground tabular-nums">
                    {items.length}
                  </span>
                </header>
                <div className="flex flex-col gap-2">
                  {items.map((task) => (
                    <article
                      key={task.id}
                      className="space-y-2 rounded-lg border bg-card p-3 shadow-xs"
                    >
                      <p className="text-sm font-medium">{task.title}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="font-mono">{task.key}</span>
                        {visible('assignee') && <Assignee name={task.assignee} />}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </Page>
  );
}
