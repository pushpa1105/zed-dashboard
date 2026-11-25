import { Star } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { cn } from '@/shared/lib/cn';
import { formatDate, formatRelative } from '@/shared/lib/format';
import { Checkbox } from '@/shared/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { formatBytes, type FileItem } from '../model/files';

import { FileTypeIcon, ItemMenu, RenameInput, type ItemActions } from './file-parts';

type ViewProps = {
  items: FileItem[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (checked: boolean) => void;
  renamingId: string | null;
  onRename: (item: FileItem, name: string) => void;
  onCancelRename: () => void;
  actions: ItemActions;
};

function useMeta() {
  const { t } = useTranslation('app-files');
  return (item: FileItem) =>
    item.type === 'folder'
      ? t('item.folderMeta', { count: item.childCount, size: formatBytes(item.size) })
      : `${formatBytes(item.size)} · ${formatRelative(item.updatedAt)}`;
}

/** Card grid: folders first, then files. Click opens, checkbox selects. */
export function FilesGrid({
  items,
  selected,
  onToggle,
  renamingId,
  onRename,
  onCancelRename,
  actions,
}: ViewProps) {
  const { t } = useTranslation('app-files');
  const meta = useMeta();
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(11.5rem,1fr))] gap-4">
      {items.map((item) => {
        const isSelected = selected.has(item.id);
        return (
          <li key={item.id}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => actions.open(item)}
              onKeyDown={(e) => e.key === 'Enter' && actions.open(item)}
              className={cn(
                'group/card relative flex h-full cursor-pointer flex-col gap-4 rounded-xl border bg-card p-4 text-left shadow-xs transition-[border-color,box-shadow] outline-none hover:border-primary/40 hover:shadow-sm focus-visible:ring-3 focus-visible:ring-ring/40',
                isSelected && 'border-primary ring-2 ring-primary/20',
              )}
            >
              <div className="flex items-start justify-between">
                <FileTypeIcon type={item.type} size="lg" />
                <div className="flex items-center gap-1">
                  {item.starred && (
                    <Star
                      className="size-3.5 fill-warning text-warning"
                      aria-label={t('item.starred')}
                    />
                  )}
                  <ItemMenu
                    item={item}
                    actions={actions}
                    className="opacity-0 group-hover/card:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
                  />
                </div>
              </div>
              <Checkbox
                checked={isSelected}
                onClick={(e) => e.stopPropagation()}
                onCheckedChange={() => onToggle(item.id)}
                aria-label={t('item.select', { name: item.name })}
                className={cn(
                  'absolute top-3 left-3 bg-card opacity-0 group-hover/card:opacity-100 focus-visible:opacity-100',
                  isSelected && 'opacity-100',
                )}
              />
              <div className="mt-auto min-w-0 space-y-0.5">
                {renamingId === item.id ? (
                  <RenameInput
                    item={item}
                    onSubmit={(name) => onRename(item, name)}
                    onCancel={onCancelRename}
                  />
                ) : (
                  <p className="truncate text-sm font-medium" title={item.name}>
                    {item.name}
                  </p>
                )}
                <p className="truncate text-xs text-muted-foreground">{meta(item)}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Dense table with owner, modified date and size columns. */
export function FilesTable({
  items,
  selected,
  onToggle,
  onToggleAll,
  renamingId,
  onRename,
  onCancelRename,
  actions,
}: ViewProps) {
  const { t } = useTranslation('app-files');
  const all = items.length > 0 && items.every((i) => selected.has(i.id));
  const some = items.some((i) => selected.has(i.id));
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-10 pl-4">
              <Checkbox
                checked={all ? true : some ? 'indeterminate' : false}
                onCheckedChange={(v) => onToggleAll(!!v)}
                aria-label={t('item.selectAll')}
              />
            </TableHead>
            <TableHead>{t('columns.name')}</TableHead>
            <TableHead className="hidden md:table-cell">{t('columns.owner')}</TableHead>
            <TableHead className="hidden sm:table-cell">{t('columns.modified')}</TableHead>
            <TableHead className="text-right">{t('columns.size')}</TableHead>
            <TableHead className="w-12">
              <span className="sr-only">{t('columns.actions')}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const isSelected = selected.has(item.id);
            return (
              <TableRow
                key={item.id}
                data-state={isSelected ? 'selected' : undefined}
                className="cursor-pointer"
                onClick={() => actions.open(item)}
              >
                <TableCell className="pl-4" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggle(item.id)}
                    aria-label={t('item.select', { name: item.name })}
                  />
                </TableCell>
                <TableCell className="w-full max-w-0">
                  <div className="flex min-w-0 items-center gap-3">
                    <FileTypeIcon type={item.type} size="sm" />
                    {renamingId === item.id ? (
                      <RenameInput
                        item={item}
                        onSubmit={(name) => onRename(item, name)}
                        onCancel={onCancelRename}
                      />
                    ) : (
                      <span className="truncate font-medium">{item.name}</span>
                    )}
                    {item.starred && (
                      <Star
                        className="size-3.5 shrink-0 fill-warning text-warning"
                        aria-label={t('item.starred')}
                      />
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  {item.owner}
                </TableCell>
                <TableCell className="hidden text-muted-foreground tabular-nums sm:table-cell">
                  {formatDate(item.updatedAt, 'MMM D, YYYY')}
                </TableCell>
                <TableCell className="text-right text-muted-foreground tabular-nums">
                  {item.type === 'folder'
                    ? t('item.items', { count: item.childCount })
                    : formatBytes(item.size)}
                </TableCell>
                <TableCell className="pr-3 text-right">
                  <ItemMenu item={item} actions={actions} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
