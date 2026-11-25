import { Sparkles } from 'lucide-react';

import { money, shortDate } from '@/features/erp/lib/money';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { cn } from '@/shared/lib/cn';
import { Skeleton } from '@/shared/ui/skeleton';

type ReconItem = {
  id: string;
  date: string;
  title: string;
  subtitle: string;
  amount: number;
  suggested?: boolean;
};

/** One side of the reconciliation (bank or books): unmatched lines, single selection. */
export function ReconciliationList({
  title,
  description,
  items,
  selectedId,
  onSelect,
  emptyText,
  suggestedText,
}: {
  title: string;
  description: string;
  items: ReconItem[] | undefined;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  emptyText: string;
  suggestedText?: string;
}) {
  return (
    <SectionCard flush title={title} description={description}>
      <ul className="max-h-[28rem] divide-y overflow-y-auto border-t" aria-label={title}>
        {!items &&
          Array.from({ length: 5 }, (_, i) => (
            <li key={i} className="p-4">
              <Skeleton className="h-10 w-full" />
            </li>
          ))}
        {items?.map((item) => {
          const active = item.id === selectedId;
          return (
            <li key={item.id}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => onSelect(active ? null : item.id)}
                className={cn(
                  'flex w-full items-start gap-3 px-5 py-3 text-left transition-colors hover:bg-muted/40',
                  active && 'bg-primary/5 shadow-[inset_3px_0_0_var(--primary)]',
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{item.title}</span>
                  <span className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    {shortDate(item.date)} · <span className="truncate">{item.subtitle}</span>
                  </span>
                  {item.suggested && suggestedText && (
                    <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-info/10 px-2 py-0.5 text-xs font-medium text-info">
                      <Sparkles className="size-3" /> {suggestedText}
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    'text-sm font-medium tabular-nums',
                    item.amount > 0 && 'text-success',
                  )}
                >
                  {money(item.amount)}
                </span>
              </button>
            </li>
          );
        })}
        {items?.length === 0 && (
          <li className="px-5 py-12 text-center text-sm text-muted-foreground">{emptyText}</li>
        )}
      </ul>
    </SectionCard>
  );
}
