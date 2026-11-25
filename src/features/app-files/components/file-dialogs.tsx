import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { getErrorMessage } from '@/core/api/errors';
import { useTranslation } from '@/core/i18n/use-translation';
import { notify } from '@/core/notify/notify';
import { FileDropzone } from '@/shared/components/forms/file-dropzone';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Spinner } from '@/shared/ui/spinner';

import { filesApi, filesKeys, useCreateFolder } from '../api/files-api';

export function NewFolderDialog({
  open,
  onOpenChange,
  parentId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentId: string;
}) {
  const { t } = useTranslation('app-files');
  const create = useCreateFolder();
  const [name, setName] = useState('');

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setName('');
          create.reset();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate({ name, parentId }, { onSuccess: () => onOpenChange(false) });
          }}
          className="grid gap-5"
        >
          <DialogHeader>
            <DialogTitle>{t('newFolder.title')}</DialogTitle>
            <DialogDescription>{t('newFolder.description')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="folder-name">{t('newFolder.name')}</Label>
            <Input
              id="folder-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('newFolder.placeholder')}
              aria-invalid={create.isError || undefined}
            />
            {create.isError && (
              <p className="text-xs text-destructive">{getErrorMessage(create.error)}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('newFolder.cancel')}
            </Button>
            <Button type="submit" disabled={!name.trim() || create.isPending}>
              {create.isPending && <Spinner />} {t('newFolder.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Drop or browse files; each one shows progress and lands in the current folder. */
export function UploadDialog({
  open,
  onOpenChange,
  parentId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentId: string;
}) {
  const { t } = useTranslation('app-files');
  const queryClient = useQueryClient();
  const [count, setCount] = useState(0);

  const upload = async (file: File, onProgress: (pct: number) => void) => {
    for (let pct = 10; pct < 100; pct += 15 + Math.random() * 20) {
      await new Promise((r) => setTimeout(r, 120));
      onProgress(Math.min(95, Math.round(pct)));
    }
    await filesApi.upload({ parentId, files: [{ name: file.name, size: file.size }] });
    onProgress(100);
    setCount((n) => n + 1);
    void queryClient.invalidateQueries({ queryKey: filesKeys.all });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && count) notify.success(t('toast.uploaded', { count }));
        if (!next) setCount(0);
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('upload.title')}</DialogTitle>
          <DialogDescription>{t('upload.description')}</DialogDescription>
        </DialogHeader>
        {open && (
          <FileDropzone
            multiple
            maxSize={50 * 1024 ** 2}
            maxFiles={10}
            upload={upload}
            title={t('upload.drop')}
            hint={t('upload.hint')}
          />
        )}
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>{t('upload.done')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
