import { Save } from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { notify } from '@/core/notify/notify';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { NumberInput } from '@/shared/components/forms/number-input';
import { SwitchRow } from '@/shared/components/forms/switch-row';
import { Button } from '@/shared/ui/button';
import { Field, FieldLabel } from '@/shared/ui/field';
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group';

const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

export default function HrSettingsPage() {
  const { t } = useTranslation('hr');
  const [vacation, setVacation] = useState<number | null>(28);
  const [sick, setSick] = useState<number | null>(10);
  const [carryOver, setCarryOver] = useState(true);
  const [workdays, setWorkdays] = useState<string[]>(['mon', 'tue', 'wed', 'thu', 'fri']);
  const [notifications, setNotifications] = useState({
    approvals: true,
    anniversaries: true,
    onboarding: false,
  });

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
        title={t('settings.policies.title')}
        description={t('settings.policies.description')}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="vacation-days">{t('settings.policies.vacation')}</FieldLabel>
            <NumberInput
              id="vacation-days"
              value={vacation}
              onChange={setVacation}
              min={0}
              max={60}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="sick-days">{t('settings.policies.sick')}</FieldLabel>
            <NumberInput id="sick-days" value={sick} onChange={setSick} min={0} max={30} />
          </Field>
        </div>
        <SwitchRow
          className="mt-6 border-t pt-5"
          label={t('settings.policies.carryOver')}
          description={t('settings.policies.carryOverHint')}
          checked={carryOver}
          onCheckedChange={setCarryOver}
        />
      </SectionCard>

      <SectionCard title={t('settings.week.title')} description={t('settings.week.description')}>
        <ToggleGroup
          type="multiple"
          variant="outline"
          value={workdays}
          onValueChange={setWorkdays}
          className="flex-wrap"
        >
          {WEEKDAYS.map((day) => (
            <ToggleGroupItem key={day} value={day} className="w-14">
              {t(`settings.weekdays.${day}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </SectionCard>

      <SectionCard
        title={t('settings.notifications.title')}
        description={t('settings.notifications.description')}
      >
        <div className="divide-y">
          {(['approvals', 'anniversaries', 'onboarding'] as const).map((key) => (
            <SwitchRow
              key={key}
              className="py-4 first:pt-0 last:pb-0"
              label={t(`settings.notifications.${key}`)}
              description={t(`settings.notifications.${key}Hint`)}
              checked={notifications[key]}
              onCheckedChange={(checked) => setNotifications((n) => ({ ...n, [key]: checked }))}
            />
          ))}
        </div>
      </SectionCard>
    </Page>
  );
}
