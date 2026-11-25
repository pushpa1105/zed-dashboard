import { Check, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';

import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';

export type CopyButtonProps = {
  value: string;
  label?: string;
  copiedLabel?: string;
  /** Show the label next to the icon. */
  showLabel?: boolean;
  className?: string;
  onCopied?: () => void;
};

/** Copies `value` to the clipboard and briefly shows a check mark. */
export function CopyButton({
  value,
  label = 'Copy',
  copiedLabel = 'Copied',
  showLabel,
  className,
  onCopied,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(id);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      onCopied?.();
    } catch {
      /* clipboard unavailable (insecure context): nothing to do */
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size={showLabel ? 'sm' : 'icon-sm'}
      aria-label={copied ? copiedLabel : label}
      className={cn('text-muted-foreground', className)}
      onClick={() => void copy()}
    >
      {copied ? <Check className="text-success" /> : <Copy />}
      {showLabel && (copied ? copiedLabel : label)}
    </Button>
  );
}
