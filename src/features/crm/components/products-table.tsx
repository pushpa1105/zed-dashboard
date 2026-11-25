import { Pencil } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Tag } from '@/shared/components/display/tag';
import type { Tone } from '@/shared/components/display/tone';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Switch } from '@/shared/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { useSaveProduct } from '../api/quotes-api';
import { money } from '../lib/format';
import { marginOf, type Product, type ProductCategory } from '../model/quotes';

const CATEGORY_TONE: Record<ProductCategory, Tone> = {
  platform: 'violet',
  addon: 'blue',
  services: 'orange',
  support: 'aqua',
};

/** Margins below this are flagged: services rarely go lower without losing money. */
export const LOW_MARGIN = 40;

function MarginBar({ pct }: { pct: number }) {
  const low = pct < LOW_MARGIN;
  return (
    <div className="flex items-center justify-end gap-2">
      <div className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-muted sm:block">
        <div
          className={cn('h-full rounded-full', low ? 'bg-warning' : 'bg-success')}
          style={{ width: `${Math.max(0, pct)}%` }}
        />
      </div>
      <span className={cn('w-10 text-right font-medium tabular-nums', low && 'text-warning')}>
        {Math.round(pct)}%
      </span>
    </div>
  );
}

export function ProductsTable({
  products,
  onEdit,
}: {
  products: Product[];
  onEdit: (product: Product) => void;
}) {
  const { t } = useTranslation('crm');
  const save = useSaveProduct();
  return (
    <Table aria-label={t('products.title')}>
      <TableHeader>
        <TableRow>
          <TableHead className="pl-6">{t('products.columns.product')}</TableHead>
          <TableHead className="hidden md:table-cell">{t('products.columns.category')}</TableHead>
          <TableHead className="text-right">{t('products.columns.listPrice')}</TableHead>
          <TableHead className="hidden text-right sm:table-cell">
            {t('products.columns.cost')}
          </TableHead>
          <TableHead className="text-right">{t('products.columns.margin')}</TableHead>
          <TableHead className="text-center">{t('products.columns.active')}</TableHead>
          <TableHead className="w-12 pr-6" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((p) => (
          <TableRow key={p.id} className={cn(!p.active && 'text-muted-foreground')}>
            <TableCell className="max-w-64 pl-6">
              <p className="truncate font-medium">{p.name}</p>
              <p className="text-xs text-muted-foreground">{p.sku}</p>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <Tag size="sm" tone={CATEGORY_TONE[p.category]}>
                {t(`products.category.${p.category}`)}
              </Tag>
            </TableCell>
            <TableCell className="text-right font-medium tabular-nums">
              {money(p.listPrice)}
            </TableCell>
            <TableCell className="hidden text-right tabular-nums sm:table-cell">
              {money(p.cost)}
            </TableCell>
            <TableCell>
              <MarginBar pct={marginOf(p)} />
            </TableCell>
            <TableCell className="text-center">
              <Switch
                checked={p.active}
                onCheckedChange={(active) => save.mutate({ id: p.id, active })}
                aria-label={t('products.toggle', { name: p.name })}
              />
            </TableCell>
            <TableCell className="pr-6">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onEdit(p)}
                aria-label={t('products.editNamed', { name: p.name })}
              >
                <Pencil />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
