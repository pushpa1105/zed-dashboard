import { CirclePause, CirclePlay } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { Button } from '@/shared/ui/button';

import { useSetCarrierStatus } from '../api/partners-api';
import type { Carrier } from '../model/carriers';

/** Suspends an active carrier (after confirmation) or reactivates a suspended one. */
export function CarrierStatusAction({ carrier }: { carrier: Carrier }) {
  const { t } = useTranslation('logistics');
  const suspend = carrier.status === 'active';
  const mutation = useSetCarrierStatus(suspend ? 'suspended' : 'active');

  if (!suspend) {
    return (
      <Button
        size="sm"
        variant="outline"
        disabled={mutation.isPending}
        onClick={() => mutation.mutate(carrier.id)}
        aria-label={t('carriers.activateCarrier', { name: carrier.name })}
      >
        <CirclePlay /> {t('carriers.activate')}
      </Button>
    );
  }
  return (
    <ConfirmDialog
      trigger={
        <Button
          size="sm"
          variant="ghost"
          aria-label={t('carriers.suspendCarrier', { name: carrier.name })}
        >
          <CirclePause /> {t('carriers.suspend')}
        </Button>
      }
      title={t('carriers.suspendTitle', { name: carrier.name })}
      description={t('carriers.suspendDescription')}
      confirmLabel={t('carriers.suspend')}
      cancelLabel={t('actions.cancel')}
      destructive
      pending={mutation.isPending}
      onConfirm={() => mutation.mutateAsync(carrier.id)}
    />
  );
}
