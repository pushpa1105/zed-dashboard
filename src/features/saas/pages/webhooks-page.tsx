import { CircleCheck, CircleX, Link2, RefreshCw, Send, Webhook as WebhookIcon } from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { CodeBlock } from '@/shared/components/display/code-block';
import { CopyButton } from '@/shared/components/display/copy-button';
import { ErrorState } from '@/shared/components/display/error-state';
import { Tag } from '@/shared/components/display/tag';
import { cn } from '@/shared/lib/cn';
import { formatRelative } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { Switch } from '@/shared/ui/switch';

import {
  useDeliveries,
  useSetWebhook,
  useTestWebhook,
  useWebhooks,
  webhooksQuery,
} from '../api/platform-api';
import type { Delivery, Webhook } from '../model/platform';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(webhooksQuery());
    return null;
  };

const DELIVERY_META = {
  succeeded: { icon: CircleCheck, className: 'text-success' },
  failed: { icon: CircleX, className: 'text-destructive' },
  retrying: { icon: RefreshCw, className: 'text-[color:var(--chart-3)]' },
} as const;

function DeliveryItem({ delivery }: { delivery: Delivery }) {
  const { t } = useTranslation('saas');
  const [open, setOpen] = useState(false);
  const meta = DELIVERY_META[delivery.status];
  const Icon = meta.icon;
  return (
    <li className="relative pl-8">
      <span className="absolute top-3 left-[0.6875rem] h-full w-px bg-border" aria-hidden />
      <Icon
        className={cn('absolute top-2.5 left-0 size-6 rounded-full bg-card p-0.5', meta.className)}
      />
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-md px-2 py-2 text-left text-sm hover:bg-muted/60"
      >
        <code className="font-mono text-xs font-medium">{delivery.event}</code>
        <span className={cn('text-xs tabular-nums', meta.className)}>
          {delivery.httpStatus ?? t('webhooks.noResponse')}
        </span>
        {delivery.attempt > 1 && (
          <Tag size="sm" tone="orange" appearance="outline">
            {t('webhooks.attempt', { count: delivery.attempt })}
          </Tag>
        )}
        <span className="ml-auto text-xs text-muted-foreground tabular-nums">
          {delivery.duration} ms · {formatRelative(delivery.at)}
        </span>
      </button>
      {open && <CodeBlock code={delivery.payload} className="mt-1 mb-3" />}
    </li>
  );
}

function WebhookDetail({ webhook }: { webhook: Webhook }) {
  const { t } = useTranslation('saas');
  const deliveries = useDeliveries(webhook.id);
  const test = useTestWebhook();
  const recent = deliveries.data ?? [];
  const failures = recent.filter((d) => d.status !== 'succeeded').length;

  return (
    <SectionCard
      title={t('webhooks.detail')}
      description={webhook.description}
      action={
        <Button
          size="sm"
          variant="outline"
          disabled={test.isPending}
          onClick={() => test.mutate(webhook.id)}
        >
          <Send /> {t('webhooks.test')}
        </Button>
      }
    >
      <dl className="grid gap-4 rounded-lg border bg-muted/30 p-4 text-sm sm:grid-cols-2">
        <div className="min-w-0 sm:col-span-2">
          <dt className="text-xs text-muted-foreground">{t('webhooks.url')}</dt>
          <dd className="truncate font-mono text-xs">{webhook.url}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{t('webhooks.secret')}</dt>
          <dd className="flex items-center gap-1 font-mono text-xs">
            {webhook.secretPrefix}••••••••
            <CopyButton
              value={`${webhook.secretPrefix}xxxxxxxx`}
              label={t('webhooks.copySecret')}
            />
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{t('webhooks.recentFailures')}</dt>
          <dd className={cn('font-medium tabular-nums', failures > 0 && 'text-destructive')}>
            {failures} / {recent.length}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="mb-1.5 text-xs text-muted-foreground">{t('webhooks.events')}</dt>
          <dd className="flex flex-wrap gap-1.5">
            {webhook.events.map((event) => (
              <Tag key={event} size="sm" tone="neutral" appearance="outline" className="font-mono">
                {event}
              </Tag>
            ))}
          </dd>
        </div>
      </dl>

      <p className="mt-6 mb-2 text-sm font-medium">{t('webhooks.deliveries')}</p>
      {deliveries.isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-9" />
          ))}
        </div>
      ) : (
        <ol className="[&>li:last-child>span:first-child]:hidden">
          {recent.map((delivery) => (
            <DeliveryItem key={delivery.id} delivery={delivery} />
          ))}
        </ol>
      )}
    </SectionCard>
  );
}

/** Webhook endpoints (left) and the selected endpoint's delivery attempts (right). */
export default function WebhooksPage() {
  const { t } = useTranslation('saas');
  const webhooks = useWebhooks();
  const setWebhook = useSetWebhook();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const list = webhooks.data ?? [];
  const selected = list.find((w) => w.id === selectedId) ?? list[0];

  return (
    <Page width="full" title={t('webhooks.title')} description={t('webhooks.description')}>
      {webhooks.isError ? (
        <ErrorState title={t('common.error')} onRetry={() => void webhooks.refetch()} />
      ) : (
        <div className="grid items-start gap-6 xl:grid-cols-[24rem_1fr]">
          <ul className="space-y-3">
            {webhooks.isPending
              ? Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="h-28 rounded-xl" />
                ))
              : list.map((hook) => {
                  const active = hook.id === selected?.id;
                  return (
                    <li key={hook.id}>
                      <div
                        className={cn(
                          'rounded-xl border bg-card p-4 shadow-xs transition-colors',
                          active && 'border-primary ring-2 ring-primary/15',
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <WebhookIcon className="size-4" />
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedId(hook.id)}
                            aria-pressed={active}
                            className="min-w-0 flex-1 text-left"
                          >
                            <p className="truncate font-mono text-xs font-medium">
                              {hook.url.replace('https://', '')}
                            </p>
                            <p className="truncate text-sm text-muted-foreground">
                              {hook.description}
                            </p>
                          </button>
                          <Switch
                            checked={hook.status === 'enabled'}
                            aria-label={t('webhooks.toggle')}
                            onCheckedChange={(on) =>
                              setWebhook.mutate({
                                id: hook.id,
                                status: on ? 'enabled' : 'disabled',
                              })
                            }
                          />
                        </div>
                        <div className="mt-3 flex items-center gap-3 pl-12 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Link2 className="size-3.5" />
                            {t('webhooks.eventCount', { count: hook.events.length })}
                          </span>
                          <span
                            className={cn(
                              'tabular-nums',
                              hook.successRate < 95 ? 'text-destructive' : 'text-success',
                            )}
                          >
                            {t('webhooks.success', { rate: hook.successRate.toFixed(1) })}
                          </span>
                          <span className="ml-auto">{formatRelative(hook.lastDeliveryAt)}</span>
                        </div>
                      </div>
                    </li>
                  );
                })}
          </ul>
          {selected ? (
            <WebhookDetail webhook={selected} />
          ) : (
            <Skeleton className="h-96 rounded-xl" />
          )}
        </div>
      )}
    </Page>
  );
}
