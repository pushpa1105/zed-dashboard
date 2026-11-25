import { Inbox, Search } from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { DataTableBulkBar } from '@/shared/components/data-table/data-table-bulk-bar';
import { EmptyState } from '@/shared/components/display/empty-state';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Skeleton } from '@/shared/ui/skeleton';

import { leadsQuery, useLeadAction, useLeads } from '../api/crm-api';
import { FilterChips, WidgetError } from '../components/crm-parts';
import { LEAD_ACTION_ICON, LeadsTable } from '../components/leads-table';
import {
  DEAL_SOURCES,
  LEAD_ACTIONS,
  LEAD_STATUSES,
  type LeadAction,
  type LeadStatus,
} from '../model/crm';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(leadsQuery());
    return null;
  };

export default function LeadsPage() {
  const { t } = useTranslation('crm');
  const leads = useLeads();
  const act = useLeadAction();
  const [status, setStatus] = useState<LeadStatus | 'all'>('new');
  const [source, setSource] = useState('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const all = leads.data ?? [];
  const needle = query.trim().toLowerCase();
  const list = all
    .filter((l) => status === 'all' || l.status === status)
    .filter((l) => source === 'all' || l.source === source)
    .filter((l) => `${l.name} ${l.company} ${l.email}`.toLowerCase().includes(needle))
    .sort((a, b) => b.score - a.score);
  const visibleSelection = list.filter((l) => selected.has(l.id)).map((l) => l.id);

  const run = (ids: string[], action: LeadAction) =>
    act.mutate({ ids, action }, { onSuccess: () => setSelected(new Set()) });
  const changeStatus = (next: LeadStatus | 'all') => {
    setStatus(next);
    setSelected(new Set());
  };

  return (
    <Page width="full" title={t('leads.title')} description={t('leads.description')}>
      <FilterChips
        label={t('leads.filterStatus')}
        value={status}
        onChange={changeStatus}
        options={(['all', ...LEAD_STATUSES] as const).map((value) => ({
          value,
          label: value === 'all' ? t('leads.all') : t(`leads.status.${value}`),
          count: value === 'all' ? all.length : all.filter((l) => l.status === value).length,
        }))}
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('leads.search')}
            aria-label={t('leads.search')}
            className="pl-9"
          />
        </div>
        <Select value={source} onValueChange={setSource}>
          <SelectTrigger className="w-44" aria-label={t('common.source')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('leads.allSources')}</SelectItem>
            {DEAL_SOURCES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {leads.isError ? (
        <WidgetError onRetry={() => void leads.refetch()} />
      ) : !leads.data ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : list.length ? (
        <LeadsTable
          leads={list}
          selected={selected}
          onSelectedChange={setSelected}
          onAction={run}
        />
      ) : (
        <EmptyState icon={Inbox} title={t('leads.empty')} description={t('leads.emptyHint')} />
      )}

      <DataTableBulkBar
        count={visibleSelection.length}
        onClear={() => setSelected(new Set())}
        label={(count) => t('leads.selected', { count })}
        clearLabel={t('leads.clearSelection')}
      >
        {LEAD_ACTIONS.map((action) => {
          const Icon = LEAD_ACTION_ICON[action];
          return (
            <Button
              key={action}
              size="sm"
              variant="ghost"
              disabled={act.isPending}
              onClick={() => run(visibleSelection, action)}
            >
              <Icon /> {t(`leads.actions.${action}`)}
            </Button>
          );
        })}
      </DataTableBulkBar>
    </Page>
  );
}
