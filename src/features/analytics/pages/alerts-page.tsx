import { BellRing, CheckCheck, OctagonAlert, Plus, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { StatCard } from '@/shared/components/dashboard/stat-card';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

import { alertsQuery, rulesQuery, useAlertRules, useAlerts } from '../api/insights-api';
import { AlertFeed } from '../components/alert-feed';
import { AlertRulesCard } from '../components/alert-rules-card';
import { QueryError } from '../components/query-error';
import { RuleDialog } from '../components/rule-dialog';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await Promise.all([
      queryClient.prefetchQuery(alertsQuery()),
      queryClient.prefetchQuery(rulesQuery()),
    ]);
    return null;
  };

/** Anomaly alerts on key metrics, and the rules that raise them. */
export default function AlertsPage() {
  const { t } = useTranslation('analytics');
  const alerts = useAlerts();
  const rules = useAlertRules();
  const [creating, setCreating] = useState(false);
  const failed = (alerts.isError && !alerts.data) || (rules.isError && !rules.data);

  const open = alerts.data?.filter((a) => a.status === 'open') ?? [];

  return (
    <Page
      width="full"
      title={t('alerts.title')}
      description={t('alerts.description')}
      actions={
        <Button onClick={() => setCreating(true)}>
          <Plus /> {t('alerts.create')}
        </Button>
      }
    >
      {failed ? (
        <QueryError
          onRetry={() => {
            void alerts.refetch();
            void rules.refetch();
          }}
        />
      ) : !alerts.data || !rules.data ? (
        <div className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <div className="grid gap-6 xl:grid-cols-5">
            <Skeleton className="h-[32rem] rounded-xl xl:col-span-3" />
            <Skeleton className="h-[32rem] rounded-xl xl:col-span-2" />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={BellRing} label={t('alerts.kpis.open')} value={open.length} />
            <StatCard
              icon={OctagonAlert}
              color="var(--destructive)"
              label={t('alerts.kpis.critical')}
              value={open.filter((a) => a.severity === 'critical').length}
            />
            <StatCard
              icon={CheckCheck}
              color="var(--success)"
              label={t('alerts.kpis.acknowledged')}
              value={alerts.data.filter((a) => a.status === 'acknowledged').length}
            />
            <StatCard
              icon={SlidersHorizontal}
              color="var(--chart-2)"
              label={t('alerts.kpis.rules')}
              value={t('alerts.kpis.rulesValue', {
                active: rules.data.filter((r) => r.enabled).length,
                total: rules.data.length,
              })}
            />
          </div>
          <div className="grid items-start gap-6 xl:grid-cols-5">
            <div className="xl:col-span-3">
              <AlertFeed alerts={alerts.data} />
            </div>
            <div className="xl:col-span-2">
              <AlertRulesCard rules={rules.data} onCreate={() => setCreating(true)} />
            </div>
          </div>
        </div>
      )}
      <RuleDialog open={creating} onClose={() => setCreating(false)} />
    </Page>
  );
}
