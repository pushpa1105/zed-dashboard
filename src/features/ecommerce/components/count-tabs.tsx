import { cn } from '@/shared/lib/cn';

export type CountTab<T extends string> = { value: T; label: string; count?: number };

/**
 * Underline tabs with a count per tab (order status, review queue…). Plain
 * buttons with `aria-pressed`, because they filter one list rather than swap
 * panels.
 */
export function CountTabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: CountTab<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      className={cn('scrollbar-none flex gap-5 overflow-x-auto border-b', className)}
      role="toolbar"
    >
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(tab.value)}
            className={cn(
              'relative -mb-px inline-flex h-10 shrink-0 items-center gap-2 border-b-2 border-transparent text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground',
              active && 'border-primary text-foreground',
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  'rounded-full bg-muted px-1.5 py-0.5 text-[0.6875rem] leading-none tabular-nums',
                  active && 'bg-primary/10 text-primary',
                )}
              >
                {tab.count.toLocaleString()}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
