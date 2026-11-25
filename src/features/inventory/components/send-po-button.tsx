import { Send } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Button } from '@/shared/ui/button';

import { useSendPurchaseOrder } from '../api/inventory-api';

/** Sends a draft PO to its supplier (it then shows up on the Receiving page). */
export function SendPoButton({ id }: { id: string }) {
  const { t } = useTranslation('inventory', { keyPrefix: 'purchaseOrders' });
  const send = useSendPurchaseOrder();
  return (
    <Button
      size="xs"
      variant="outline"
      disabled={send.isPending}
      onClick={(e) => {
        e.stopPropagation();
        send.mutate(id);
      }}
    >
      <Send /> {t('send')}
    </Button>
  );
}
