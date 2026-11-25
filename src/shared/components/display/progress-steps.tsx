import { cn } from '@/shared/lib/cn';

export type ProgressStepsProps = {
  /** Total segments. */
  steps: number;
  /** Completed segments. */
  value: number;
  color?: string;
  label?: string;
  className?: string;
};

/** Segmented progress bar: discrete progress (onboarding 3 of 5, password strength). */
export function ProgressSteps({
  steps,
  value,
  color = 'var(--primary)',
  label,
  className,
}: ProgressStepsProps) {
  return (
    <div
      className={cn('space-y-1.5', className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={steps}
      aria-valuenow={value}
      aria-label={label}
    >
      <div className="flex gap-1">
        {Array.from({ length: steps }, (_, i) => (
          <span
            key={i}
            className="h-1.5 flex-1 rounded-full bg-muted transition-colors"
            style={i < value ? { background: color } : undefined}
          />
        ))}
      </div>
      {label && (
        <p className="flex justify-between text-xs text-muted-foreground">
          <span>{label}</span>
          <span className="tabular-nums">
            {value}/{steps}
          </span>
        </p>
      )}
    </div>
  );
}
