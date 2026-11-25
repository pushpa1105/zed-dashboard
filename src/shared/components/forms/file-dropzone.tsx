import { FileText, ImageIcon, UploadCloud, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useDropzone, type Accept, type FileRejection } from 'react-dropzone';

import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';

export type UploadItem = {
  id: string;
  file: File;
  /** 0 – 100. */
  progress: number;
  status: 'uploading' | 'done' | 'error';
  error?: string;
  previewUrl?: string;
};

export type FileDropzoneProps = {
  /** e.g. `{ 'image/*': [], 'application/pdf': ['.pdf'] }` */
  accept?: Accept;
  multiple?: boolean;
  /** Bytes. */
  maxSize?: number;
  maxFiles?: number;
  /**
   * Uploads one file and reports progress. Defaults to a simulated upload so
   * the component works out of the box; plug in your XHR/S3 call here.
   */
  upload?: (file: File, onProgress: (pct: number) => void) => Promise<void>;
  onChange?: (files: File[]) => void;
  title?: string;
  hint?: string;
  disabled?: boolean;
  className?: string;
};

const formatBytes = (bytes: number) =>
  bytes < 1024
    ? `${bytes} B`
    : bytes < 1024 ** 2
      ? `${(bytes / 1024).toFixed(0)} KB`
      : `${(bytes / 1024 ** 2).toFixed(1)} MB`;

const simulateUpload = (file: File, onProgress: (pct: number) => void) =>
  new Promise<void>((resolve) => {
    let pct = 0;
    const speed = Math.max(4, 40 - file.size / 200_000);
    const timer = window.setInterval(() => {
      pct = Math.min(100, pct + speed * (0.6 + Math.random() * 0.8));
      onProgress(pct);
      if (pct >= 100) {
        window.clearInterval(timer);
        resolve();
      }
    }, 180);
  });

/**
 * Drag-and-drop upload area with type/size validation, image previews and
 * per-file progress. Rejections are listed inline with the reason.
 */
export function FileDropzone({
  accept,
  multiple = true,
  maxSize = 10 * 1024 ** 2,
  maxFiles,
  upload = simulateUpload,
  onChange,
  title = 'Drop files here or click to browse',
  hint,
  disabled,
  className,
}: FileDropzoneProps) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [rejections, setRejections] = useState<FileRejection[]>([]);
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  useEffect(
    () => () => itemsRef.current.forEach((i) => i.previewUrl && URL.revokeObjectURL(i.previewUrl)),
    [],
  );

  const patch = (id: string, next: Partial<UploadItem>) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...next } : i)));

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept,
    multiple,
    maxSize,
    maxFiles,
    disabled,
    noClick: false,
    onDrop: (accepted, rejected) => {
      setRejections(rejected);
      const added = accepted.map((file) => ({
        id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        progress: 0,
        status: 'uploading' as const,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      }));
      setItems((prev) => {
        const next = multiple ? [...prev, ...added] : added;
        onChange?.(next.map((i) => i.file));
        return next;
      });
      for (const item of added) {
        upload(item.file, (progress) => patch(item.id, { progress }))
          .then(() => patch(item.id, { status: 'done', progress: 100 }))
          .catch((e: unknown) =>
            patch(item.id, {
              status: 'error',
              error: e instanceof Error ? e.message : 'Upload failed',
            }),
          );
      }
    },
  });

  const remove = (id: string) =>
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      const next = prev.filter((i) => i.id !== id);
      onChange?.(next.map((i) => i.file));
      return next;
    });

  const acceptHint =
    hint ??
    [
      accept
        ? Object.values(accept).flat().join(', ') || Object.keys(accept).join(', ')
        : 'Any file',
      `up to ${formatBytes(maxSize)}`,
    ].join(' · ');

  return (
    <div className={cn('space-y-3', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-input px-6 py-8 text-center transition-colors outline-none hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
          isDragActive && 'border-primary bg-primary/5',
          disabled && 'pointer-events-none opacity-50',
        )}
      >
        <input {...getInputProps()} />
        <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <UploadCloud className="size-5" />
        </span>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{acceptHint}</p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-1"
          onClick={(e) => {
            e.stopPropagation();
            open();
          }}
        >
          Browse files
        </Button>
      </div>

      {rejections.length > 0 && (
        <ul className="space-y-1 rounded-lg bg-destructive/5 p-3 text-xs text-destructive">
          {rejections.map(({ file, errors }) => (
            <li key={file.name}>
              <span className="font-medium">{file.name}</span>:{' '}
              {errors.map((e) => e.message).join(', ')}
            </li>
          ))}
        </ul>
      )}

      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 rounded-lg border p-2.5">
              {item.previewUrl ? (
                <img src={item.previewUrl} alt="" className="size-10 rounded-md object-cover" />
              ) : (
                <span className="flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  {item.file.type.startsWith('image/') ? (
                    <ImageIcon className="size-4" />
                  ) : (
                    <FileText className="size-4" />
                  )}
                </span>
              )}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate font-medium">{item.file.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {item.status === 'error'
                      ? item.error
                      : item.status === 'done'
                        ? formatBytes(item.file.size)
                        : `${Math.round(item.progress)}%`}
                  </span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      'h-full rounded-full transition-[width] duration-200',
                      item.status === 'error'
                        ? 'bg-destructive'
                        : item.status === 'done'
                          ? 'bg-success'
                          : 'bg-primary',
                    )}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label={`Remove ${item.file.name}`}
                onClick={() => remove(item.id)}
              >
                <X />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
