import { GripVertical, Save } from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { notify } from '@/core/notify/notify';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { SwitchRow } from '@/shared/components/forms/switch-row';
import { Button } from '@/shared/ui/button';
import { Slider } from '@/shared/ui/slider';

import { StageBadge } from '../components/crm-parts';
import { OPEN_STAGES, type DealStage } from '../model/crm';

const DEFAULT_PROBABILITY: Record<(typeof OPEN_STAGES)[number], number> = {
  lead: 10,
  qualified: 25,
  proposal: 50,
  negotiation: 75,
};

export default function CrmSettingsPage() {
  const { t } = useTranslation('crm');
  const [probability, setProbability] = useState(DEFAULT_PROBABILITY);
  const [rules, setRules] = useState({ rotting: true, autoAssign: false, lossReason: true });

  return (
    <Page
      width="narrow"
      title={t('settings.title')}
      description={t('settings.description')}
      actions={
        <Button onClick={() => notify.success(t('settings.saved'))}>
          <Save /> {t('settings.save')}
        </Button>
      }
    >
      <SectionCard
        title={t('settings.stages.title')}
        description={t('settings.stages.description')}
        flush
      >
        <ul className="divide-y border-t">
          {OPEN_STAGES.map((stage) => (
            <li
              key={stage}
              className="grid items-center gap-4 px-6 py-4 sm:grid-cols-[10rem_1fr_3.5rem]"
            >
              <span className="flex items-center gap-2">
                <GripVertical className="size-4 text-muted-foreground/60" aria-hidden />
                <StageBadge stage={stage as DealStage} />
              </span>
              <Slider
                value={[probability[stage]]}
                min={0}
                max={100}
                step={5}
                onValueChange={([value]) =>
                  setProbability((p) => ({ ...p, [stage]: value ?? p[stage] }))
                }
                aria-label={t(`stages.${stage}`)}
              />
              <span className="text-right text-sm font-medium tabular-nums">
                {probability[stage]}%
              </span>
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title={t('settings.rules.title')} description={t('settings.rules.description')}>
        <div className="divide-y">
          {(['rotting', 'autoAssign', 'lossReason'] as const).map((key) => (
            <SwitchRow
              key={key}
              label={t(`settings.rules.${key}`)}
              description={t(`settings.rules.${key}Hint`)}
              checked={rules[key]}
              onCheckedChange={(checked) => setRules((r) => ({ ...r, [key]: checked }))}
              className="py-4 first:pt-0 last:pb-0"
            />
          ))}
        </div>
      </SectionCard>
    </Page>
  );
}
