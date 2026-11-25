import { Ban, RotateCcw } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Link } from '@/core/router/router';
import { CopyButton } from '@/shared/components/display/copy-button';
import { DescriptionList } from '@/shared/components/display/description-list';
import { ErrorState } from '@/shared/components/display/error-state';
import { StatusBadge } from '@/shared/components/display/status-badge';
import type { Tone } from '@/shared/components/display/tone';
import { formatDate } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Progress } from '@/shared/ui/progress';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/shared/ui/sheet';
import { Skeleton } from '@/shared/ui/skeleton';

import { useGiftCard, useSetGiftCardStatus } from '../api/marketing-api';
import { formatMoney } from '../lib/money';
import type { GiftCard } from '../model/marketing';
import { ecommerceRoutes } from '../routes';

const day = (at: number) => formatDate(at, 'MMM D, YYYY');

const STATUS_TONE: Record<GiftCard['status'], Tone> = {
  active: 'success',
  redeemed: 'neutral',
  expired: 'warning',
  disabled: 'danger',
};

export function GiftCardStatusBadge({ status }: { status: GiftCard['status'] }) {
  const { t } = useTranslation('ecommerce');
  return (
    <StatusBadge
      status={status}
      tone={STATUS_TONE[status]}
      label={t(`giftCards.status.${status}`)}
    />
  );
}

export function BalanceMeter({ card }: { card: Pick<GiftCard, 'balance' | 'initialValue'> }) {
  return <Progress value={(card.balance / card.initialValue) * 100} className="h-1.5" />;
}

function StatusAction({ card }: { card: GiftCard }) {
  const { t } = useTranslation('ecommerce');
  const setStatus = useSetGiftCardStatus();
  if (card.status !== 'active' && card.status !== 'disabled') return null;
  const disable = card.status === 'active';
  return (
    <SheetFooter>
      <Button
        variant={disable ? 'outline' : 'default'}
        disabled={setStatus.isPending}
        onClick={() => setStatus.mutate({ id: card.id, status: disable ? 'disabled' : 'active' })}
      >
        {disable ? <Ban /> : <RotateCcw />}
        {t(disable ? 'giftCards.sheet.disable' : 'giftCards.sheet.enable')}
      </Button>
    </SheetFooter>
  );
}

/** Balance, recipient details and the redemption history of one gift card. */
export function GiftCardSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { t, i18n } = useTranslation('ecommerce');
  const query = useGiftCard(id);
  const card = query.data;
  const money = (n: number) => formatMoney(n, i18n.language);

  return (
    <Sheet open={!!id} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-1.5 font-mono tracking-wide">
            {card?.code ?? t('giftCards.sheet.title')}
            {card && <CopyButton value={card.code} label={t('giftCards.sheet.copy')} />}
          </SheetTitle>
          <SheetDescription>{t('giftCards.sheet.description')}</SheetDescription>
        </SheetHeader>
        <div className="space-y-6 px-4">
          {query.isError ? (
            <ErrorState title={t('common.error')} onRetry={() => void query.refetch()} />
          ) : !card ? (
            <>
              <Skeleton className="h-24 rounded-lg" />
              <Skeleton className="h-64 rounded-lg" />
            </>
          ) : (
            <>
              <div className="space-y-3 rounded-xl border bg-muted/40 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('giftCards.col.balance')}</p>
                    <p className="text-2xl font-semibold tabular-nums">{money(card.balance)}</p>
                  </div>
                  <GiftCardStatusBadge status={card.status} />
                </div>
                <BalanceMeter card={card} />
                <p className="text-xs text-muted-foreground">
                  {t('giftCards.sheet.of', { value: money(card.initialValue) })}
                </p>
              </div>
              <DescriptionList
                items={[
                  {
                    key: 'recipient',
                    term: t('giftCards.col.recipient'),
                    detail: card.recipientName,
                  },
                  { key: 'email', term: t('giftCards.sheet.email'), detail: card.recipientEmail },
                  {
                    key: 'source',
                    term: t('giftCards.sheet.source'),
                    detail: t(`giftCards.source.${card.source}`),
                  },
                  { key: 'issued', term: t('giftCards.col.issued'), detail: day(card.issuedAt) },
                  {
                    key: 'expires',
                    term: t('giftCards.col.expires'),
                    detail: card.expiresAt ? day(card.expiresAt) : t('giftCards.never'),
                  },
                  ...(card.note
                    ? [{ key: 'note', term: t('giftCards.sheet.note'), detail: card.note }]
                    : []),
                ]}
              />
              <section className="space-y-3">
                <h3 className="font-medium">{t('giftCards.sheet.history')}</h3>
                {card.redemptions.length ? (
                  <ul className="divide-y rounded-lg border">
                    {card.redemptions.map((r) => (
                      <li
                        key={r.id}
                        className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
                      >
                        <div>
                          <Link
                            to={ecommerceRoutes.order.href({ orderId: r.orderId })}
                            className="font-medium hover:underline"
                          >
                            {t('order.title', { number: r.orderNumber })}
                          </Link>
                          <p className="text-xs text-muted-foreground">{formatDate(r.at)}</p>
                        </div>
                        <span className="font-medium tabular-nums">−{money(r.amount)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">{t('giftCards.sheet.noHistory')}</p>
                )}
              </section>
            </>
          )}
        </div>
        {card && <StatusAction card={card} />}
      </SheetContent>
    </Sheet>
  );
}
