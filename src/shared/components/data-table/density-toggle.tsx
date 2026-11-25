import { Rows2, Rows3, Rows4 } from 'lucide-react';

import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';

import type { Density } from './density';

const ITEMS = [
  { value: 'compact', icon: Rows4 },
  { value: 'default', icon: Rows3 },
  { value: 'comfortable', icon: Rows2 },
] as const;

/** Three-way row density switch. */
export function DensityToggle({
  value,
  onChange,
  labels = { compact: 'Compact', default: 'Default', comfortable: 'Comfortable' },
}: {
  value: Density;
  onChange: (density: Density) => void;
  labels?: Record<Density, string>;
}) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      value={value}
      onValueChange={(v) => v && onChange(v as Density)}
    >
      {ITEMS.map(({ value: item, icon: Icon }) => (
        <Tooltip key={item}>
          <TooltipTrigger asChild>
            <ToggleGroupItem value={item} aria-label={labels[item]}>
              <Icon />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>{labels[item]}</TooltipContent>
        </Tooltip>
      ))}
    </ToggleGroup>
  );
}
