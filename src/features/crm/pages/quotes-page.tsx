import { CircleCheck, Hourglass, Percent, Send } from 'lucide-react';
import { useMemo } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { useNavigate, useSearchParams } from '@/core/router/router';
import { StatCard } from '@/shared/components/dashboard/stat-card';
import { DataTable } from '@/shared/components/data-table/data-table';
import { DataTableFacetedFilter } from '@/shared/components/data-table/data-table-faceted-filter';
import { DataTablePagination } from '@/shared/components/data-table/data-table-pagination';
import { DataTableToolbar } from '@/shared/components/data-table/data-table-toolbar';
import { useDataTable } from '@/shared/components/data-table/use-data-table';

import { quotesQuery, useQuotes } from '../api/quotes-api';
import { FilterChips } from '../components/crm-parts';
import { NewQuoteDialog } from '../components/new-quote-dialog';
import { useQuoteColumns } from '../components/quote-columns';
import { daysFromToday, money } from '../lib/format';
import { QUOTE_STATUSES, type Quote, type QuoteStatus } from '../model/quotes';
import { crmRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(quotesQuery());
    return null;
  };

const EMPTY: Quote[] = [];
const sum = (quotes: Quote[]) => quotes.reduce((total, q) => total + q.total, 0);

function QuoteStats({ quotes }: { quotes?: Quote[] }) {
  const { t } = useTranslation('crm');
  const list = quotes ?? EMPTY;
  const by = (status: QuoteStatus) => list.filter((q) => q.status === status);
  const sent = by('sent');
  const accepted = by('accepted');
  const decided = accepted.length + by('declined').length;
  const expiring = sent.filter((q) => daysFromToday(q.validUntil) <= 7);

  const stats = [
    {
      key: 'open',
      icon: Send,
      value: money(sum(sent), true),
      hint: t('quotes.stats.awaiting', { count: sent.length }),
    },
    {
      key: 'accepted',
      icon: CircleCheck,
      value: money(sum(accepted), true),
      hint: t('quotes.stats.quotes', { count: accepted.length }),
    },
    {
      key: 'rate',
      icon: Percent,
      value: `${decided ? Math.round((accepted.length / decided) * 100) : 0}%`,
      hint: t('quotes.stats.decided', { count: decided }),
    },
    {
      key: 'expiring',
      icon: Hourglass,
      value: expiring.length,
      hint: t('quotes.stats.expiringHint'),
    },
  ] as const;

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-4">
      {stats.map(({ key, ...stat }, i) => (
        <StatCard
          key={key}
          {...stat}
          label={t(`quotes.stats.${key}`)}
          color={`var(--chart-${i + 1})`}
          loading={!quotes}
        />
      ))}
    </div>
  );
}

export default function QuotesPage() {
  const { t } = useTranslation('crm');
  const navigate = useNavigate();
  const quotes = useQuotes();
  const [params, setParams] = useSearchParams();
  const status = QUOTE_STATUSES.find((s) => s === params.get('status')) ?? 'all';

  const all = quotes.data ?? EMPTY;
  const rows = useMemo(
    () => (status === 'all' ? all : all.filter((q) => q.status === status)),
    [all, status],
  );
  const table = useDataTable<Quote>({
    data: rows,
    columns: useQuoteColumns(),
    getRowId: (row) => row.id,
    globalFilterFn: 'includesString',
    initialState: {
      sorting: [{ id: 'createdAt', desc: true }],
      pagination: { pageIndex: 0, pageSize: 15 },
    },
  });

  const { columnFilters, globalFilter } = table.state;
  const ownerFilter = (columnFilters.find((f) => f.id === 'owner')?.value as string[]) ?? [];
  const ownerCounts = table.getColumn('owner')?.getFacetedUniqueValues();
  const owners = useMemo(() => [...new Set(all.map((q) => q.owner))].sort(), [all]);
  const filtered = table.getFilteredRowModel().rows;

  return (
    <Page
      width="full"
      title={t('quotes.title')}
      description={t('quotes.description')}
      actions={<NewQuoteDialog />}
    >
      <QuoteStats quotes={quotes.data} />

      <FilterChips
        label={t('quotes.filterStatus')}
        value={status}
        onChange={(next) => setParams(next === 'all' ? {} : { status: next })}
        options={(['all', ...QUOTE_STATUSES] as const).map((value) => ({
          value,
          label: value === 'all' ? t('leads.all') : t(`quotes.status.${value}`),
          count: value === 'all' ? all.length : all.filter((q) => q.status === value).length,
        }))}
      />

      <div className="space-y-4">
        <DataTableToolbar
          search={(globalFilter as string) ?? ''}
          onSearchChange={(value) => table.setGlobalFilter(value)}
          searchPlaceholder={t('quotes.search')}
          resetLabel={t('deals.reset')}
          onReset={() => {
            table.resetColumnFilters();
            table.setGlobalFilter('');
          }}
        >
          <DataTableFacetedFilter
            title={t('common.owner')}
            value={ownerFilter}
            onChange={(v) => table.getColumn('owner')?.setFilterValue(v.length ? v : undefined)}
            options={owners.map((o) => ({ value: o, label: o, count: ownerCounts?.get(o) ?? 0 }))}
          />
        </DataTableToolbar>
        <DataTable
          table={table}
          loading={quotes.isPending}
          error={quotes.isError ? t('error.title') : undefined}
          onRetry={() => void quotes.refetch()}
          labels={{
            retry: t('error.retry'),
            emptyTitle: t('quotes.empty'),
            emptyDescription: t('quotes.emptyHint'),
          }}
          onRowClick={(row) => void navigate(crmRoutes.quote.href({ quoteId: row.original.id }))}
          caption={t('quotes.title')}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground tabular-nums">
            {t('quotes.totals', {
              count: filtered.length,
              value: money(sum(filtered.map((r) => r.original))),
            })}
          </p>
          <DataTablePagination table={table} />
        </div>
      </div>
    </Page>
  );
}
