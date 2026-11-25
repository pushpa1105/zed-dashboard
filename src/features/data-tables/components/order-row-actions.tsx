import { Copy, Eye, MoreHorizontal, PackageCheck, Trash2, Truck } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { notify } from '@/core/notify/notify';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';

import type { Order, OrderStatus } from '../model/order';

export type OrderActionHandlers = {
  onView: (order: Order) => void;
  onSetStatus: (ids: string[], status: OrderStatus) => void;
  onDelete: (ids: string[]) => void;
};

export function OrderRowActions({
  order,
  onView,
  onSetStatus,
  onDelete,
}: { order: Order } & OrderActionHandlers) {
  const { t } = useTranslation('data-tables');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t('actions.menu')}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onClick={() => onView(order)}>
          <Eye /> {t('actions.view')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            void navigator.clipboard
              .writeText(order.number)
              .then(() => notify.success(t('actions.copied')))
          }
        >
          <Copy /> {t('actions.copyId')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={order.status === 'shipped' || order.status === 'delivered'}
          onClick={() => onSetStatus([order.id], 'shipped')}
        >
          <Truck /> {t('actions.markShipped')}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={order.status === 'delivered'}
          onClick={() => onSetStatus([order.id], 'delivered')}
        >
          <PackageCheck /> {t('actions.markDelivered')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => onDelete([order.id])}>
          <Trash2 /> {t('actions.delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
