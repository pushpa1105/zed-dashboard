import { cn } from '@/shared/lib/cn';

/** Single-choice row of toggle chips, scrollable on narrow screens. */
export function ChipFilter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; count?: number }>;
}) {
  return (
    <div role="toolbar" aria-label={label} className="scrollbar-none flex gap-1.5 overflow-x-auto">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-sm transition-colors hover:bg-accent',
            value === o.value && 'border-primary bg-primary/10 text-primary hover:bg-primary/15',
          )}
        >
          {o.label}
          {o.count !== undefined && (
            <span className="text-xs text-muted-foreground tabular-nums">{o.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
