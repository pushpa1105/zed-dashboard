import { Eye, FolderOpen, MoreHorizontal, Pencil, Star, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Input } from '@/shared/ui/input';

import { TYPE_STYLE, type FileItem, type FileType } from '../model/files';

/** Type icon on a tinted square. */
export function FileTypeIcon({ type, size = 'md' }: { type: FileType; size?: 'sm' | 'md' | 'lg' }) {
  const { icon: Icon, color } = TYPE_STYLE[type];
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-lg',
        size === 'sm' && 'size-8 [&>svg]:size-4',
        size === 'md' && 'size-10 [&>svg]:size-5',
        size === 'lg' && 'size-14 rounded-xl [&>svg]:size-7',
      )}
      style={{ background: `color-mix(in srgb, ${color} 14%, transparent)`, color }}
    >
      <Icon />
    </span>
  );
}

/** Name field shown while renaming: Enter saves, Escape cancels. */
export function RenameInput({
  item,
  onSubmit,
  onCancel,
}: {
  item: FileItem;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation('app-files');
  const [value, setValue] = useState(item.name);
  return (
    <Input
      autoFocus
      size={1}
      value={value}
      aria-label={t('actions.rename')}
      onChange={(e) => setValue(e.target.value)}
      onFocus={(e) => {
        const dot = item.type === 'folder' ? -1 : item.name.lastIndexOf('.');
        e.currentTarget.setSelectionRange(0, dot > 0 ? dot : item.name.length);
      }}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onSubmit(value);
        if (e.key === 'Escape') onCancel();
      }}
      onBlur={() => (value.trim() && value !== item.name ? onSubmit(value) : onCancel())}
      className="h-8"
    />
  );
}

export type ItemActions = {
  open: (item: FileItem) => void;
  rename: (item: FileItem) => void;
  star: (item: FileItem) => void;
  remove: (item: FileItem) => void;
};

/** ⋯ menu for one file or folder. */
export function ItemMenu({
  item,
  actions,
  className,
}: {
  item: FileItem;
  actions: ItemActions;
  className?: string;
}) {
  const { t } = useTranslation('app-files');
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className={className}
          onClick={(e) => e.stopPropagation()}
          aria-label={t('actions.more', { name: item.name })}
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onSelect={() => actions.open(item)}>
          {item.type === 'folder' ? <FolderOpen /> : <Eye />}
          {item.type === 'folder' ? t('actions.open') : t('actions.preview')}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => actions.rename(item)}>
          <Pencil /> {t('actions.rename')}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => actions.star(item)}>
          <Star /> {item.starred ? t('actions.unstar') : t('actions.star')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => actions.remove(item)}>
          <Trash2 /> {t('actions.delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
