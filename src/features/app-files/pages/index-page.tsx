import {
  FolderPlus,
  FolderX,
  LayoutGrid,
  List,
  PanelLeft,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { Fragment, useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Head } from '@/core/layout/head';
import { notify } from '@/core/notify/notify';
import { useSearchParams } from '@/core/router/router';
import { EmptyState } from '@/shared/components/display/empty-state';
import { SearchInput } from '@/shared/components/forms/search-input';
import { SegmentedControl } from '@/shared/components/forms/segmented-control';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { storage } from '@/shared/lib/storage';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/shared/ui/breadcrumb';
import { Button, buttonVariants } from '@/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Sheet, SheetContent, SheetTitle } from '@/shared/ui/sheet';
import { Skeleton } from '@/shared/ui/skeleton';

import {
  listQuery,
  storageQuery,
  treeQuery,
  useDeleteFiles,
  useListing,
  useUpdateFile,
} from '../api/files-api';
import { NewFolderDialog, UploadDialog } from '../components/file-dialogs';
import type { ItemActions } from '../components/file-parts';
import { FilesGrid, FilesTable } from '../components/file-views';
import { FilesSidebar } from '../components/files-sidebar';
import { PreviewSheet } from '../components/preview-sheet';
import { ROOT_ID, type FileItem, type Scope, type SortKey } from '../model/files';

const VIEW_KEY = 'files-view';
const DEFAULT_LIST = { parent: ROOT_ID, scope: 'folder' as Scope, q: '', sort: 'name' as SortKey };

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await Promise.all([
      queryClient.prefetchQuery(listQuery(DEFAULT_LIST)),
      queryClient.prefetchQuery(treeQuery()),
      queryClient.prefetchQuery(storageQuery()),
    ]);
    return null;
  };

/** File manager: folder tree, breadcrumbs, grid/list views, bulk actions, previews. */
export default function FilesPage() {
  const { t } = useTranslation('app-files');
  const [params, setParams] = useSearchParams();
  const folderId = params.get('folder') ?? ROOT_ID;
  const scope = (params.get('scope') as Scope | null) ?? 'folder';
  const [sort, setSort] = useState<SortKey>('name');
  const [view, setView] = useState<'grid' | 'list'>(
    () => storage.get<'grid' | 'list'>(VIEW_KEY) ?? 'grid',
  );
  const [query, setQuery] = useState('');
  const q = useDebounce(query, 250);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [preview, setPreview] = useState<FileItem | null>(null);
  const [confirm, setConfirm] = useState<string[] | null>(null);
  const [newFolder, setNewFolder] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [treeOpen, setTreeOpen] = useState(false);

  const listing = useListing({ parent: folderId, scope, q, sort });
  const update = useUpdateFile();
  const remove = useDeleteFiles();
  const items = listing.data?.items ?? [];

  const go = (next: { folder?: string; scope?: Scope }) => {
    setSelected(new Set());
    setQuery('');
    setTreeOpen(false);
    setParams(
      next.scope && next.scope !== 'folder'
        ? { scope: next.scope }
        : next.folder && next.folder !== ROOT_ID
          ? { folder: next.folder }
          : {},
    );
  };

  const actions: ItemActions = {
    open: (item) => (item.type === 'folder' ? go({ folder: item.id }) : setPreview(item)),
    rename: (item) => setRenamingId(item.id),
    star: (item) => {
      update.mutate({ id: item.id, starred: !item.starred });
      if (preview?.id === item.id) setPreview({ ...item, starred: !item.starred });
    },
    remove: (item) => setConfirm([item.id]),
  };

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const setViewMode = (mode: 'grid' | 'list') => {
    setView(mode);
    storage.set(VIEW_KEY, mode);
  };

  const crumbs = listing.data?.breadcrumbs ?? [];
  const heading =
    scope === 'recent'
      ? t('sidebar.recent')
      : scope === 'starred'
        ? t('sidebar.starred')
        : q
          ? t('toolbar.results', { q })
          : (crumbs.at(-1)?.name ?? t('sidebar.all'));

  const sidebar = (
    <FilesSidebar
      scope={scope}
      folderId={folderId}
      onScope={(s) => go({ scope: s })}
      onFolder={(id) => go({ folder: id })}
    />
  );

  return (
    <>
      <Head title={t('title')} />
      <div className="flex h-[calc(100svh-4rem)] min-h-[32rem] overflow-hidden">
        <aside className="hidden w-64 shrink-0 border-r bg-muted/20 lg:block">{sidebar}</aside>
        <Sheet open={treeOpen} onOpenChange={setTreeOpen}>
          <SheetContent side="left" className="w-72 p-0">
            <SheetTitle className="sr-only">{t('sidebar.folders')}</SheetTitle>
            {sidebar}
          </SheetContent>
        </Sheet>

        <main className="flex min-w-0 flex-1 flex-col">
          <div className="space-y-4 border-b px-4 py-4 md:px-6">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="-ml-2 lg:hidden"
                onClick={() => setTreeOpen(true)}
                aria-label={t('sidebar.folders')}
              >
                <PanelLeft />
              </Button>
              <div className="min-w-0">
                {scope === 'folder' && !q && crumbs.length > 1 && (
                  <Breadcrumb className="mb-0.5">
                    <BreadcrumbList className="text-xs">
                      <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                          <button type="button" onClick={() => go({ folder: ROOT_ID })}>
                            {t('sidebar.all')}
                          </button>
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      {crumbs.slice(0, -1).map((c) => (
                        <Fragment key={c.id}>
                          <BreadcrumbSeparator />
                          <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                              <button type="button" onClick={() => go({ folder: c.id })}>
                                {c.name}
                              </button>
                            </BreadcrumbLink>
                          </BreadcrumbItem>
                        </Fragment>
                      ))}
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbPage>{crumbs.at(-1)?.name}</BreadcrumbPage>
                      </BreadcrumbItem>
                    </BreadcrumbList>
                  </Breadcrumb>
                )}
                <h1 className="truncate text-lg font-semibold tracking-tight">{heading}</h1>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setNewFolder(true)}
                  disabled={scope !== 'folder'}
                >
                  <FolderPlus /> <span className="hidden sm:inline">{t('toolbar.newFolder')}</span>
                </Button>
                <Button onClick={() => setUploading(true)} disabled={scope !== 'folder'}>
                  <Upload /> <span className="hidden sm:inline">{t('toolbar.upload')}</span>
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder={t('toolbar.search')}
                containerClassName="w-full sm:w-72"
                loading={listing.isFetching && !!q}
              />
              <div className="ml-auto flex items-center gap-2">
                <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                  <SelectTrigger className="w-40" aria-label={t('toolbar.sort')}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['name', 'updated', 'size', 'type'] as const).map((key) => (
                      <SelectItem key={key} value={key}>
                        {t(`sort.${key}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <SegmentedControl<'grid' | 'list'>
                  value={view}
                  onChange={setViewMode}
                  aria-label={t('toolbar.view')}
                  options={[
                    {
                      value: 'grid',
                      label: <span className="sr-only">{t('toolbar.grid')}</span>,
                      icon: <LayoutGrid className="size-4" />,
                    },
                    {
                      value: 'list',
                      label: <span className="sr-only">{t('toolbar.list')}</span>,
                      icon: <List className="size-4" />,
                    },
                  ]}
                />
              </div>
            </div>
          </div>

          <div className="relative flex-1 overflow-y-auto p-4 md:p-6">
            {listing.isPending ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(11.5rem,1fr))] gap-4">
                {Array.from({ length: 8 }, (_, i) => (
                  <Skeleton key={i} className="h-36 rounded-xl" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <EmptyState
                icon={scope === 'starred' ? Star : FolderX}
                title={
                  q
                    ? t('empty.noResults')
                    : scope === 'starred'
                      ? t('empty.noStarred')
                      : t('empty.folder')
                }
                description={scope === 'folder' && !q ? t('empty.folderHint') : undefined}
                actions={
                  scope === 'folder' && !q ? (
                    <Button onClick={() => setUploading(true)}>
                      <Upload /> {t('toolbar.upload')}
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              (() => {
                const props = {
                  items,
                  selected,
                  onToggle: toggle,
                  onToggleAll: (all: boolean) =>
                    setSelected(all ? new Set(items.map((i) => i.id)) : new Set()),
                  renamingId,
                  onRename: (item: FileItem, name: string) => {
                    setRenamingId(null);
                    update.mutate(
                      { id: item.id, name },
                      {
                        onSuccess: () => notify.success(t('toast.renamed', { name: name.trim() })),
                      },
                    );
                  },
                  onCancelRename: () => setRenamingId(null),
                  actions,
                };
                return view === 'grid' ? <FilesGrid {...props} /> : <FilesTable {...props} />;
              })()
            )}

            {selected.size > 0 && (
              <div className="sticky bottom-2 z-10 mx-auto mt-6 flex w-fit items-center gap-2 rounded-full border bg-popover py-1.5 pr-1.5 pl-4 text-sm shadow-lg">
                <span className="font-medium tabular-nums">
                  {t('bulk.selected', { count: selected.size })}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const all = items.filter((i) => selected.has(i.id));
                    const star = all.some((i) => !i.starred);
                    all.forEach((i) => update.mutate({ id: i.id, starred: star }));
                    setSelected(new Set());
                  }}
                >
                  <Star /> {t('bulk.star')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setConfirm([...selected])}
                >
                  <Trash2 /> {t('actions.delete')}
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setSelected(new Set())}
                  aria-label={t('bulk.clear')}
                >
                  <X />
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>

      <PreviewSheet item={preview} onClose={() => setPreview(null)} actions={actions} />
      <NewFolderDialog open={newFolder} onOpenChange={setNewFolder} parentId={folderId} />
      <UploadDialog open={uploading} onOpenChange={setUploading} parentId={folderId} />
      <AlertDialog open={!!confirm} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('confirm.title', { count: confirm?.length ?? 0 })}
            </AlertDialogTitle>
            <AlertDialogDescription>{t('confirm.description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('newFolder.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: 'destructive' })}
              onClick={() => {
                if (!confirm) return;
                remove.mutate(confirm, {
                  onSuccess: () => {
                    setSelected(new Set());
                    setPreview(null);
                  },
                });
                setConfirm(null);
              }}
            >
              {t('actions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
