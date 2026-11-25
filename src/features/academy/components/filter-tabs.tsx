import { cn } from '@/shared/lib/cn';

export type FilterTab<T extends string> = { value: T; label: string; count?: number };

/** Pill filters with counts; scrolls sideways on narrow screens. */
export function FilterTabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: FilterTab<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="scrollbar-none flex gap-1.5 overflow-x-auto">
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(tab.value)}
            className={cn(
              'inline-flex h-8 shrink-0 items-center gap-2 rounded-full border px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
              active && 'border-primary/40 bg-primary/10 text-primary hover:text-primary',
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="rounded-full bg-background px-1.5 text-xs tabular-nums">
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
