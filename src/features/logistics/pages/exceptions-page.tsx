import {
  ArrowUpRight,
  CheckCircle2,
  ChevronsUp,
  Lightbulb,
  MapPin,
  PartyPopper,
  UserRoundCheck,
} from 'lucide-react';
import { useState } from 'react';

import { useCurrentUser } from '@/core/auth/session';
import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { notify } from '@/core/notify/notify';
import { Link } from '@/core/router/router';
import { EmptyState } from '@/shared/components/display/empty-state';
import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';

import { exceptionsQuery, useExceptions, useUpdateException } from '../api/logistics-api';
import { SeverityBadge } from '../components/badges';
import { LoadError } from '../components/query-state';
import { fmtAgo, fmtDateTime } from '../lib/format';
import { SEVERITIES, type Severity, type ShipmentException } from '../model/logistics';
import { logisticsRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(exceptionsQuery());
    return null;
  };

const RANK: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };

function Detail({ item }: { item: ShipmentException }) {
  const { t } = useTranslation('logistics');
  const user = useCurrentUser();
  const me = `${user.firstName} ${user.lastName}`;
  const update = useUpdateException();
  const [done, setDone] = useState<Set<number>>(new Set());

  const act = (action: 'resolve' | 'assign' | 'escalate') =>
    update.mutate(
      { id: item.id, action, owner: me },
      { onSuccess: () => notify.success(t(`exceptions.toast.${action}`, { id: item.id })) },
    );

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-4 border-b p-6">
        <div className="flex flex-wrap items-center gap-2">
          <SeverityBadge severity={item.severity} />
          <span className="text-xs text-muted-foreground">
            {t(`exceptions.type.${item.type}`)} · {item.id}
          </span>
          {item.escalated && (
            <span className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-1.5 py-0.5 text-xs font-medium text-destructive">
              <ChevronsUp className="size-3.5" /> {t('exceptions.escalated')}
            </span>
          )}
        </div>
        <h2 className="text-lg leading-snug font-semibold">{item.title}</h2>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
          <Link
            to={logisticsRoutes.shipment.href({ shipmentId: item.shipmentId })}
            className="inline-flex items-center gap-1 font-medium text-foreground hover:text-primary"
          >
            {item.shipmentId} <ArrowUpRight className="size-3.5" />
          </Link>
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" /> {item.location}
          </span>
          <span>{t('exceptions.opened', { when: fmtDateTime(item.openedAt) })}</span>
        </div>
      </div>

      <div className="flex-1 space-y-6 p-6">
        <p className="text-sm leading-relaxed">{item.description}</p>

        <div className="space-y-3">
          <p className="flex items-center gap-2 text-sm font-medium">
            <Lightbulb className="size-4 text-warning" /> {t('exceptions.playbook')}
          </p>
          <ul className="space-y-2">
            {item.suggestions.map((s, i) => {
              const checked = done.has(i);
              return (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() =>
                      setDone((prev) => {
                        const next = new Set(prev);
                        if (next.has(i)) next.delete(i);
                        else next.add(i);
                        return next;
                      })
                    }
                    className="flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/50"
                    aria-pressed={checked}
                  >
                    <CheckCircle2
                      className={cn(
                        'size-4 shrink-0',
                        checked ? 'text-success' : 'text-muted-foreground/40',
                      )}
                    />
                    <span className={cn(checked && 'text-muted-foreground line-through')}>{s}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3 text-sm">
          {item.owner ? (
            <>
              <InitialsAvatar name={item.owner} size="sm" />
              <span>
                {t('exceptions.ownedBy')} <span className="font-medium">{item.owner}</span>
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">{t('exceptions.unassigned')}</span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2 border-t p-4">
        <Button
          variant="outline"
          disabled={update.isPending || item.owner === me}
          onClick={() => act('assign')}
        >
          <UserRoundCheck /> {t('exceptions.assignMe')}
        </Button>
        <Button
          variant="outline"
          disabled={update.isPending || item.severity === 'critical'}
          onClick={() => act('escalate')}
        >
          <ChevronsUp /> {t('exceptions.escalate')}
        </Button>
        <Button disabled={update.isPending} onClick={() => act('resolve')}>
          <CheckCircle2 /> {t('exceptions.resolve')}
        </Button>
      </div>
    </div>
  );
}

export default function ExceptionsPage() {
  const { t } = useTranslation('logistics');
  const query = useExceptions();
  const [severity, setSeverity] = useState<'all' | Severity>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const items = [...(query.data ?? [])].sort(
    (a, b) => RANK[a.severity] - RANK[b.severity] || b.openedAt.localeCompare(a.openedAt),
  );
  const visible = severity === 'all' ? items : items.filter((i) => i.severity === severity);
  const selected = visible.find((i) => i.id === selectedId) ?? visible[0];
  const count = (s: Severity) => items.filter((i) => i.severity === s).length;

  return (
    <Page title={t('exceptions.title')} description={t('exceptions.description')} width="full">
      {query.isError ? (
        <LoadError onRetry={() => void query.refetch()} />
      ) : (
        <div className="space-y-4">
          <Tabs value={severity} onValueChange={(v) => setSeverity(v as typeof severity)}>
            <TabsList className="h-auto flex-wrap">
              <TabsTrigger value="all">
                {t('exceptions.all')}
                <span className="text-xs text-muted-foreground tabular-nums">{items.length}</span>
              </TabsTrigger>
              {SEVERITIES.map((s) => (
                <TabsTrigger key={s} value={s}>
                  {t(`severity.${s}`)}
                  <span className="text-xs text-muted-foreground tabular-nums">{count(s)}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="grid min-h-[34rem] overflow-hidden rounded-xl border bg-card shadow-xs lg:grid-cols-[22rem_1fr]">
            <div className="border-b lg:border-r lg:border-b-0">
              {query.isPending ? (
                <div className="space-y-2 p-3">
                  {Array.from({ length: 6 }, (_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : visible.length === 0 ? (
                <EmptyState
                  variant="plain"
                  icon={PartyPopper}
                  title={t('exceptions.emptyTitle')}
                  description={t('exceptions.emptyDescription')}
                  className="py-16"
                />
              ) : (
                <ul
                  className="max-h-[40rem] divide-y overflow-y-auto"
                  role="listbox"
                  aria-label={t('exceptions.title')}
                >
                  {visible.map((item) => {
                    const active = item.id === selected?.id;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={active}
                          onClick={() => setSelectedId(item.id)}
                          className={cn(
                            'relative w-full space-y-1.5 px-4 py-3.5 text-left transition-colors hover:bg-muted/50',
                            active && 'bg-accent/60 hover:bg-accent/60',
                          )}
                        >
                          {active && (
                            <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary" />
                          )}
                          <div className="flex items-center justify-between gap-2">
                            <SeverityBadge severity={item.severity} />
                            <span className="text-xs text-muted-foreground">
                              {fmtAgo(item.openedAt)}
                            </span>
                          </div>
                          <p className="line-clamp-2 text-sm font-medium">{item.title}</p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {item.shipmentId}
                          </p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div className="min-w-0">
              {selected ? (
                <Detail key={selected.id} item={selected} />
              ) : (
                !query.isPending && (
                  <EmptyState
                    variant="plain"
                    icon={CheckCircle2}
                    title={t('exceptions.nothingSelected')}
                    className="h-full py-24"
                  />
                )
              )}
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}
