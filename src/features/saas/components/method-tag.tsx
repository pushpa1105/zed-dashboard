import { cn } from '@/shared/lib/cn';

const METHOD_CLASS: Record<string, string> = {
  GET: 'text-[color:var(--chart-4)] bg-[color:color-mix(in_srgb,var(--chart-4)_12%,transparent)]',
  POST: 'text-[color:var(--chart-2)] bg-[color:color-mix(in_srgb,var(--chart-2)_12%,transparent)]',
  PATCH: 'text-[color:var(--chart-3)] bg-[color:color-mix(in_srgb,var(--chart-3)_12%,transparent)]',
  PUT: 'text-[color:var(--chart-3)] bg-[color:color-mix(in_srgb,var(--chart-3)_12%,transparent)]',
  DELETE: 'text-destructive bg-destructive/10',
};

/** HTTP method chip, fixed width so paths line up. */
export function MethodTag({ method, className }: { method: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex w-14 shrink-0 justify-center rounded px-1.5 py-0.5 font-mono text-[0.6875rem] font-semibold',
        METHOD_CLASS[method] ?? 'bg-muted text-muted-foreground',
        className,
      )}
    >
      {method}
    </span>
  );
}
