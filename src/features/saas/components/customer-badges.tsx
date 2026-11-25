import { useTranslation } from '@/core/i18n/use-translation';
import { StatusBadge } from '@/shared/components/display/status-badge';
import { Tag } from '@/shared/components/display/tag';
import type { Tone } from '@/shared/components/display/tone';
import { cn } from '@/shared/lib/cn';

import type { ChurnRisk, Customer, CustomerPlan } from '../model/admin';

const PLAN_TONE: Record<CustomerPlan, Tone> = {
  hobby: 'neutral',
  teams: 'blue',
  scale: 'violet',
  enterprise: 'primary',
};
const RISK_TONE: Record<ChurnRisk, Tone> = { low: 'success', medium: 'warning', high: 'danger' };
const STATUS_TONE: Record<Customer['status'], Tone> = {
  active: 'success',
  trialing: 'info',
  past_due: 'danger',
};

export function PlanTag({ plan }: { plan: CustomerPlan }) {
  const { t } = useTranslation('saas');
  return <Tag tone={PLAN_TONE[plan]}>{t(`customers.plans.${plan}`)}</Tag>;
}

export function RiskTag({ risk }: { risk: ChurnRisk }) {
  const { t } = useTranslation('saas');
  return (
    <Tag tone={RISK_TONE[risk]} dot>
      {t(`customers.risk.${risk}`)}
    </Tag>
  );
}

export function CustomerStatus({ status }: { status: Customer['status'] }) {
  const { t } = useTranslation('saas');
  return (
    <StatusBadge
      status={status}
      tone={STATUS_TONE[status]}
      label={t(`customers.status.${status}`)}
    />
  );
}

/** Health score 0–100 as a short bar; the number is always shown next to it. */
export function HealthMeter({ value, className }: { value: number; className?: string }) {
  const { t } = useTranslation('saas');
  const color = value >= 70 ? 'bg-success' : value >= 45 ? 'bg-warning' : 'bg-destructive';
  return (
    <div
      className={cn('flex items-center gap-2', className)}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      aria-label={t('customers.col.health')}
    >
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${value}%` }} />
      </div>
      <span className="text-sm tabular-nums">{value}</span>
    </div>
  );
}
