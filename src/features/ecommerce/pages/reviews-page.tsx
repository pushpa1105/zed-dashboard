import { BadgeCheck, Check, MessageSquareOff, Star, X } from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { notify } from '@/core/notify/notify';
import { Link } from '@/core/router/router';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { EmptyState } from '@/shared/components/display/empty-state';
import { ErrorState } from '@/shared/components/display/error-state';
import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { Tag } from '@/shared/components/display/tag';
import { cn } from '@/shared/lib/cn';
import { formatRelative } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

import { reviewsQuery, useModerateReview, useReviews } from '../api/store-api';
import { CountTabs } from '../components/count-tabs';
import { REVIEW_TABS, type Review, type ReviewTab } from '../model/store';
import { ecommerceRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(reviewsQuery('pending'));
    return null;
  };

function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn('inline-flex gap-0.5', className)} aria-label={`${value} / 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            'size-3.5',
            i < Math.round(value) ? 'fill-warning text-warning' : 'text-muted-foreground/30',
          )}
        />
      ))}
    </span>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const { t } = useTranslation('ecommerce');
  const moderate = useModerateReview();
  const act = (status: 'approved' | 'rejected') =>
    moderate.mutate(
      { id: review.id, status },
      {
        onSuccess: () =>
          notify.undoable(
            t(status === 'approved' ? 'reviews.toast.approved' : 'reviews.toast.rejected', {
              author: review.author,
            }),
            () => moderate.mutate({ id: review.id, status: 'pending' }),
            { undoLabel: t('reviews.undo') },
          ),
      },
    );

  return (
    <li className="flex gap-4 px-6 py-5">
      <InitialsAvatar name={review.author} size="sm" className="mt-0.5" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="text-sm font-medium">{review.author}</p>
          {review.verified && (
            <span className="inline-flex items-center gap-1 text-xs text-success">
              <BadgeCheck className="size-3.5" /> {t('reviews.verified')}
            </span>
          )}
          <span className="text-xs text-muted-foreground">{formatRelative(review.createdAt)}</span>
          {review.status !== 'pending' && (
            <Tag
              size="sm"
              tone={review.status === 'approved' ? 'success' : 'danger'}
              className="ml-auto"
            >
              {t(`reviews.tabs.${review.status}`)}
            </Tag>
          )}
        </div>
        <Stars value={review.rating} />
        <p className="text-sm font-medium">{review.title}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{review.body}</p>
        <p className="text-xs text-muted-foreground">
          {t('reviews.on')}{' '}
          <Link
            to={ecommerceRoutes.product.href({ productId: review.productId })}
            className="font-medium text-foreground hover:underline"
          >
            {review.productName}
          </Link>
        </p>
      </div>
      {review.status === 'pending' && (
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-start">
          <Button
            size="sm"
            variant="outline"
            disabled={moderate.isPending}
            onClick={() => act('rejected')}
          >
            <X /> {t('reviews.reject')}
          </Button>
          <Button size="sm" disabled={moderate.isPending} onClick={() => act('approved')}>
            <Check /> {t('reviews.approve')}
          </Button>
        </div>
      )}
    </li>
  );
}

/** Review moderation: rating overview on the side, approve/reject queue with undo. */
export default function ReviewsPage() {
  const { t } = useTranslation('ecommerce');
  const [tab, setTab] = useState<ReviewTab>('pending');
  const reviews = useReviews(tab);
  const data = reviews.data;
  const maxBucket = Math.max(1, ...(data?.distribution.map((d) => d.count) ?? [1]));

  return (
    <Page width="full" title={t('reviews.title')} description={t('reviews.description')}>
      <div className="grid items-start gap-6 lg:grid-cols-[20rem_1fr]">
        <SectionCard title={t('reviews.summary')} className="lg:sticky lg:top-24">
          {data ? (
            <>
              <div className="flex items-end gap-3">
                <span className="text-5xl font-semibold tracking-tight tabular-nums">
                  {data.average.toFixed(1)}
                </span>
                <div className="pb-1.5">
                  <Stars value={data.average} />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('reviews.basedOn', { count: data.counts.approved })}
                  </p>
                </div>
              </div>
              <ul className="mt-6 space-y-2.5">
                {data.distribution.map((d) => (
                  <li key={d.stars} className="flex items-center gap-3 text-sm">
                    <span className="w-8 text-muted-foreground tabular-nums">{d.stars}★</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <span
                        className="block h-full rounded-full bg-warning"
                        style={{ width: `${(d.count / maxBucket) * 100}%` }}
                      />
                    </span>
                    <span className="w-6 text-right text-xs text-muted-foreground tabular-nums">
                      {d.count}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <Skeleton className="h-48" />
          )}
        </SectionCard>

        <div className="min-w-0 overflow-hidden rounded-xl border bg-card shadow-xs">
          <CountTabs
            className="px-6"
            value={tab}
            onChange={setTab}
            tabs={REVIEW_TABS.map((value) => ({
              value,
              label: t(`reviews.tabs.${value}`),
              count: data?.counts[value],
            }))}
          />
          {reviews.isError ? (
            <div className="p-6">
              <ErrorState title={t('common.error')} onRetry={() => void reviews.refetch()} />
            </div>
          ) : !data ? (
            <div className="space-y-4 p-6">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-28" />
              ))}
            </div>
          ) : data.data.length === 0 ? (
            <EmptyState
              variant="plain"
              icon={MessageSquareOff}
              title={t('reviews.empty.title')}
              description={t('reviews.empty.description')}
              className="py-16"
            />
          ) : (
            <ul className={cn('divide-y', reviews.isPlaceholderData && 'opacity-70')}>
              {data.data.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </Page>
  );
}
