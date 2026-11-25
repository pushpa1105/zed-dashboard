import { useTranslation } from '@/core/i18n/use-translation';
import { AreaChart } from '@/shared/components/charts/area-chart';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { formatDate } from '@/shared/lib/format';
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group';

import { SAAS_RANGES, type SaasOverview, type SaasRange } from '../model/overview';

export function ApiCallsCard({
  data,
  range,
  onRangeChange,
}: {
  data: SaasOverview;
  range: SaasRange;
  onRangeChange: (range: SaasRange) => void;
}) {
  const { t } = useTranslation('saas', { keyPrefix: 'overview' });
  const points = data.apiCalls.map((p) => ({
    time: formatDate(p.at, range === '7d' ? 'ddd D' : 'h:mm A'),
    calls: p.calls,
  }));

  return (
    <SectionCard
      title={t('apiCalls.title', { range: t(`range.${range}`) })}
      action={
        <ToggleGroup
          type="single"
          size="sm"
          variant="outline"
          spacing={0}
          value={range}
          onValueChange={(value) => value && onRangeChange(value as SaasRange)}
          aria-label={t('range.label')}
        >
          {SAAS_RANGES.map((r) => (
            <ToggleGroupItem key={r} value={r} className="px-2.5 text-xs">
              {r}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      }
    >
      <dl className="mb-2 flex gap-8 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">{t('apiCalls.p95')}</dt>
          <dd className="font-semibold tabular-nums">{data.latencyP95} ms</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{t('apiCalls.errorRate')}</dt>
          <dd className="font-semibold tabular-nums">{data.errorRate.toFixed(2)}%</dd>
        </div>
      </dl>
      <AreaChart
        data={points}
        xKey="time"
        series={[{ key: 'calls', label: t('apiCalls.calls') }]}
        className="h-64"
      />
    </SectionCard>
  );
}
