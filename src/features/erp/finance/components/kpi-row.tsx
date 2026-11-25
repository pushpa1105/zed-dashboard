import { CreditCard, FileQuestion, Landmark, Users, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { TrendBadge } from '@/shared/components/dashboard/trend-badge';
import { cn } from '@/shared/lib/cn';

import { count, money, moneyWhole } from '../lib/format';
import type { FinanceOverview } from '../model/overview';

import { GLASS } from './glass';

function Kpi({
  icon: Icon,
  value,
  label,
  footer,
  hero,
}: {
  icon: LucideIcon;
  value: ReactNode;
  label: ReactNode;
  footer?: ReactNode;
  hero?: boolean;
}) {
  return (
    <div className={cn('flex flex-col gap-4 rounded-2xl p-4', GLASS)}>
      <span
        className={cn(
          'flex size-9 items-center justify-center rounded-xl ring-1',
          hero
            ? 'bg-primary text-primary-foreground ring-primary/30'
            : 'bg-card text-foreground/70 ring-border',
        )}
      >
        <Icon className="size-4" />
      </span>
      <div className="space-y-1">
        <p className="text-2xl leading-none font-semibold tracking-tight tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      {footer && <div className="mt-auto text-xs text-muted-foreground">{footer}</div>}
    </div>
  );
}

export function KpiRow({ kpis }: { kpis: FinanceOverview['kpis'] }) {
  const { t } = useTranslation('erp', { keyPrefix: 'finance' });

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <Kpi
        hero
        icon={Landmark}
        value={moneyWhole(kpis.balance)}
        label={t('kpis.balance')}
        footer={
          <span className="flex items-center gap-1.5">
            <TrendBadge delta={kpis.balanceDelta} /> {t('kpis.vsLast')}
          </span>
        }
      />
      <Kpi
        icon={FileQuestion}
        value={count(kpis.uncategorized)}
        label={t('kpis.uncategorized')}
        footer={t('kpis.uncategorizedHint')}
      />
      <Kpi
        icon={Users}
        value={count(kpis.employees)}
        label={t('kpis.employees')}
        footer={t('kpis.employeesHint')}
      />
      <Kpi
        icon={CreditCard}
        value={money(kpis.weeklySpend)}
        label={t('kpis.spend')}
        footer={
          <span className="flex items-center gap-1.5">
            <TrendBadge delta={kpis.spendDelta} invert /> {t('kpis.vsLast')}
          </span>
        }
      />
    </div>
  );
}
