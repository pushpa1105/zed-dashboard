import { CreditCard, Search, Users, UserMinus } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { AreaChart } from '@/shared/components/charts/area-chart';
import { BarChart } from '@/shared/components/charts/bar-chart';
import { DonutChart } from '@/shared/components/charts/donut-chart';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatCard } from '@/shared/components/dashboard/stat-card';
import { cn } from '@/shared/lib/cn';

const MONTHS = ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
const THIS_YEAR = [182, 188, 201, 197, 214, 229, 236, 241, 258, 266, 279, 294];
const LAST_YEAR = [131, 139, 142, 150, 149, 158, 166, 171, 169, 177, 186, 190];
const WEEKLY = [412, 438, 396, 471, 502, 488, 534, 561];

const usd = (v: number) => `$${v}k`;

/**
 * A live, non-interactive product shot built from the real dashboard
 * components, framed as a browser window. It re-themes with the app.
 */
export function ProductPreview({ className }: { className?: string }) {
  const { t } = useTranslation('landing');

  const revenue = MONTHS.map((month, i) => ({
    month,
    thisYear: THIS_YEAR[i]!,
    lastYear: LAST_YEAR[i]!,
  }));
  const weekly = WEEKLY.map((signups, i) => ({ week: `W${i + 40}`, signups }));

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border bg-background shadow-[0_24px_80px_-24px_color-mix(in_oklch,var(--primary)_35%,transparent)]',
        className,
      )}
      aria-hidden
      inert
    >
      <div className="flex items-center gap-3 border-b bg-muted/50 px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
        </div>
        <div className="mx-auto flex w-full max-w-xs items-center gap-2 rounded-md border bg-background px-2.5 py-1 text-xs text-muted-foreground">
          <Search className="size-3" />
          {t('saas.preview.url')}
        </div>
        <div className="w-10" />
      </div>

      <div className="grid gap-3 p-3 sm:p-4 lg:grid-cols-12">
        <div className="grid gap-3 sm:grid-cols-3 lg:col-span-12">
          <StatCard
            label={t('saas.preview.revenue')}
            value="$294,180"
            delta={5.4}
            hint={t('saas.preview.vsLastMonth')}
            icon={CreditCard}
            sparkline={THIS_YEAR.slice(-8)}
          />
          <StatCard
            label={t('saas.preview.customers')}
            value="3,912"
            delta={2.1}
            hint={t('saas.preview.vsLastMonth')}
            icon={Users}
            color="var(--chart-2)"
            sparkline={[3402, 3488, 3521, 3610, 3655, 3740, 3831, 3912]}
          />
          <StatCard
            label={t('saas.preview.churn')}
            value="1.8%"
            delta={-0.4}
            invert
            hint={t('saas.preview.vsLastMonth')}
            icon={UserMinus}
            color="var(--chart-3)"
            className="hidden sm:flex"
          />
        </div>

        <SectionCard
          className="lg:col-span-8"
          title={t('saas.preview.trend')}
          description={t('saas.preview.trendHint')}
        >
          <AreaChart
            data={revenue}
            xKey="month"
            series={[
              { key: 'thisYear', label: t('saas.preview.thisYear') },
              { key: 'lastYear', label: t('saas.preview.lastYear'), color: 'var(--chart-4)' },
            ]}
            valueFormatter={usd}
            className="h-52"
          />
        </SectionCard>

        <div className="grid gap-3 lg:col-span-4">
          <SectionCard title={t('saas.preview.channels')} className="hidden md:flex">
            <DonutChart
              legend="right"
              thickness={0.32}
              className="sm:flex-col xl:flex-row [&_[data-slot=chart]]:max-w-28"
              data={[
                { key: 'organic', label: t('saas.preview.organic'), value: 1840 },
                { key: 'paid', label: t('saas.preview.paid'), value: 1120 },
                { key: 'referral', label: t('saas.preview.referral'), value: 640 },
                { key: 'partners', label: t('saas.preview.partners'), value: 312 },
              ]}
            />
          </SectionCard>
          <SectionCard title={t('saas.preview.weekly')} className="hidden lg:flex">
            <BarChart
              data={weekly}
              xKey="week"
              series={[{ key: 'signups', label: t('saas.preview.signups') }]}
              highlight="last"
              hideYAxis
              hideGrid
              className="h-24"
            />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
