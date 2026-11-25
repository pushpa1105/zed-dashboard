import { ImagePlus, Paperclip, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export type ButtonUploadProps = {
  accept?: string;
  multiple?: boolean;
  onChange?: (files: File[]) => void;
  label?: string;
  emptyText?: string;
  removeLabel?: string;
  disabled?: boolean;
  className?: string;
};

/** Compact "Attach file" button with the chosen files listed inline. */
export function ButtonUpload({
  accept,
  multiple,
  onChange,
  label = 'Attach file',
  emptyText = 'No file chosen',
  removeLabel = 'Remove',
  disabled,
  className,
}: ButtonUploadProps) {
  const id = useId();
  const [files, setFiles] = useState<File[]>([]);
  const update = (next: File[]) => {
    setFiles(next);
    onChange?.(next);
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <input
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
        onChange={(e) => {
          update(
            multiple
              ? [...files, ...Array.from(e.target.files ?? [])]
              : Array.from(e.target.files ?? []),
          );
          e.target.value = '';
        }}
      />
      <Button asChild variant="outline" disabled={disabled}>
        <label htmlFor={id} className="cursor-pointer">
          <Paperclip /> {label}
        </label>
      </Button>
      {files.length === 0 ? (
        <span className="text-sm text-muted-foreground">{emptyText}</span>
      ) : (
        files.map((file, i) => (
          <span
            key={`${file.name}-${i}`}
            className="inline-flex h-8 max-w-56 items-center gap-1.5 rounded-md border bg-muted/40 pr-1 pl-2.5 text-sm"
          >
            <span className="truncate">{file.name}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{formatSize(file.size)}</span>
            <button
              type="button"
              aria-label={`${removeLabel} ${file.name}`}
              className="rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
              onClick={() => update(files.filter((_, j) => j !== i))}
            >
              <X className="size-3.5" />
            </button>
          </span>
        ))
      )}
    </div>
  );
}

export type GalleryUploadProps = {
  max?: number;
  onChange?: (files: File[]) => void;
  addLabel?: string;
  removeLabel?: string;
  /** Label for the first image ("Cover"). */
  coverLabel?: string;
  className?: string;
};

/** Image grid uploader with thumbnails; the first image is marked as the cover. */
export function GalleryUpload({
  max = 8,
  onChange,
  addLabel = 'Add image',
  removeLabel = 'Remove',
  coverLabel = 'Cover',
  className,
}: GalleryUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Array<{ file: File; url: string }>>([]);

  // Revoke object URLs on unmount (and individually on remove).
  const live = useRef(items);
  useEffect(() => {
    live.current = items;
  }, [items]);
  useEffect(() => () => live.current.forEach((item) => URL.revokeObjectURL(item.url)), []);

  const update = (next: Array<{ file: File; url: string }>) => {
    setItems(next);
    onChange?.(next.map((item) => item.file));
  };

  return (
    <div className={cn('grid grid-cols-3 gap-3 sm:grid-cols-4', className)}>
      {items.map((item, i) => (
        <div
          key={item.url}
          className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
        >
          <img src={item.url} alt={item.file.name} className="size-full object-cover" />
          {i === 0 && (
            <span className="absolute top-1.5 left-1.5 rounded bg-background/90 px-1.5 py-0.5 text-[0.6875rem] font-medium">
              {coverLabel}
            </span>
          )}
          <button
            type="button"
            aria-label={`${removeLabel} ${item.file.name}`}
            onClick={() => {
              URL.revokeObjectURL(item.url);
              update(items.filter((_, j) => j !== i));
            }}
            className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-background/90 text-muted-foreground opacity-0 shadow-xs transition-opacity group-hover:opacity-100 hover:text-foreground focus-visible:opacity-100"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
      {items.length < max && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed text-xs text-muted-foreground transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
        >
          <ImagePlus className="size-5" />
          {addLabel}
          <span className="tabular-nums">
            {items.length}/{max}
          </span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []).slice(0, max - items.length);
          update([...items, ...files.map((file) => ({ file, url: URL.createObjectURL(file) }))]);
          e.target.value = '';
        }}
      />
    </div>
  );
}
