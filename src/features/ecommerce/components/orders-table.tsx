import { useTranslation } from '@/core/i18n/use-translation';
import { Link } from '@/core/router/router';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { cn } from '@/shared/lib/cn';
import { formatDate, getInitials } from '@/shared/lib/format';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import type { EcommerceOverview, OrderStatus } from '../model/overview';
import { ecommerceRoutes } from '../routes';

const STATUS_CLASS: Record<OrderStatus, string> = {
  paid: 'bg-success/10 text-success ring-success/20',
  shipped: 'bg-info/10 text-info ring-info/20',
  pending: 'bg-warning/15 text-foreground/80 ring-warning/30',
  refunded: 'bg-destructive/10 text-destructive ring-destructive/20',
};

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function OrdersTable({ orders }: { orders: EcommerceOverview['orders'] }) {
  const { t } = useTranslation('ecommerce', { keyPrefix: 'overview' });

  return (
    <SectionCard
      flush
      title={t('orders.title')}
      description={t('orders.description')}
      action={
        <Button variant="outline" size="sm" asChild>
          <Link to={ecommerceRoutes.orders.href()}>{t('orders.viewAll')}</Link>
        </Button>
      }
    >
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-6">{t('orders.customer')}</TableHead>
            <TableHead className="hidden md:table-cell">{t('orders.product')}</TableHead>
            <TableHead className="hidden sm:table-cell">{t('orders.date')}</TableHead>
            <TableHead>{t('orders.status')}</TableHead>
            <TableHead className="pr-6 text-right">{t('orders.amount')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const [first, last] = order.customer.split(' ');
            return (
              <TableRow key={order.id}>
                <TableCell className="pl-6">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-accent text-xs font-medium text-accent-foreground">
                        {getInitials(first, last)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{order.customer}</p>
                      <p className="font-mono text-xs text-muted-foreground">{order.id}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <p className="max-w-56 truncate">{order.product}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('orders.quantity', { count: order.quantity })}
                  </p>
                </TableCell>
                <TableCell className="hidden text-muted-foreground tabular-nums sm:table-cell">
                  {formatDate(order.date, 'D MMM, h:mm a')}
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      'inline-flex rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
                      STATUS_CLASS[order.status],
                    )}
                  >
                    {t(`status.${order.status}`)}
                  </span>
                </TableCell>
                <TableCell className="pr-6 text-right font-medium tabular-nums">
                  {usd.format(order.amount)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </SectionCard>
  );
}
