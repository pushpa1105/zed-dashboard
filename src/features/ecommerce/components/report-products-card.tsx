import { useTranslation } from '@/core/i18n/use-translation';
import { Link } from '@/core/router/router';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { Progress } from '@/shared/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { formatMoney } from '../lib/money';
import type { SalesReport } from '../model/reports';
import { ecommerceRoutes } from '../routes';

import { ProductThumb } from './store-badges';

const TOP = 10;

/** Best sellers of the report period with their share of product revenue. */
export function ReportProductsCard({ products }: { products: SalesReport['products'] }) {
  const { t, i18n } = useTranslation('ecommerce');
  const total = products.reduce((s, p) => s + p.revenue, 0);

  return (
    <SectionCard
      flush
      className="min-w-0 lg:col-span-2"
      title={t('reports.products.title')}
      description={t('reports.products.description', { count: products.length })}
    >
      <Table aria-label={t('reports.products.title')}>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-10 pl-6">#</TableHead>
            <TableHead>{t('reports.col.product')}</TableHead>
            <TableHead className="hidden text-right sm:table-cell">
              {t('reports.col.units')}
            </TableHead>
            <TableHead className="hidden text-right md:table-cell">
              {t('reports.col.orders')}
            </TableHead>
            <TableHead className="text-right">{t('reports.col.revenue')}</TableHead>
            <TableHead className="hidden w-32 pr-6 lg:table-cell">
              {t('reports.col.share')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.slice(0, TOP).map((product, i) => {
            const share = total ? (product.revenue / total) * 100 : 0;
            return (
              <TableRow key={product.id}>
                <TableCell className="pl-6 text-muted-foreground tabular-nums">{i + 1}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <ProductThumb hue={product.hue} size="sm" />
                    <div className="min-w-0">
                      <Link
                        to={ecommerceRoutes.product.href({ productId: product.id })}
                        className="block truncate font-medium hover:underline"
                      >
                        {product.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{product.category}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden text-right tabular-nums sm:table-cell">
                  {product.units.toLocaleString(i18n.language)}
                </TableCell>
                <TableCell className="hidden text-right tabular-nums md:table-cell">
                  {product.orders.toLocaleString(i18n.language)}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatMoney(product.revenue, i18n.language, 0)}
                </TableCell>
                <TableCell className="hidden pr-6 lg:table-cell">
                  <div className="flex items-center gap-2">
                    <Progress value={share} className="h-1.5 flex-1" />
                    <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">
                      {share.toFixed(1)}%
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </SectionCard>
  );
}
