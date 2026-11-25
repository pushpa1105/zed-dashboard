import { useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { CurrencyInput } from '@/shared/components/forms/currency-input';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Label } from '@/shared/ui/label';

import { useIssueCredit } from '../api/partners-api';
import { fmtCurrency } from '../lib/format';
import { suggestedCredit, type Breach } from '../model/slas';

function CreditForm({ breach, onClose }: { breach: Breach; onClose: () => void }) {
  const { t, i18n } = useTranslation('logistics');
  const [amount, setAmount] = useState<number | null>(suggestedCredit(breach));
  const issue = useIssueCredit();
  const valid = amount !== null && amount > 0 && amount <= breach.freightCharge;
  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('slas.credit.title', { customer: breach.customer })}</DialogTitle>
        <DialogDescription>
          {t('slas.credit.description', {
            shipment: breach.shipmentId,
            charge: fmtCurrency(breach.freightCharge, i18n.language),
          })}
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-2">
        <Label htmlFor="credit-amount">{t('slas.credit.amount')}</Label>
        <CurrencyInput
          id="credit-amount"
          currency="EUR"
          locale={i18n.language}
          value={amount}
          onChange={setAmount}
          max={breach.freightCharge}
          invalid={!valid}
        />
        <p className="text-xs text-muted-foreground">{t('slas.credit.hint')}</p>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          {t('actions.cancel')}
        </Button>
        <Button
          disabled={!valid || issue.isPending}
          onClick={() => issue.mutate({ id: breach.id, amount: amount! }, { onSuccess: onClose })}
        >
          {t('slas.credit.issue')}
        </Button>
      </DialogFooter>
    </>
  );
}

export function CreditNoteDialog({
  breach,
  onClose,
}: {
  breach: Breach | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={breach !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {breach && <CreditForm key={breach.id} breach={breach} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}
