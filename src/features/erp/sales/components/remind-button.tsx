import { BellRing } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Button } from '@/shared/ui/button';

import { useSendReminder } from '../api/sales-api';
import { customerAging, type CustomerBalance } from '../model/sales';

/** Emails a payment reminder for every overdue invoice of the customer. */
export function RemindButton({
  customer,
  size = 'sm',
}: {
  customer: CustomerBalance;
  size?: 'sm' | 'default';
}) {
  const { t } = useTranslation('erp', { keyPrefix: 'receivables' });
  const remind = useSendReminder();
  return (
    <Button
      size={size}
      variant="outline"
      disabled={remind.isPending || customerAging(customer).overdue <= 0}
      aria-label={t('reminder.sendTo', { name: customer.name })}
      onClick={(e) => {
        e.stopPropagation();
        remind.mutate(customer.id);
      }}
    >
      <BellRing /> {t('reminder.send')}
    </Button>
  );
}
