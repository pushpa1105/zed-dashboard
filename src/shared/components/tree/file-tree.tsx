import { Folder, FolderOpen } from 'lucide-react';

import { fileIconFor } from './file-icons';
import { Tree, type TreeProps } from './tree';
import type { TreeItem } from './tree-utils';

/**
 * Folder/file tree: folders open and close with their icon, files get an icon
 * and color by extension. A folder is any node with `children`/`loadChildren`.
 */
export function FileTree(props: Omit<TreeProps, 'renderIcon'>) {
  return (
    <Tree
      variant="lines"
      {...props}
      renderIcon={(item: TreeItem, open) => {
        const isFolder = Boolean(item.children || item.loadChildren);
        if (isFolder) {
          const Icon = open ? FolderOpen : Folder;
          return <Icon className="size-4 shrink-0 text-primary/80" />;
        }
        const { icon: Icon, color } = fileIconFor(item.label);
        return <Icon className="size-4 shrink-0" style={{ color }} />;
      }}
    />
  );
}
