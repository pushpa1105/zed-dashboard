import { RotateCw, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';

export type ErrorStateProps = {
  title?: ReactNode;
  description?: ReactNode;
  /** Shows a retry button. */
  onRetry?: () => void;
  retryLabel?: string;
  /** Technical detail (request id, status code), shown in mono. */
  code?: string;
  className?: string;
};

/** Failure placeholder for a widget or page section, with an optional retry. */
export function ErrorState({
  title = 'Something went wrong',
  description = 'We could not load this content. Try again in a moment.',
  onRetry,
  retryLabel = 'Try again',
  code,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center rounded-xl border border-destructive/25 bg-destructive/5 px-6 py-8 text-center',
        className,
      )}
    >
      <span className="mb-3 flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <TriangleAlert className="size-5" />
      </span>
      <p className="font-semibold">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {code && (
        <code className="mt-3 rounded bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
          {code}
        </code>
      )}
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          <RotateCw /> {retryLabel}
        </Button>
      )}
    </div>
  );
}
