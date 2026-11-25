import { ShieldAlert } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { StatusBadge } from '@/shared/components/display/status-badge';
import { Button } from '@/shared/ui/button';

import { useQuarantineBatch } from '../api/stock-api';
import { qty } from '../lib/format';
import type { Batch } from '../model/stock';

const expiryTone = (daysLeft: number) =>
  daysLeft < 0 ? 'danger' : daysLeft <= 30 ? 'warning' : daysLeft <= 90 ? 'info' : 'success';

export function ExpiryBadge({ daysLeft }: { daysLeft: number }) {
  const { t } = useTranslation('inventory', { keyPrefix: 'batches.expiry' });
  return (
    <StatusBadge
      status={expiryTone(daysLeft)}
      tone={expiryTone(daysLeft)}
      label={daysLeft < 0 ? t('ago', { count: -daysLeft }) : t('left', { count: daysLeft })}
    />
  );
}

export function QuarantineButton({ batch }: { batch: Batch }) {
  const { t } = useTranslation('inventory', { keyPrefix: 'batches.quarantine' });
  const quarantine = useQuarantineBatch();
  return (
    <ConfirmDialog
      trigger={
        <Button size="sm" variant="outline" disabled={batch.status === 'quarantined'}>
          <ShieldAlert /> {t('action')}
        </Button>
      }
      title={t('title', { id: batch.id })}
      description={t('description', { quantity: qty(batch.quantity), name: batch.name })}
      confirmLabel={t('confirm')}
      cancelLabel={t('cancel')}
      destructive
      pending={quarantine.isPending}
      onConfirm={() => quarantine.mutateAsync(batch.id)}
    />
  );
}
