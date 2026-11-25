import { Building2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { Link } from '@/core/router/router';
import { StatStrip } from '@/shared/components/dashboard/stat-strip';
import { EmptyState } from '@/shared/components/display/empty-state';
import { ErrorState } from '@/shared/components/display/error-state';
import { SearchInput } from '@/shared/components/forms/search-input';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { customersQuery, useCustomers } from '../api/admin-api';
import { CustomerStatus, HealthMeter, PlanTag, RiskTag } from '../components/customer-badges';
import { FilterSelect } from '../components/filter-select';
import { money } from '../lib/format';
import { CHURN_RISKS, CUSTOMER_PLANS } from '../model/admin';
import { saasRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(customersQuery());
    return null;
  };

const ALL = 'all';

/** Tenant accounts with plan, revenue, seat usage, health score and churn risk. */
export default function CustomersPage() {
  const { t, i18n } = useTranslation('saas');
  const customers = useCustomers();
  const [q, setQ] = useState('');
  const [plan, setPlan] = useState(ALL);
  const [risk, setRisk] = useState(ALL);
  const all = customers.data ?? [];

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (customers.data ?? [])
      .filter(
        (c) =>
          (plan === ALL || c.plan === plan) &&
          (risk === ALL || c.churnRisk === risk) &&
          (!needle || `${c.name} ${c.domain} ${c.contact}`.toLowerCase().includes(needle)),
      )
      .sort((a, b) => b.mrr - a.mrr);
  }, [customers.data, q, plan, risk]);

  const mrr = all.reduce((sum, c) => sum + c.mrr, 0);
  const atRisk = all.filter((c) => c.churnRisk === 'high');

  return (
    <Page width="full" title={t('customers.title')} description={t('customers.description')}>
      {customers.isError ? (
        <ErrorState title={t('common.error')} onRetry={() => void customers.refetch()} />
      ) : (
        <>
          <section className="rounded-xl border bg-card px-6 py-3 shadow-xs">
            {customers.isPending ? (
              <Skeleton className="my-2 h-14" />
            ) : (
              <StatStrip
                items={[
                  { key: 'mrr', label: t('customers.stats.mrr'), value: money(mrr, i18n.language) },
                  { key: 'count', label: t('customers.stats.accounts'), value: all.length },
                  {
                    key: 'trials',
                    label: t('customers.stats.trials'),
                    value: all.filter((c) => c.status === 'trialing').length,
                  },
                  {
                    key: 'risk',
                    label: t('customers.stats.atRisk'),
                    value: atRisk.length,
                    hint: t('customers.stats.atRiskHint', {
                      amount: money(
                        atRisk.reduce((sum, c) => sum + c.mrr, 0),
                        i18n.language,
                      ),
                    }),
                  },
                ]}
              />
            )}
          </section>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <SearchInput
              value={q}
              onChange={setQ}
              placeholder={t('customers.search')}
              aria-label={t('customers.search')}
              containerClassName="sm:w-80"
            />
            <FilterSelect
              label={t('customers.col.plan')}
              value={plan}
              onChange={setPlan}
              options={[
                { value: ALL, label: t('customers.allPlans') },
                ...CUSTOMER_PLANS.map((p) => ({ value: p, label: t(`customers.plans.${p}`) })),
              ]}
            />
            <FilterSelect
              label={t('customers.col.risk')}
              value={risk}
              onChange={setRisk}
              options={[
                { value: ALL, label: t('customers.allRisks') },
                ...CHURN_RISKS.map((r) => ({ value: r, label: t(`customers.risk.${r}`) })),
              ]}
            />
          </div>

          <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
            <div className="overflow-x-auto">
              <Table aria-label={t('customers.title')}>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">{t('customers.col.customer')}</TableHead>
                    <TableHead>{t('customers.col.plan')}</TableHead>
                    <TableHead className="hidden md:table-cell">
                      {t('customers.col.status')}
                    </TableHead>
                    <TableHead className="text-right">{t('customers.col.mrr')}</TableHead>
                    <TableHead className="hidden text-right lg:table-cell">
                      {t('customers.col.seats')}
                    </TableHead>
                    <TableHead className="hidden sm:table-cell">
                      {t('customers.col.health')}
                    </TableHead>
                    <TableHead className="pr-6">{t('customers.col.risk')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.isPending
                    ? Array.from({ length: 8 }, (_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={7} className="px-6">
                            <Skeleton className="h-9" />
                          </TableCell>
                        </TableRow>
                      ))
                    : rows.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="pl-6">
                            <Link
                              to={saasRoutes.customer.href({ customerId: c.id })}
                              className="font-medium hover:underline"
                            >
                              {c.name}
                            </Link>
                            <p className="text-xs text-muted-foreground">{c.domain}</p>
                          </TableCell>
                          <TableCell>
                            <PlanTag plan={c.plan} />
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <CustomerStatus status={c.status} />
                          </TableCell>
                          <TableCell className="text-right font-medium tabular-nums">
                            {money(c.mrr, i18n.language)}
                          </TableCell>
                          <TableCell className="hidden text-right text-muted-foreground tabular-nums lg:table-cell">
                            {c.seatsUsed} / {c.seats}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <HealthMeter value={c.health} />
                          </TableCell>
                          <TableCell className="pr-6">
                            <RiskTag risk={c.churnRisk} />
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </div>
            {!customers.isPending && rows.length === 0 && (
              <EmptyState
                variant="plain"
                icon={Building2}
                title={t('customers.empty')}
                description={t('customers.emptyHint')}
                className="py-12"
              />
            )}
          </div>
        </>
      )}
    </Page>
  );
}
