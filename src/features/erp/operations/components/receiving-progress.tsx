import { cn } from '@/shared/lib/cn';
import { Progress } from '@/shared/ui/progress';

/** Thin progress bar with its percentage, used for received vs ordered units. */
export function ReceivingProgress({
  value,
  label,
  className,
}: {
  value: number;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Progress value={value} aria-label={label} className="h-1.5" />
      <span className="w-9 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
        {Math.round(value)}%
      </span>
    </div>
  );
}
