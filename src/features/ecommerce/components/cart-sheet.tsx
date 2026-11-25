import { Send } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Link } from '@/core/router/router';
import { DescriptionList } from '@/shared/components/display/description-list';
import { StatusBadge } from '@/shared/components/display/status-badge';
import type { Tone } from '@/shared/components/display/tone';
import { formatDate, formatRelative } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/shared/ui/sheet';

import { useSendRecoveryEmails } from '../api/marketing-api';
import { formatMoney } from '../lib/money';
import type { AbandonedCart } from '../model/marketing';
import { ecommerceRoutes } from '../routes';

import { ProductThumb } from './store-badges';

const RECOVERY_TONE: Record<AbandonedCart['recovery'], Tone> = {
  not_sent: 'warning',
  sent: 'info',
  recovered: 'success',
};

export function RecoveryBadge({ recovery }: { recovery: AbandonedCart['recovery'] }) {
  const { t } = useTranslation('ecommerce');
  return (
    <StatusBadge
      status={recovery}
      tone={RECOVERY_TONE[recovery]}
      label={t(`carts.recovery.${recovery}`)}
    />
  );
}

export function RecoveryEmailButton({
  cart,
  size = 'sm',
}: {
  cart: AbandonedCart;
  size?: 'sm' | 'default';
}) {
  const { t } = useTranslation('ecommerce');
  const send = useSendRecoveryEmails();
  if (cart.recovery !== 'not_sent') return null;
  return (
    <Button
      size={size}
      variant="outline"
      disabled={send.isPending}
      onClick={(e) => {
        e.stopPropagation();
        send.mutate([cart.id]);
      }}
    >
      <Send /> {t('carts.send')}
    </Button>
  );
}

/** Cart contents, checkout progress and the recovery email trail of one abandoned cart. */
export function CartSheet({ cart, onClose }: { cart?: AbandonedCart; onClose: () => void }) {
  const { t, i18n } = useTranslation('ecommerce');
  const money = (n: number) => formatMoney(n, i18n.language);
  const at = (ms: number | null) => (ms ? formatDate(ms, 'MMM D, h:mm A') : '–');

  return (
    <Sheet open={!!cart} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {cart && (
          <>
            <SheetHeader>
              <SheetTitle>{cart.customerName}</SheetTitle>
              <SheetDescription>{cart.customerEmail}</SheetDescription>
            </SheetHeader>
            <div className="space-y-6 px-4">
              <ul className="divide-y rounded-lg border">
                {cart.items.map((item) => (
                  <li key={item.productId + item.variant} className="flex items-center gap-3 p-3">
                    <ProductThumb hue={item.hue} size="sm" />
                    <div className="min-w-0 flex-1 text-sm">
                      <Link
                        to={ecommerceRoutes.product.href({ productId: item.productId })}
                        className="block truncate font-medium hover:underline"
                      >
                        {item.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {item.variant} · {item.qty} × {money(item.price)}
                      </p>
                    </div>
                    <span className="text-sm font-medium tabular-nums">
                      {money(item.qty * item.price)}
                    </span>
                  </li>
                ))}
                <li className="flex justify-between p-3 text-sm font-semibold">
                  {t('carts.col.value')}
                  <span className="tabular-nums">{money(cart.value)}</span>
                </li>
              </ul>
              <DescriptionList
                items={[
                  {
                    key: 'status',
                    term: t('carts.col.recovery'),
                    detail: <RecoveryBadge recovery={cart.recovery} />,
                  },
                  {
                    key: 'step',
                    term: t('carts.sheet.step'),
                    detail: t(`carts.step.${cart.checkoutStep}`),
                  },
                  {
                    key: 'seen',
                    term: t('carts.col.lastSeen'),
                    detail: formatRelative(cart.lastSeenAt),
                  },
                  { key: 'sent', term: t('carts.sheet.emailSent'), detail: at(cart.emailSentAt) },
                  {
                    key: 'recovered',
                    term: t('carts.sheet.recovered'),
                    detail: at(cart.recoveredAt),
                  },
                ]}
              />
              <Link
                to={ecommerceRoutes.customer.href({ customerId: cart.customerId })}
                className="inline-block text-sm font-medium text-primary hover:underline"
              >
                {t('carts.sheet.viewCustomer')}
              </Link>
            </div>
            {cart.recovery === 'not_sent' && (
              <SheetFooter>
                <RecoveryEmailButton cart={cart} size="default" />
              </SheetFooter>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
