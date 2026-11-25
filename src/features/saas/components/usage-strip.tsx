import { ArrowDownUp, FileText, HardDrive, User, type LucideIcon } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatStrip } from '@/shared/components/dashboard/stat-strip';

import type { SaasOverview } from '../model/overview';

function IconTile({ icon: Icon, color }: { icon: LucideIcon; color: string }) {
  return (
    <span
      className="flex size-11 shrink-0 items-center justify-center rounded-xl"
      style={{ background: `color-mix(in srgb, ${color} 12%, transparent)`, color }}
    >
      <Icon className="size-[1.1rem]" />
    </span>
  );
}

/** Plan usage in one band: four counters with colored icon tiles. */
export function UsageStrip({ stats }: { stats: SaasOverview['stats'] }) {
  const { t } = useTranslation('saas', { keyPrefix: 'overview' });

  return (
    <SectionCard contentClassName="py-1">
      <StatStrip
        className="[&_dd]:text-xl"
        items={[
          {
            key: 'projects',
            label: t('stats.projects'),
            value: stats.projects,
            media: <IconTile icon={FileText} color="var(--chart-3)" />,
          },
          {
            key: 'requests',
            label: t('stats.requests'),
            value: stats.requests.toLocaleString('en-US'),
            delta: stats.requestsDelta,
            media: <IconTile icon={ArrowDownUp} color="var(--chart-1)" />,
          },
          {
            key: 'users',
            label: t('stats.users'),
            value: stats.users,
            media: <IconTile icon={User} color="var(--chart-4)" />,
          },
          {
            key: 'storage',
            label: t('stats.storage'),
            value: (
              <span className="whitespace-nowrap">
                {stats.storageUsedGb}
                <span className="text-sm font-normal text-muted-foreground">
                  {` / ${stats.storageMaxGb} GB`}
                </span>
              </span>
            ),
            media: <IconTile icon={HardDrive} color="var(--chart-5)" />,
          },
        ]}
      />
    </SectionCard>
  );
}
