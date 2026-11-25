import { Download, Pencil, Star, Trash2 } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { notify } from '@/core/notify/notify';
import { DescriptionList } from '@/shared/components/display/description-list';
import { cn } from '@/shared/lib/cn';
import { formatDate } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/sheet';

import { formatBytes, TYPE_STYLE, type FileItem } from '../model/files';

import { FileTypeIcon, type ItemActions } from './file-parts';

/** Stand-in preview per type: a photo-like gradient, document pages or code lines. */
function PreviewArt({ item }: { item: FileItem }) {
  const { color } = TYPE_STYLE[item.type];
  if (item.type === 'image') {
    return (
      <div
        className="flex aspect-[4/3] items-end rounded-lg p-4"
        style={{
          background: `linear-gradient(150deg, color-mix(in srgb, ${color} 55%, white), color-mix(in srgb, var(--chart-4) 45%, white) 60%, color-mix(in srgb, var(--chart-2) 40%, white))`,
        }}
      >
        <span className="rounded-md bg-overlay/35 px-2 py-1 text-xs text-overlay-foreground backdrop-blur">
          {item.name}
        </span>
      </div>
    );
  }
  if (
    item.type === 'pdf' ||
    item.type === 'doc' ||
    item.type === 'slides' ||
    item.type === 'sheet'
  ) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-lg bg-muted/70 p-6">
        <div className="h-full w-3/5 space-y-2 rounded-md bg-card p-4 shadow-md">
          <div className="h-2.5 w-2/3 rounded-full" style={{ background: color }} />
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              className={cn('h-1.5 rounded-full bg-muted', i % 3 === 2 ? 'w-1/2' : 'w-full')}
            />
          ))}
        </div>
      </div>
    );
  }
  if (item.type === 'code') {
    return (
      <div className="aspect-[4/3] space-y-2 overflow-hidden rounded-lg bg-foreground p-4 font-mono text-[0.6875rem] text-background/70">
        {[
          'import { schema } from "./db";',
          '',
          'export async function migrate() {',
          '  await schema.addColumn("usage");',
          '  return { ok: true };',
          '}',
        ].map((line, i) => (
          <p key={i} className="whitespace-pre">
            <span className="mr-3 text-background/40">{i + 1}</span>
            {line}
          </p>
        ))}
      </div>
    );
  }
  return (
    <div className="flex aspect-[4/3] items-center justify-center rounded-lg bg-muted/70">
      <FileTypeIcon type={item.type} size="lg" />
    </div>
  );
}

/** Side panel with a preview, metadata and file actions. */
export function PreviewSheet({
  item,
  onClose,
  actions,
}: {
  item: FileItem | null;
  onClose: () => void;
  actions: ItemActions;
}) {
  const { t } = useTranslation('app-files');
  return (
    <Sheet open={!!item} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full gap-0 sm:max-w-md">
        {item && (
          <>
            <SheetHeader className="border-b p-5">
              <SheetTitle className="flex items-center gap-3 pr-8">
                <FileTypeIcon type={item.type} size="sm" />
                <span className="truncate">{item.name}</span>
              </SheetTitle>
              <SheetDescription>{t(`types.${item.type}`)}</SheetDescription>
            </SheetHeader>
            <div className="flex-1 space-y-6 overflow-y-auto p-5">
              <PreviewArt item={item} />
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => notify.info(t('preview.downloadDemo'))}>
                  <Download /> {t('actions.download')}
                </Button>
                <Button variant="outline" onClick={() => actions.star(item)}>
                  <Star className={cn(item.starred && 'fill-warning text-warning')} />
                  {item.starred ? t('actions.unstar') : t('actions.star')}
                </Button>
              </div>
              <DescriptionList
                layout="horizontal"
                items={[
                  { key: 'type', term: t('preview.type'), detail: t(`types.${item.type}`) },
                  { key: 'size', term: t('columns.size'), detail: formatBytes(item.size) },
                  { key: 'owner', term: t('columns.owner'), detail: item.owner },
                  {
                    key: 'modified',
                    term: t('columns.modified'),
                    detail: formatDate(item.updatedAt, 'MMM D, YYYY HH:mm'),
                  },
                  {
                    key: 'opened',
                    term: t('preview.opened'),
                    detail: formatDate(item.openedAt, 'MMM D, YYYY HH:mm'),
                  },
                ]}
              />
            </div>
            <div className="flex gap-2 border-t p-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  onClose();
                  actions.rename(item);
                }}
              >
                <Pencil /> {t('actions.rename')}
              </Button>
              <Button
                variant="outline"
                className="flex-1 text-destructive hover:text-destructive"
                onClick={() => actions.remove(item)}
              >
                <Trash2 /> {t('actions.delete')}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
