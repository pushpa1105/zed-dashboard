import { BellOff, Check, RotateCcw, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { EmptyState } from '@/shared/components/display/empty-state';
import { SegmentedControl } from '@/shared/components/forms/segmented-control';
import { Button } from '@/shared/ui/button';

import { useSetAlertStatus } from '../api/insights-api';
import { integer, money, percent, relativeTime } from '../lib/format';
import { ALERT_STATUSES, type Alert, type AlertMetric, type AlertStatus } from '../model/insights';

import { SeverityIcon, SeverityTag } from './alert-parts';

const METRIC_FORMAT: Record<AlertMetric, (n: number) => string> = {
  sessions: integer,
  conversionRate: (n) => percent(n, 2),
  bounceRate: (n) => percent(n),
  revenue: money,
  pageLoad: (n) => `${n.toFixed(2)} s`,
  signups: integer,
};

function AlertItem({ alert }: { alert: Alert }) {
  const { t, i18n } = useTranslation('analytics');
  const setStatus = useSetAlertStatus();
  const format = METRIC_FORMAT[alert.metric];
  const action = (status: AlertStatus) => ({
    disabled: setStatus.isPending,
    onClick: () => setStatus.mutate({ id: alert.id, status }),
  });

  return (
    <li className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-6">
      <div className="flex min-w-0 flex-1 gap-3">
        <SeverityIcon severity={alert.severity} />
        <div className="min-w-0 space-y-1">
          <p className="flex flex-wrap items-center gap-2 font-medium">
            {t(alert.change < 0 ? 'alerts.feed.drop' : 'alerts.feed.rise', {
              metric: t(`alerts.metrics.${alert.metric}`),
              change: percent(Math.abs(alert.change)),
            })}
            <SeverityTag severity={alert.severity} />
          </p>
          <p className="text-sm text-muted-foreground">
            {t('alerts.feed.versus', {
              value: format(alert.value),
              expected: format(alert.expected),
            })}{' '}
            · {alert.segment} · {relativeTime(alert.at, i18n.language)}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 gap-2 pl-12 sm:pl-0">
        {alert.status === 'open' ? (
          <>
            <Button size="sm" variant="outline" {...action('acknowledged')}>
              <Check /> {t('alerts.feed.acknowledge')}
            </Button>
            <Button size="sm" variant="ghost" {...action('muted')}>
              <BellOff /> {t('alerts.feed.mute')}
            </Button>
          </>
        ) : (
          <Button size="sm" variant="ghost" {...action('open')}>
            <RotateCcw /> {t('alerts.feed.reopen')}
          </Button>
        )}
      </div>
    </li>
  );
}

/** Detected anomalies, filtered by status, with acknowledge / mute / reopen actions. */
export function AlertFeed({ alerts }: { alerts: Alert[] }) {
  const { t } = useTranslation('analytics');
  const [status, setStatus] = useState<AlertStatus | 'all'>('open');
  const rows = alerts.filter((a) => status === 'all' || a.status === status);
  const count = (s: AlertStatus | 'all') =>
    s === 'all' ? alerts.length : alerts.filter((a) => a.status === s).length;

  return (
    <SectionCard
      flush
      title={t('alerts.feed.title')}
      description={t('alerts.feed.description')}
      action={
        <div className="scrollbar-none max-w-full overflow-x-auto">
          <SegmentedControl
            size="sm"
            value={status}
            onChange={setStatus}
            aria-label={t('alerts.feed.filter')}
            options={([...ALERT_STATUSES, 'all'] as const).map((value) => ({
              value,
              label: `${t(`alerts.status.${value}`)} (${count(value)})`,
            }))}
          />
        </div>
      }
    >
      {rows.length === 0 ? (
        <EmptyState
          variant="plain"
          icon={ShieldCheck}
          title={t('alerts.feed.empty.title')}
          description={t('alerts.feed.empty.description')}
        />
      ) : (
        <ul className="divide-y">
          {rows.map((alert) => (
            <AlertItem key={alert.id} alert={alert} />
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
