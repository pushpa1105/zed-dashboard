import { Clock, Folder, HardDrive, Star } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { TreeView, type TreeNode } from '@/shared/components/display/tree-view';
import { cn } from '@/shared/lib/cn';
import { Skeleton } from '@/shared/ui/skeleton';

import { useFolderTree, useStorage } from '../api/files-api';
import { formatBytes, ROOT_ID, type FolderNode, type Scope } from '../model/files';

const STORAGE_COLORS: Record<string, string> = {
  documents: 'var(--chart-4)',
  images: 'var(--chart-5)',
  media: 'var(--chart-1)',
  other: 'var(--chart-2)',
};

const toTree = (nodes: FolderNode[]): TreeNode[] =>
  nodes.map((n) => ({
    id: n.id,
    label: n.name,
    icon: Folder,
    children: n.children.length ? toTree(n.children) : undefined,
  }));

/** Quick links, folder tree and the storage meter. */
export function FilesSidebar({
  scope,
  folderId,
  onScope,
  onFolder,
}: {
  scope: Scope;
  folderId: string;
  onScope: (scope: Scope) => void;
  onFolder: (id: string) => void;
}) {
  const { t } = useTranslation('app-files');
  const tree = useFolderTree();
  const storage = useStorage();
  const links = [
    { scope: 'folder' as const, icon: HardDrive, label: t('sidebar.all') },
    { scope: 'recent' as const, icon: Clock, label: t('sidebar.recent') },
    { scope: 'starred' as const, icon: Star, label: t('sidebar.starred') },
  ];

  const used = storage.data?.used ?? 0;
  const quota = storage.data?.quota ?? 1;
  const totalTyped = storage.data?.byType.reduce((s, g) => s + g.bytes, 0) ?? 0;

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-5 overflow-y-auto p-3">
        <ul className="space-y-0.5">
          {links.map(({ scope: s, icon: Icon, label }) => {
            const active = s === scope && (s !== 'folder' || folderId === ROOT_ID);
            return (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => (s === 'folder' ? onFolder(ROOT_ID) : onScope(s))}
                  aria-current={active}
                  className={cn(
                    'flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                    active && 'bg-accent font-medium text-accent-foreground hover:bg-accent',
                  )}
                >
                  <Icon className="size-4" /> {label}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="space-y-1">
          <p className="px-2.5 text-[0.6875rem] font-medium tracking-wider text-muted-foreground/80 uppercase">
            {t('sidebar.folders')}
          </p>
          {tree.isPending ? (
            <div className="space-y-2 px-2.5 pt-1">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-4" />
              ))}
            </div>
          ) : (
            <TreeView
              nodes={toTree(tree.data ?? [])}
              selectedId={scope === 'folder' ? folderId : null}
              onSelect={(node) => onFolder(node.id)}
              defaultExpanded={['design', 'finance', 'eng']}
            />
          )}
        </div>
      </div>

      <div className="space-y-3 border-t p-4">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-medium">{t('sidebar.storage')}</span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {t('sidebar.usedOf', { used: formatBytes(used), quota: formatBytes(quota) })}
          </span>
        </div>
        <div
          className="flex h-2 overflow-hidden rounded-full bg-muted"
          role="meter"
          aria-valuenow={used}
          aria-valuemax={quota}
          aria-label={t('sidebar.storage')}
        >
          {storage.data?.byType.map((g) => (
            <span
              key={g.id}
              className="h-full border-r-2 border-card last:border-r-0"
              style={{
                width: `${(g.bytes / quota) * 100 + (g.id === 'other' ? ((used - totalTyped) / quota) * 100 : 0)}%`,
                background: STORAGE_COLORS[g.id],
              }}
            />
          ))}
        </div>
        <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
          {storage.data?.byType.map((g) => (
            <li key={g.id} className="flex items-center gap-1.5 text-muted-foreground">
              <span className="size-2 rounded-full" style={{ background: STORAGE_COLORS[g.id] }} />
              {t(`sidebar.types.${g.id as 'documents' | 'images' | 'media' | 'other'}`)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
