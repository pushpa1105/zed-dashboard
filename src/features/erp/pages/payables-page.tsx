import { Check, CircleDollarSign, FileText, Send, ShoppingCart, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { notify } from '@/core/notify/notify';
import { useSearchParams } from '@/core/router/router';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { Callout } from '@/shared/components/display/callout';
import { StatusBadge } from '@/shared/components/display/status-badge';
import { Stepper } from '@/shared/components/display/stepper';
import { cn } from '@/shared/lib/cn';
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
import { Skeleton } from '@/shared/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Textarea } from '@/shared/ui/textarea';

import { payablesQuery, usePayableAction, usePayables } from '../api/erp-api';
import { ErrorPanel } from '../components/error-panel';
import { money, shortDate } from '../lib/money';
import type { Payable, PayableAction, PayableStatus } from '../model/erp';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(payablesQuery());
    return null;
  };

type Filter = 'all' | PayableStatus;

/** Which step of draft → submitted → approved → paid the document is on. */
const stepIndex = (p: Payable) =>
  ({ draft: 0, rejected: 0, pending: 1, approved: 2, paid: 3 })[p.status];

function Detail({ doc }: { doc: Payable }) {
  const { t } = useTranslation('erp', { keyPrefix: 'payables' });
  const action = usePayableAction();
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState('');

  const run = (kind: PayableAction, extra?: { note?: string }) =>
    action.mutate(
      { id: doc.id, action: kind, ...extra },
      {
        onSuccess: () => {
          notify.success(t(`done.${kind}`, { id: doc.id }));
          setRejecting(false);
          setNote('');
        },
      },
    );

  const steps = [
    { key: 'draft', title: t('steps.draft'), description: shortDate(doc.created) },
    {
      key: 'submitted',
      title: t('steps.submitted'),
      description: doc.steps[0]?.by ?? t('steps.waiting'),
    },
    {
      key: 'approved',
      title: t('steps.approved'),
      description: doc.steps[1]?.by ?? t('steps.approver', { name: doc.approver }),
    },
    {
      key: 'paid',
      title: t('steps.paid'),
      description: doc.steps[2]?.at
        ? shortDate(doc.steps[2].at)
        : t('steps.due', { date: shortDate(doc.due) }),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            {doc.kind === 'po' ? (
              <ShoppingCart className="size-3.5" />
            ) : (
              <FileText className="size-3.5" />
            )}
            {t(`kind.${doc.kind}`)} · <span className="font-mono">{doc.id}</span>
          </p>
          <h3 className="text-lg font-semibold">{doc.description}</h3>
          <p className="text-sm text-muted-foreground">{doc.vendor}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold tracking-tight tabular-nums">{money(doc.amount)}</p>
          <StatusBadge status={doc.status} label={t(`status.${doc.status}`)} />
        </div>
      </div>

      <div className="rounded-xl border bg-muted/20 p-5">
        <Stepper
          className="hidden sm:flex"
          steps={steps}
          current={doc.status === 'paid' ? steps.length : stepIndex(doc)}
        />
        <Stepper
          className="sm:hidden"
          orientation="vertical"
          steps={steps}
          current={doc.status === 'paid' ? steps.length : stepIndex(doc)}
        />
      </div>

      {doc.status === 'rejected' && doc.note && (
        <Callout kind="danger" title={t('rejectedTitle')}>
          {doc.note}
        </Callout>
      )}

      <dl className="grid gap-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs text-muted-foreground">{t('fields.requester')}</dt>
          <dd className="mt-1 font-medium">{doc.requester}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{t('fields.approver')}</dt>
          <dd className="mt-1 font-medium">{doc.approver}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{t('fields.due')}</dt>
          <dd className="mt-1 font-medium">{shortDate(doc.due)}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-2 border-t pt-5">
        {(doc.status === 'draft' || doc.status === 'rejected') && (
          <Button disabled={action.isPending} onClick={() => run('submit')}>
            <Send /> {t('actions.submit')}
          </Button>
        )}
        {doc.status === 'pending' && (
          <>
            <Button disabled={action.isPending} onClick={() => run('approve')}>
              <Check /> {t('actions.approve')}
            </Button>
            <Button
              variant="outline"
              disabled={action.isPending}
              onClick={() => setRejecting(true)}
            >
              <X /> {t('actions.reject')}
            </Button>
          </>
        )}
        {doc.status === 'approved' && (
          <Button disabled={action.isPending} onClick={() => run('pay')}>
            <CircleDollarSign /> {t('actions.pay')}
          </Button>
        )}
        {doc.status === 'paid' && <p className="text-sm text-muted-foreground">{t('closed')}</p>}
      </div>

      <Dialog open={rejecting} onOpenChange={setRejecting}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('rejectTitle', { id: doc.id })}</DialogTitle>
            <DialogDescription>{t('rejectDescription')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="reject-note">{t('rejectNote')}</Label>
            <Textarea
              id="reject-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(false)}>
              {t('cancel')}
            </Button>
            <Button
              variant="destructive"
              disabled={!note.trim() || action.isPending}
              onClick={() => run('reject', { note: note.trim() })}
            >
              {t('actions.reject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Bills and purchase orders: a filtered queue on the left, the approval workflow on the right. */
export default function PayablesPage() {
  const { t } = useTranslation('erp', { keyPrefix: 'payables' });
  const payables = usePayables();
  const [params, setParams] = useSearchParams();
  const [filter, setFilter] = useState<Filter>('pending');
  const docs = useMemo(
    () => (payables.data ?? []).filter((d) => filter === 'all' || d.status === filter),
    [payables.data, filter],
  );
  const selectedId = params.get('doc') ?? docs[0]?.id;
  const selected = payables.data?.find((d) => d.id === selectedId) ?? docs[0];
  const count = (status: PayableStatus) =>
    payables.data?.filter((d) => d.status === status).length ?? 0;
  const pendingAmount = (payables.data ?? [])
    .filter((d) => d.status === 'pending')
    .reduce((s, d) => s + d.amount, 0);

  return (
    <Page
      title={t('title')}
      description={t('description', { amount: money(pendingAmount) })}
      width="full"
    >
      <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)}>
        <TabsList className="h-auto flex-wrap">
          {(['pending', 'approved', 'draft', 'rejected', 'paid', 'all'] as const).map((value) => (
            <TabsTrigger key={value} value={value} className="gap-1.5">
              {value === 'all' ? t('status.all') : t(`status.${value}`)}
              {value !== 'all' && (
                <span className="rounded-full bg-muted px-1.5 text-xs text-muted-foreground tabular-nums">
                  {count(value)}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {payables.isError ? (
        <ErrorPanel onRetry={() => void payables.refetch()} />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(18rem,26rem)_1fr]">
          <SectionCard flush title={t('queue', { count: docs.length })}>
            <ul className="max-h-[calc(100svh-18rem)] divide-y overflow-y-auto border-t">
              {!payables.data &&
                Array.from({ length: 6 }, (_, i) => (
                  <li key={i} className="p-4">
                    <Skeleton className="h-12 w-full" />
                  </li>
                ))}
              {docs.map((doc) => {
                const active = doc.id === selected?.id;
                return (
                  <li key={doc.id}>
                    <button
                      type="button"
                      onClick={() => setParams({ doc: doc.id }, { replace: true })}
                      aria-current={active || undefined}
                      className={cn(
                        'flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/40',
                        active && 'bg-primary/5 shadow-[inset_3px_0_0_var(--primary)]',
                      )}
                    >
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        {doc.kind === 'po' ? (
                          <ShoppingCart className="size-4" />
                        ) : (
                          <FileText className="size-4" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium">{doc.vendor}</span>
                          <span className="text-sm font-medium tabular-nums">
                            {money(doc.amount)}
                          </span>
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {doc.id} · {doc.description}
                        </span>
                        <span className="mt-2 flex items-center justify-between">
                          <StatusBadge
                            status={doc.status}
                            label={t(`status.${doc.status}`)}
                            variant="dot"
                          />
                          <span className="text-xs text-muted-foreground">
                            {shortDate(doc.created)}
                          </span>
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
              {payables.data && docs.length === 0 && (
                <li className="px-5 py-12 text-center text-sm text-muted-foreground">
                  {t('empty')}
                </li>
              )}
            </ul>
          </SectionCard>
          <SectionCard className="lg:sticky lg:top-24">
            {selected ? (
              <Detail key={selected.id} doc={selected} />
            ) : payables.data ? (
              <p className="py-16 text-center text-sm text-muted-foreground">{t('select')}</p>
            ) : (
              <Skeleton className="h-80 w-full" />
            )}
          </SectionCard>
        </div>
      )}
    </Page>
  );
}
