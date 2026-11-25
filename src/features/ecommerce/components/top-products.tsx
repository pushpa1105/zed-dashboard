import { useTranslation } from '@/core/i18n/use-translation';
import { Sparkline } from '@/shared/components/charts/sparkline';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import type { EcommerceOverview } from '../model/overview';

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export function TopProducts({ products }: { products: EcommerceOverview['topProducts'] }) {
  const { t } = useTranslation('ecommerce', { keyPrefix: 'overview' });

  return (
    <SectionCard flush title={t('products.title')} description={t('products.description')}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-10 pl-6">#</TableHead>
            <TableHead>{t('products.product')}</TableHead>
            <TableHead className="text-right">{t('products.sold')}</TableHead>
            <TableHead className="text-right">{t('products.revenue')}</TableHead>
            <TableHead className="hidden text-right md:table-cell">{t('products.stock')}</TableHead>
            <TableHead className="hidden pr-6 lg:table-cell">{t('products.trend')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product, i) => (
            <TableRow key={product.id}>
              <TableCell className="pl-6 text-muted-foreground tabular-nums">{i + 1}</TableCell>
              <TableCell>
                <p className="font-medium">{product.name}</p>
                <p className="text-xs text-muted-foreground">{product.category}</p>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {product.sold.toLocaleString('en-US')}
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {usd.format(product.revenue)}
              </TableCell>
              <TableCell className="hidden text-right tabular-nums md:table-cell">
                {product.stock < 40 ? (
                  <span className="text-destructive">
                    {product.stock} · {t('products.lowStock')}
                  </span>
                ) : (
                  product.stock
                )}
              </TableCell>
              <TableCell className="hidden pr-6 lg:table-cell">
                <Sparkline data={product.trend} variant="line" className="h-7 w-24" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  );
}
