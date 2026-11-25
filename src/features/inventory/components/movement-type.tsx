import {
  ArrowDownLeft,
  ArrowUpRight,
  Repeat2,
  ScanLine,
  SlidersHorizontal,
  type LucideIcon,
} from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { cn } from '@/shared/lib/cn';

import type { Movement } from '../model/inventory';

const ICON: Record<Movement['type'], LucideIcon> = {
  receipt: ArrowDownLeft,
  shipment: ArrowUpRight,
  'transfer-in': Repeat2,
  'transfer-out': Repeat2,
  adjustment: SlidersHorizontal,
  count: ScanLine,
};

/** Icon tile + label for a ledger row; inbound quantities are tinted green. */
export function MovementType({ type, quantity }: { type: Movement['type']; quantity: number }) {
  const { t } = useTranslation('inventory', { keyPrefix: 'item.ledger.types' });
  const Icon = ICON[type];
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <span
        className={cn(
          'flex size-7 items-center justify-center rounded-md',
          quantity >= 0 ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground',
        )}
      >
        <Icon className="size-3.5" />
      </span>
      {t(type)}
    </span>
  );
}
