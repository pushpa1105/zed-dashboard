import { RotateCcw, Settings2 } from 'lucide-react';

import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { Label } from '@/shared/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { Separator } from '@/shared/ui/separator';
import { Switch } from '@/shared/ui/switch';

import { DENSITIES, type Density } from './density';
import type { TableAppearance } from './table-appearance';

export type AppearancePanelLabels = {
  trigger: string;
  title: string;
  density: string;
  densities: Record<Density, string>;
  striped: string;
  bordered: string;
  stickyHeader: string;
  columns: string;
  reset: string;
};

const DEFAULT_LABELS: AppearancePanelLabels = {
  trigger: 'Customize',
  title: 'Table settings',
  density: 'Row height',
  densities: { compact: 'Compact', default: 'Default', comfortable: 'Comfortable' },
  striped: 'Striped rows',
  bordered: 'Cell borders',
  stickyHeader: 'Sticky header',
  columns: 'Columns',
  reset: 'Reset to defaults',
};

/**
 * Popover with every presentation option of a table: row height, zebra rows,
 * cell borders, sticky header and column visibility. Pair with
 * `useTableAppearance` to persist the choices.
 */
export function TableAppearancePanel({
  appearance,
  onChange,
  onReset,
  columns,
  labels: labelsProp,
}: {
  appearance: TableAppearance;
  onChange: (patch: Partial<TableAppearance>) => void;
  onReset: () => void;
  /** Columns that can be hidden. */
  columns: Array<{ id: string; label: string }>;
  labels?: Partial<AppearancePanelLabels>;
}) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const toggles = [
    ['striped', labels.striped],
    ['bordered', labels.bordered],
    ['stickyHeader', labels.stickyHeader],
  ] as const;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <Settings2 /> {labels.trigger}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-4 p-4">
        <p className="text-sm font-semibold">{labels.title}</p>
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">{labels.density}</p>
          <div
            className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1"
            role="radiogroup"
            aria-label={labels.density}
          >
            {DENSITIES.map((d) => (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={appearance.density === d}
                onClick={() => onChange({ density: d })}
                className="h-7 rounded-md text-xs font-medium text-muted-foreground transition-colors aria-checked:bg-background aria-checked:text-foreground aria-checked:shadow-xs"
              >
                {labels.densities[d]}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2.5">
          {toggles.map(([key, label]) => (
            <div key={key} className="flex items-center justify-between gap-3">
              <Label htmlFor={`appearance-${key}`} className="font-normal">
                {label}
              </Label>
              <Switch
                id={`appearance-${key}`}
                checked={appearance[key]}
                onCheckedChange={(checked) => onChange({ [key]: checked })}
              />
            </div>
          ))}
        </div>
        <Separator />
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">{labels.columns}</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2">
            {columns.map((column) => (
              <label key={column.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={appearance.columnVisibility[column.id] !== false}
                  onCheckedChange={(checked) =>
                    onChange({
                      columnVisibility: {
                        ...appearance.columnVisibility,
                        [column.id]: checked === true,
                      },
                    })
                  }
                />
                <span className="truncate">{column.label}</span>
              </label>
            ))}
          </div>
        </div>
        <Button variant="ghost" size="sm" className="w-full" onClick={onReset}>
          <RotateCcw /> {labels.reset}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
