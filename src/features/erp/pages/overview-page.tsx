import { Download } from 'lucide-react';

import { useCurrentUser } from '@/core/auth/session';
import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

import { financeOverviewQuery, useFinanceOverview } from '../finance/api/finance-api';
import { ActivityTable } from '../finance/components/activity-table';
import { FormationCard } from '../finance/components/formation-card';
import { GLASS, GLASS_BACKDROP } from '../finance/components/glass';
import { KpiRow } from '../finance/components/kpi-row';
import { SalesCard } from '../finance/components/sales-card';
import { SectionTabs } from '../finance/components/section-tabs';
import { FinanceError, FinanceSkeleton } from '../finance/components/states';
import { SuccessCard } from '../finance/components/success-card';
import { parseFinanceFilters, useFinanceFilters } from '../finance/hooks/use-finance-filters';
import { FINANCE_PERIODS, type FinancePeriod } from '../finance/model/overview';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ request }) => {
    const filters = parseFinanceFilters(new URL(request.url).searchParams);
    await queryClient.prefetchQuery(financeOverviewQuery(filters));
    return null;
  };

const partOfDay = () => {
  const hour = new Date().getHours();
  return hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
};

/**
 * Finance overview template (glass style): KPI row, cash-flow bars, company
 * formation tracker, payment success gauge and a recent-activity table.
 */
export default function FinanceDashboardPage() {
  const { t } = useTranslation('erp', { keyPrefix: 'finance' });
  const user = useCurrentUser();
  const [filters, setFilters] = useFinanceFilters();
  const overview = useFinanceOverview(filters);
  const data = overview.data;

  return (
    <div className="relative isolate min-h-full">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={GLASS_BACKDROP}
      />
      <Page
        width="full"
        title={t(`greeting.${partOfDay()}`, { name: user.firstName })}
        description={t('description')}
        actions={
          <>
            <Select
              value={filters.period}
              onValueChange={(period) => setFilters({ period: period as FinancePeriod })}
            >
              <SelectTrigger className={cn('w-36', GLASS)} aria-label={t('periods.label')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {FINANCE_PERIODS.map((period) => (
                  <SelectItem key={period} value={period}>
                    {t(`periods.${period}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" className={GLASS}>
              <Download /> {t('actions.export')}
            </Button>
          </>
        }
      >
        <SectionTabs value={filters.section} onChange={(section) => setFilters({ section })} />

        {overview.isError && !data ? (
          <FinanceError onRetry={() => void overview.refetch()} />
        ) : !data ? (
          <FinanceSkeleton />
        ) : (
          <div
            className={cn(
              'grid gap-4 transition-opacity lg:grid-cols-3',
              overview.isPlaceholderData && 'opacity-60',
            )}
          >
            <div className="min-w-0 space-y-4 lg:col-span-2">
              <KpiRow kpis={data.kpis} />
              <SalesCard sales={data.sales} />
            </div>
            <div className="min-w-0 space-y-4">
              <FormationCard formation={data.formation} />
              <SuccessCard success={data.success} />
            </div>
            <div className="min-w-0 lg:col-span-3">
              <ActivityTable rows={data.transactions} />
            </div>
          </div>
        )}
      </Page>
    </div>
  );
}
