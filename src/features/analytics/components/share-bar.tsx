import { percent } from '../lib/format';

/** Inline bar scaled to the largest row, followed by the share in percent. */
export function ShareBar({ share, max }: { share: number; max: number }) {
  return (
    <span className="flex items-center gap-3">
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <span
          className="block h-full rounded-full bg-primary"
          style={{ width: `${(share / max) * 100}%` }}
        />
      </span>
      <span className="w-12 text-right text-xs text-muted-foreground tabular-nums">
        {percent(share)}
      </span>
    </span>
  );
}
