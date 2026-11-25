import { Check, ImageIcon, X } from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { notify } from '@/core/notify/notify';
import { money, shortDate } from '@/features/erp/lib/money';
import { Callout } from '@/shared/components/display/callout';
import { StatusBadge } from '@/shared/components/display/status-badge';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/shared/ui/sheet';
import { Textarea } from '@/shared/ui/textarea';

import { useReviewClaim } from '../api/operations-api';
import type { ExpenseClaim } from '../model/operations';

/** Claim detail with receipt previews and the approve / reject decision. */
export function ClaimSheet({
  claim,
  onClose,
}: {
  claim: ExpenseClaim | undefined;
  onClose: () => void;
}) {
  const { t } = useTranslation('erp', { keyPrefix: 'expenses' });
  const review = useReviewClaim();
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState('');

  const close = () => {
    setRejecting(false);
    setNote('');
    onClose();
  };
  const decide = ({ id }: ExpenseClaim, action: 'approve' | 'reject') =>
    review.mutate(
      { id, action, note: note.trim() || undefined },
      {
        onSuccess: () => {
          notify.success(t(`done.${action}`, { id }));
          close();
        },
      },
    );

  return (
    <Sheet open={!!claim} onOpenChange={(open) => !open && close()}>
      <SheetContent className="w-full gap-0 sm:max-w-md">
        {claim && (
          <>
            <SheetHeader>
              <SheetTitle>{claim.description}</SheetTitle>
              <SheetDescription>
                <span className="font-mono">{claim.id}</span> · {claim.employee}
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 space-y-6 overflow-y-auto px-4 pb-4">
              <div className="flex items-center justify-between">
                <p className="text-3xl font-semibold tracking-tight tabular-nums">
                  {money(claim.amount)}
                </p>
                <StatusBadge status={claim.status} label={t(`status.${claim.status}`)} />
              </div>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                {(
                  [
                    ['employee', claim.employee],
                    ['department', claim.department],
                    ['category', t(`categories.${claim.category}`)],
                    ['submitted', shortDate(claim.submitted)],
                  ] as const
                ).map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-xs text-muted-foreground">{t(`fields.${key}`)}</dt>
                    <dd className="mt-1 font-medium">{value}</dd>
                  </div>
                ))}
              </dl>

              <section className="space-y-2">
                <h3 className="text-sm font-medium">{t('receipts.title')}</h3>
                {claim.receipts === 0 ? (
                  <Callout kind="warning">{t('receipts.missing')}</Callout>
                ) : (
                  <ul className="grid grid-cols-3 gap-2">
                    {Array.from({ length: claim.receipts }, (_, i) => (
                      <li
                        key={i}
                        className="flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/40 text-muted-foreground"
                      >
                        <ImageIcon className="size-5" />
                        <span className="text-xs">{t('receipts.file', { n: i + 1 })}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {claim.note && (
                <Callout kind="danger" title={t('rejectedTitle')}>
                  {claim.note}
                </Callout>
              )}

              {rejecting && (
                <div className="grid gap-2">
                  <Label htmlFor="claim-note">{t('rejectNote')}</Label>
                  <Textarea
                    id="claim-note"
                    rows={3}
                    autoFocus
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
              )}
            </div>
            {claim.status === 'pending' && (
              <SheetFooter className="flex-row justify-end border-t">
                {rejecting ? (
                  <>
                    <Button variant="outline" onClick={() => setRejecting(false)}>
                      {t('cancel')}
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={!note.trim() || review.isPending}
                      onClick={() => decide(claim, 'reject')}
                    >
                      {t('actions.confirmReject')}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => setRejecting(true)}>
                      <X /> {t('actions.reject')}
                    </Button>
                    <Button disabled={review.isPending} onClick={() => decide(claim, 'approve')}>
                      <Check /> {t('actions.approve')}
                    </Button>
                  </>
                )}
              </SheetFooter>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
