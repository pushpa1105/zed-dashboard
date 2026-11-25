import { Inbox } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { useSearchParams } from '@/core/router/router';
import { StatStrip } from '@/shared/components/dashboard/stat-strip';
import { EmptyState } from '@/shared/components/display/empty-state';
import { ErrorState } from '@/shared/components/display/error-state';
import { SearchInput } from '@/shared/components/forms/search-input';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { supportQuery, useSupport } from '../api/support-api';
import { ChipFilter } from '../components/chip-filter';
import { FilterSelect } from '../components/filter-select';
import { TicketRow } from '../components/ticket-row';
import { TicketSheet } from '../components/ticket-sheet';
import { useNow } from '../hooks/use-now';
import {
  isOverdue,
  SLA_WARNING_MS,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  UNASSIGNED,
  type Ticket,
} from '../model/support';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(supportQuery());
    return null;
  };

const ALL = 'all' as const;

const byUrgency = (a: Ticket, b: Ticket) =>
  Number(a.status === 'resolved') - Number(b.status === 'resolved') || a.slaDueAt - b.slaDueAt;

/** Customer tickets with SLA countdowns, filters and a conversation sheet. */
export default function SupportPage() {
  const { t } = useTranslation('saas');
  const support = useSupport();
  const [params, setParams] = useSearchParams();
  const status = params.get('status') ?? ALL;
  const [q, setQ] = useState('');
  const [priority, setPriority] = useState<string>(ALL);
  const [assignee, setAssignee] = useState<string>(ALL);
  const [openId, setOpenId] = useState<string | null>(null);
  const tickets = support.data?.tickets ?? [];
  const agents = support.data?.agents ?? [];
  const now = useNow();
  const active = tickets.filter((x) => x.status !== 'resolved');

  const setStatus = (value: string) =>
    setParams(
      (prev) => {
        if (value === ALL) prev.delete('status');
        else prev.set('status', value);
        return prev;
      },
      { replace: true },
    );

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (support.data?.tickets ?? [])
      .filter(
        (x) =>
          (status === ALL || x.status === status) &&
          (priority === ALL || x.priority === priority) &&
          (assignee === ALL || (x.assignee ?? UNASSIGNED) === assignee) &&
          (!needle ||
            `${x.id} ${x.subject} ${x.customer.name} ${x.customer.company}`
              .toLowerCase()
              .includes(needle)),
      )
      .sort(byUrgency);
  }, [support.data, q, status, priority, assignee]);

  return (
    <Page width="full" title={t('support.title')} description={t('support.description')}>
      {support.isError ? (
        <ErrorState title={t('common.error')} onRetry={() => void support.refetch()} />
      ) : (
        <>
          <section className="rounded-xl border bg-card px-6 py-3 shadow-xs">
            {support.isPending ? (
              <Skeleton className="my-2 h-14" />
            ) : (
              <StatStrip
                items={[
                  { key: 'active', label: t('support.stats.active'), value: active.length },
                  {
                    key: 'overdue',
                    label: t('support.stats.overdue'),
                    value: active.filter((x) => isOverdue(x, now)).length,
                  },
                  {
                    key: 'soon',
                    label: t('support.stats.soon'),
                    value: active.filter(
                      (x) => x.slaDueAt >= now && x.slaDueAt - now < SLA_WARNING_MS,
                    ).length,
                  },
                  {
                    key: 'unassigned',
                    label: t('support.stats.unassigned'),
                    value: active.filter((x) => !x.assignee).length,
                  },
                ]}
              />
            )}
          </section>

          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <SearchInput
              value={q}
              onChange={setQ}
              placeholder={t('support.search')}
              aria-label={t('support.search')}
              containerClassName="lg:w-72"
            />
            <ChipFilter
              label={t('support.col.status')}
              value={status}
              onChange={setStatus}
              options={[ALL, ...TICKET_STATUSES].map((s) => ({
                value: s,
                label: t(`support.status.${s}`),
                count: s === ALL ? tickets.length : tickets.filter((x) => x.status === s).length,
              }))}
            />
            <FilterSelect
              label={t('support.col.priority')}
              value={priority}
              onChange={setPriority}
              options={[ALL, ...TICKET_PRIORITIES].map((p) => ({
                value: p,
                label: t(`support.priority.${p}`),
              }))}
            />
            <FilterSelect
              label={t('support.col.assignee')}
              value={assignee}
              onChange={setAssignee}
              options={[
                { value: ALL, label: t('support.allAssignees') },
                { value: UNASSIGNED, label: t('support.unassigned') },
                ...agents.map((a) => ({ value: a, label: a })),
              ]}
            />
          </div>

          <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
            <div className="overflow-x-auto">
              <Table aria-label={t('support.title')}>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">{t('support.col.ticket')}</TableHead>
                    <TableHead>{t('support.col.priority')}</TableHead>
                    <TableHead className="hidden md:table-cell">
                      {t('support.col.status')}
                    </TableHead>
                    <TableHead>{t('support.col.sla')}</TableHead>
                    <TableHead className="hidden lg:table-cell">
                      {t('support.col.assignee')}
                    </TableHead>
                    <TableHead className="hidden pr-6 xl:table-cell">
                      {t('support.col.updated')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {support.isPending
                    ? Array.from({ length: 8 }, (_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={6} className="px-6">
                            <Skeleton className="h-9" />
                          </TableCell>
                        </TableRow>
                      ))
                    : rows.map((x) => (
                        <TicketRow key={x.id} ticket={x} onOpen={() => setOpenId(x.id)} />
                      ))}
                </TableBody>
              </Table>
            </div>
            {!support.isPending && rows.length === 0 && (
              <EmptyState
                variant="plain"
                icon={Inbox}
                title={t('support.empty')}
                description={t('support.emptyHint')}
                className="py-12"
              />
            )}
          </div>
        </>
      )}

      <TicketSheet
        ticket={tickets.find((x) => x.id === openId) ?? null}
        agents={agents}
        onClose={() => setOpenId(null)}
      />
    </Page>
  );
}
