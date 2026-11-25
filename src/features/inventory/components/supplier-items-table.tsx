import { useTranslation } from '@/core/i18n/use-translation';
import { Link } from '@/core/router/router';
import { Tag } from '@/shared/components/display/tag';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { qty, usdCents } from '../lib/format';
import type { SupplierDetail } from '../model/inventory';
import { inventoryRoutes } from '../routes';

import { StockStatusBadge } from './stock-status-badge';

/** Catalog of one supplier: preferred items first, with current stock status. */
export function SupplierItemsTable({ items }: { items: SupplierDetail['items'] }) {
  const { t } = useTranslation('inventory');
  const sorted = [...items].sort((a, b) => Number(b.preferred) - Number(a.preferred));

  return (
    <div className="max-h-[26rem] overflow-y-auto border-t">
      <Table aria-label={t('supplier.items.title')}>
        <TableHeader className="sticky top-0 bg-card">
          <TableRow>
            <TableHead className="pl-6">{t('items.columns.name')}</TableHead>
            <TableHead className="text-right">{t('items.columns.unitCost')}</TableHead>
            <TableHead className="text-right">{t('items.columns.available')}</TableHead>
            <TableHead className="pr-6">{t('items.columns.status')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((item) => (
            <TableRow key={item.sku}>
              <TableCell className="pl-6">
                <Link
                  to={inventoryRoutes.item.href({ sku: item.sku })}
                  className="font-medium hover:underline"
                >
                  {item.name}
                </Link>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{item.sku}</span>
                  <Tag size="sm" tone={item.preferred ? 'primary' : 'neutral'}>
                    {t(item.preferred ? 'supplier.items.preferred' : 'supplier.items.alternate')}
                  </Tag>
                </div>
              </TableCell>
              <TableCell className="text-right tabular-nums">{usdCents(item.unitCost)}</TableCell>
              <TableCell className="text-right tabular-nums">{qty(item.available)}</TableCell>
              <TableCell className="pr-6">
                <StockStatusBadge status={item.status} variant="dot" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
