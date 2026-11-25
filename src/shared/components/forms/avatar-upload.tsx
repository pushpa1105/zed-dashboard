import { Camera, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';

export type AvatarUploadProps = {
  /** Existing image URL. */
  value?: string | null;
  onChange?: (file: File | null) => void;
  /** Initials or icon shown when there is no image. */
  fallback?: string;
  size?: number;
  shape?: 'circle' | 'rounded';
  uploadLabel?: string;
  removeLabel?: string;
  hint?: string;
  disabled?: boolean;
};

/** Profile picture / company logo picker with instant preview. */
export function AvatarUpload({
  value,
  onChange,
  fallback = '',
  size = 64,
  shape = 'circle',
  uploadLabel = 'Upload',
  removeLabel = 'Remove',
  hint = 'PNG or JPG, at least 256×256.',
  disabled,
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(value ?? null);

  useEffect(() => {
    if (!preview?.startsWith('blob:')) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        aria-label={uploadLabel}
        className={cn(
          'group relative flex shrink-0 items-center justify-center overflow-hidden bg-muted text-lg font-medium text-muted-foreground ring-1 ring-border outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
          shape === 'circle' ? 'rounded-full' : 'rounded-xl',
        )}
        style={{ width: size, height: size }}
      >
        {preview ? <img src={preview} alt="" className="size-full object-cover" /> : fallback}
        <span className="absolute inset-0 flex items-center justify-center bg-overlay/40 text-overlay-foreground opacity-0 transition-opacity group-hover:opacity-100">
          <Camera className="size-4" />
        </span>
      </button>
      <div className="space-y-1.5">
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
          >
            {uploadLabel}
          </Button>
          {preview && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={disabled}
              onClick={() => {
                setPreview(null);
                onChange?.(null);
              }}
            >
              <Trash2 /> {removeLabel}
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setPreview(URL.createObjectURL(file));
          onChange?.(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
