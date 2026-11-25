import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';

type StatusTab<T extends string> = { value: T; label: string; count?: number };

/** Status filter with counts; scrolls horizontally on narrow screens. */
export function StatusTabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: StatusTab<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <Tabs value={value} onValueChange={(next) => onChange(next as T)}>
      <TabsList
        aria-label={label}
        className="scrollbar-none max-w-full justify-start overflow-x-auto"
      >
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
            {tab.label}
            {tab.count !== undefined && (
              <span className="rounded-full bg-muted px-1.5 text-xs text-muted-foreground tabular-nums">
                {tab.count}
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
