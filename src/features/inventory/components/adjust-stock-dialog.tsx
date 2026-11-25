import { Minus, Plus } from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { NumberInput } from '@/shared/components/forms/number-input';
import { SegmentedControl } from '@/shared/components/forms/segmented-control';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

import { useAdjustStock } from '../api/inventory-api';
import { WAREHOUSE_CODES } from '../model/inventory';

const REASONS = ['damaged', 'found', 'shrinkage', 'qa', 'correction'] as const;

/** Adds or removes the same quantity for every selected SKU in one warehouse. */
export function AdjustStockDialog({
  open,
  onOpenChange,
  skus,
  defaultWarehouse,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skus: string[];
  defaultWarehouse: string;
  onDone: (count: number) => void;
}) {
  const { t } = useTranslation('inventory', { keyPrefix: 'items.adjust' });
  const adjust = useAdjustStock();
  const [direction, setDirection] = useState<'add' | 'remove'>('remove');
  const [quantity, setQuantity] = useState<number | null>(1);
  const [warehouse, setWarehouse] = useState(defaultWarehouse);
  const [reason, setReason] = useState<(typeof REASONS)[number]>('damaged');

  const submit = () =>
    adjust.mutate(
      {
        skus,
        warehouse,
        delta: (direction === 'add' ? 1 : -1) * (quantity ?? 0),
        reason: t(`reasons.${reason}`),
      },
      {
        onSuccess: () => {
          onDone(skus.length);
          onOpenChange(false);
        },
      },
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description', { count: skus.length })}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-5">
          <div className="grid gap-2">
            <Label>{t('direction')}</Label>
            <SegmentedControl
              value={direction}
              onChange={(value) => setDirection(value as 'add' | 'remove')}
              options={[
                { value: 'remove', label: t('remove'), icon: <Minus className="size-4" /> },
                { value: 'add', label: t('add'), icon: <Plus className="size-4" /> },
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="adjust-qty">{t('quantity')}</Label>
              <NumberInput
                id="adjust-qty"
                value={quantity}
                onChange={setQuantity}
                min={1}
                steppers
              />
            </div>
            <div className="grid gap-2">
              <Label>{t('warehouse')}</Label>
              <Select value={warehouse} onValueChange={setWarehouse}>
                <SelectTrigger className="w-full" aria-label={t('warehouse')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WAREHOUSE_CODES.map((code) => (
                    <SelectItem key={code} value={code}>
                      {code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>{t('reason')}</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as (typeof REASONS)[number])}>
              <SelectTrigger className="w-full" aria-label={t('reason')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {t(`reasons.${r}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button disabled={!quantity || adjust.isPending || skus.length === 0} onClick={submit}>
            {t('apply')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
