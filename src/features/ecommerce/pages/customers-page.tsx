import { Search } from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { Link, useNavigate, useSearchParams } from '@/core/router/router';
import { StatStrip } from '@/shared/components/dashboard/stat-strip';
import { EmptyState } from '@/shared/components/display/empty-state';
import { ErrorState } from '@/shared/components/display/error-state';
import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { Tag } from '@/shared/components/display/tag';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { cn } from '@/shared/lib/cn';
import { formatRelative } from '@/shared/lib/format';
import { Input } from '@/shared/ui/input';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { customersQuery, useCustomers } from '../api/store-api';
import { formatMoney } from '../lib/money';
import { SEGMENT_TONE, SEGMENTS, type Segment } from '../model/store';
import { ecommerceRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ request }) => {
    const q = new URL(request.url).searchParams.get('q') ?? '';
    await queryClient.prefetchQuery(customersQuery(q, 'all'));
    return null;
  };

/** Customer list with segment chips, search and a profile sheet. */
export default function CustomersPage() {
  const { t, i18n } = useTranslation('ecommerce');
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const query = useDebounce(q, 250);
  const segment = (SEGMENTS as readonly string[]).includes(params.get('segment') ?? '')
    ? (params.get('segment') as Segment)
    : 'all';
  const customers = useCustomers(query, segment);
  const navigate = useNavigate();
  const profile = (customerId: string) => ecommerceRoutes.customer.href({ customerId });
  const rows = customers.data?.data ?? [];
  const seg = customers.data?.segments ?? {};
  const totalSpent = rows.reduce((s, c) => s + c.spent, 0);

  return (
    <Page width="full" title={t('customers.title')} description={t('customers.description')}>
      <div className="rounded-xl border bg-card px-6 py-2">
        <StatStrip
          items={[
            {
              key: 'total',
              label: t('customers.stats.total'),
              value: (seg.all ?? 0).toLocaleString(),
              hint: t('customers.stats.totalHint'),
            },
            {
              key: 'vip',
              label: t('segments.vip'),
              value: (seg.vip ?? 0).toLocaleString(),
              hint: t('customers.stats.vipHint'),
            },
            {
              key: 'risk',
              label: t('segments.at_risk'),
              value: (seg.at_risk ?? 0).toLocaleString(),
              hint: t('customers.stats.riskHint'),
            },
            {
              key: 'ltv',
              label: t('customers.stats.ltv'),
              value: formatMoney(totalSpent / Math.max(1, rows.length), i18n.language, 0),
              hint: t('customers.stats.ltvHint'),
            },
          ]}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2" role="toolbar" aria-label={t('customers.segments')}>
          {SEGMENTS.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={segment === s}
              onClick={() =>
                setParams((prev) => {
                  const next = new URLSearchParams(prev);
                  if (s === 'all') next.delete('segment');
                  else next.set('segment', s);
                  return next;
                })
              }
              className={cn(
                'inline-flex h-8 items-center gap-2 rounded-full border px-3 text-sm transition-colors hover:bg-accent',
                segment === s &&
                  'border-primary bg-primary/10 font-medium text-primary hover:bg-primary/15',
              )}
            >
              {s === 'all' ? t('customers.all') : t(`segments.${s}`)}
              <span className="text-xs text-muted-foreground tabular-nums">{seg[s] ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="relative ml-auto w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('customers.search')}
            aria-label={t('customers.search')}
            className="pl-9"
          />
        </div>
      </div>

      {customers.isError ? (
        <ErrorState title={t('common.error')} onRetry={() => void customers.refetch()} />
      ) : (
        <div
          className={cn(
            'overflow-hidden rounded-xl border bg-card',
            customers.isPlaceholderData && 'opacity-70',
          )}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">{t('customers.col.customer')}</TableHead>
                <TableHead>{t('customers.col.segment')}</TableHead>
                <TableHead className="hidden md:table-cell">
                  {t('customers.col.location')}
                </TableHead>
                <TableHead className="text-right">{t('customers.col.orders')}</TableHead>
                <TableHead className="text-right">{t('customers.col.spent')}</TableHead>
                <TableHead className="hidden pr-6 lg:table-cell">
                  {t('customers.col.lastOrder')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.isPending
                ? Array.from({ length: 8 }, (_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6} className="px-6">
                        <Skeleton className="h-8" />
                      </TableCell>
                    </TableRow>
                  ))
                : rows.slice(0, 60).map((c) => (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer"
                      onClick={() => void navigate(profile(c.id))}
                    >
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <InitialsAvatar name={c.name} size="sm" />
                          <div className="min-w-0 leading-tight">
                            <Link
                              to={profile(c.id)}
                              className="block truncate font-medium hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {c.name}
                            </Link>
                            <p className="truncate text-xs text-muted-foreground">{c.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Tag size="sm" tone={SEGMENT_TONE[c.segment]}>
                          {t(`segments.${c.segment}`)}
                        </Tag>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {c.city}, {c.country}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{c.orders}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatMoney(c.spent, i18n.language)}
                      </TableCell>
                      <TableCell className="hidden pr-6 text-muted-foreground lg:table-cell">
                        {formatRelative(c.lastOrderAt)}
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
          {!customers.isPending && rows.length === 0 && (
            <EmptyState
              variant="plain"
              icon={Search}
              title={t('customers.empty')}
              className="py-12"
            />
          )}
          {rows.length > 60 && (
            <p className="border-t px-6 py-3 text-xs text-muted-foreground">
              {t('customers.truncated', { shown: 60, total: rows.length })}
            </p>
          )}
        </div>
      )}
    </Page>
  );
}
