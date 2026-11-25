import { cn } from '@/shared/lib/cn';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';

export type HeatmapProps = {
  rows: string[];
  columns: string[];
  /** `values[row][column]`. */
  values: number[][];
  /** Sequential hue (one hue, light → dark). Defaults to the brand color. */
  color?: string;
  valueFormatter?: (value: number) => string;
  className?: string;
};

/**
 * Grid heatmap (e.g. activity by weekday × hour). Magnitude is encoded as
 * opacity of a single hue, so it stays readable without a rainbow scale.
 */
export function Heatmap({
  rows,
  columns,
  values,
  color = 'var(--primary)',
  valueFormatter = String,
  className,
}: HeatmapProps) {
  const flat = values.flat();
  const max = Math.max(...flat, 1);
  const min = Math.min(...flat, 0);

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full border-separate border-spacing-1 text-xs">
        <thead>
          <tr>
            <th />
            {columns.map((c) => (
              <th key={c} className="pb-1 font-normal text-muted-foreground">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={row}>
              <th className="pr-2 text-left font-normal whitespace-nowrap text-muted-foreground">
                {row}
              </th>
              {columns.map((column, c) => {
                const value = values[r]?.[c] ?? 0;
                const t = (value - min) / (max - min || 1);
                return (
                  <td key={column} className="p-0">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="h-7 min-w-7 rounded-[4px] ring-1 ring-border/60 ring-inset"
                          style={{
                            background: `color-mix(in srgb, ${color} ${Math.round(8 + t * 92)}%, var(--card))`,
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        {row} · {column}: <strong>{valueFormatter(value)}</strong>
                      </TooltipContent>
                    </Tooltip>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
