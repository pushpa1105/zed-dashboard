import { useTranslation } from '@/core/i18n/use-translation';
import { cn } from '@/shared/lib/cn';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';

import { fillColor } from '../lib/fill';

/** One bin square, shaded by how full it is. */
export function BinCell({
  code,
  fill,
  selected,
  onSelect,
}: {
  code: string;
  fill: number;
  selected?: boolean;
  onSelect: () => void;
}) {
  const { t } = useTranslation('inventory', { keyPrefix: 'warehouses.bins' });
  const label = t('label', { code, pct: fill });
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onSelect}
          aria-label={label}
          className={cn(
            'size-8 shrink-0 rounded-md ring-1 ring-border transition-transform ring-inset hover:scale-110',
            selected && 'ring-2 ring-foreground',
          )}
          style={{
            background: `color-mix(in srgb, ${fillColor(fill)} ${Math.max(10, fill)}%, var(--card))`,
          }}
        />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function FillLegend({ className }: { className?: string }) {
  const { t } = useTranslation('inventory', { keyPrefix: 'warehouses.bins' });
  return (
    <div className={cn('items-center gap-3 text-xs text-muted-foreground', className)}>
      {(
        [
          [0, t('ok')],
          [80, t('tight')],
          [100, t('full')],
        ] as const
      ).map(([pct, label]) => (
        <span key={label} className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px]" style={{ background: fillColor(pct) }} />
          {label}
        </span>
      ))}
    </div>
  );
}
