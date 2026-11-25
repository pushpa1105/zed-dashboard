import { ChevronRight, Plus } from 'lucide-react';
import { Fragment, useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { Link, useSearchParams } from '@/core/router/router';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatusBadge } from '@/shared/components/display/status-badge';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';

import { journalQuery, useJournal } from '../api/erp-api';
import { ErrorPanel } from '../components/error-panel';
import { money, shortDate } from '../lib/money';
import type { JournalEntry } from '../model/erp';
import { erpRoutes } from '../routes';

type StatusFilter = 'all' | 'posted' | 'draft';
const parseStatus = (value: string | null): StatusFilter =>
  value === 'posted' || value === 'draft' ? value : 'all';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ request }) => {
    const status = parseStatus(new URL(request.url).searchParams.get('status'));
    await queryClient.prefetchQuery(journalQuery(status === 'all' ? undefined : status));
    return null;
  };

const entryTotal = (entry: JournalEntry) => entry.lines.reduce((s, l) => s + l.debit, 0);

/** Journal entries: filterable list where each entry expands into its debit/credit lines. */
export default function JournalPage() {
  const { t } = useTranslation('erp', { keyPrefix: 'journal' });
  const [params, setParams] = useSearchParams();
  const status = parseStatus(params.get('status'));
  const journal = useJournal(status === 'all' ? undefined : status);
  const [open, setOpen] = useState<string | null>(null);

  return (
    <Page
      title={t('title')}
      description={t('description')}
      width="full"
      actions={
        <Button asChild>
          <Link to={erpRoutes.journalNew.href()}>
            <Plus /> {t('newEntry')}
          </Link>
        </Button>
      }
    >
      <SectionCard
        flush
        title={t('list.title')}
        description={t('list.description')}
        action={
          <Tabs
            value={status}
            onValueChange={(value) =>
              setParams(value === 'all' ? {} : { status: value }, { replace: true })
            }
          >
            <TabsList>
              <TabsTrigger value="all">{t('filters.all')}</TabsTrigger>
              <TabsTrigger value="posted">{t('filters.posted')}</TabsTrigger>
              <TabsTrigger value="draft">{t('filters.draft')}</TabsTrigger>
            </TabsList>
          </Tabs>
        }
      >
        {journal.isError ? (
          <ErrorPanel className="m-6" onRetry={() => void journal.refetch()} />
        ) : !journal.data ? (
          <div className="space-y-2 px-6 pb-6">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className={cn('overflow-x-auto', journal.isPlaceholderData && 'opacity-60')}>
            <table className="w-full min-w-[820px] text-sm" aria-label={t('list.title')}>
              <thead>
                <tr className="border-y bg-muted/30 text-xs text-muted-foreground">
                  <th className="h-11 w-10 pl-4" />
                  <th className="px-3 text-left font-medium">{t('columns.entry')}</th>
                  <th className="px-3 text-left font-medium">{t('columns.date')}</th>
                  <th className="px-3 text-left font-medium">{t('columns.memo')}</th>
                  <th className="px-3 text-left font-medium">{t('columns.author')}</th>
                  <th className="px-3 text-left font-medium">{t('columns.status')}</th>
                  <th className="px-6 text-right font-medium">{t('columns.amount')}</th>
                </tr>
              </thead>
              <tbody>
                {journal.data.map((entry) => {
                  const expanded = open === entry.id;
                  return (
                    <Fragment key={entry.id}>
                      <tr
                        className="cursor-pointer border-b hover:bg-muted/40"
                        onClick={() => setOpen(expanded ? null : entry.id)}
                      >
                        <td className="pl-4">
                          <ChevronRight
                            aria-hidden
                            className={cn(
                              'size-4 text-muted-foreground transition-transform',
                              expanded && 'rotate-90',
                            )}
                          />
                        </td>
                        <td className="px-3 py-3">
                          <button
                            type="button"
                            aria-expanded={expanded}
                            className="font-mono text-xs font-medium"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpen(expanded ? null : entry.id);
                            }}
                          >
                            {entry.id}
                          </button>
                          <p className="text-xs text-muted-foreground">{entry.reference}</p>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-muted-foreground">
                          {shortDate(entry.date)}
                        </td>
                        <td className="max-w-80 truncate px-3 py-3">{entry.memo}</td>
                        <td className="px-3 py-3 text-muted-foreground">{entry.author}</td>
                        <td className="px-3 py-3">
                          <StatusBadge status={entry.status} label={t(`filters.${entry.status}`)} />
                        </td>
                        <td className="px-6 py-3 text-right font-medium tabular-nums">
                          {money(entryTotal(entry))}
                        </td>
                      </tr>
                      {expanded && (
                        <tr className="border-b bg-muted/20">
                          <td />
                          <td colSpan={6} className="px-3 py-4 pr-6">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-xs text-muted-foreground">
                                  <th className="pb-2 text-left font-medium">
                                    {t('columns.account')}
                                  </th>
                                  <th className="w-36 pb-2 text-right font-medium">
                                    {t('columns.debit')}
                                  </th>
                                  <th className="w-36 pb-2 text-right font-medium">
                                    {t('columns.credit')}
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {entry.lines.map((line, i) => (
                                  <tr key={i} className="border-t border-dashed">
                                    <td className={cn('py-2', line.credit > 0 && 'pl-8')}>
                                      <span className="mr-2 font-mono text-xs text-muted-foreground">
                                        {line.account}
                                      </span>
                                      {line.accountName}
                                    </td>
                                    <td className="py-2 text-right tabular-nums">
                                      {line.debit ? money(line.debit) : ''}
                                    </td>
                                    <td className="py-2 text-right tabular-nums">
                                      {line.credit ? money(line.credit) : ''}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
                {journal.data.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      {t('list.empty')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </Page>
  );
}
