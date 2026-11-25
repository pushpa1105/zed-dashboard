import { zodResolver } from '@hookform/resolvers/zod';
import type { ReactNode } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import type { z } from 'zod';

import { useTranslation } from '@/core/i18n/use-translation';
import { useSaveSettings } from '@/features/ecommerce/api/settings-api';
import type { SettingsSection, StoreSettings } from '@/features/ecommerce/model/settings';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { Button } from '@/shared/ui/button';
import { FieldGroup } from '@/shared/ui/field';

/**
 * One settings tab: a form bound to its section of the store settings, saved
 * independently with Save / Discard in the card footer.
 */
export function SettingsCard<S extends SettingsSection>({
  section,
  schema,
  initial,
  children,
}: {
  section: S;
  schema: z.ZodType<StoreSettings[S], StoreSettings[S]>;
  initial: StoreSettings[S];
  children: (form: UseFormReturn<StoreSettings[S]>) => ReactNode;
}) {
  const { t } = useTranslation('ecommerce');
  const save = useSaveSettings(section);
  const form = useForm<StoreSettings[S]>({ resolver: zodResolver(schema), values: initial });
  const { isDirty } = form.formState;
  const name: SettingsSection = section;

  return (
    <form noValidate onSubmit={form.handleSubmit((values) => save.mutate(values))}>
      <SectionCard
        title={t(`settings.tabs.${name}`)}
        description={t(`settings.hints.${name}`)}
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button type="button" variant="ghost" disabled={!isDirty} onClick={() => form.reset()}>
              {t('settings.discard')}
            </Button>
            <Button type="submit" disabled={!isDirty || save.isPending}>
              {t('settings.save')}
            </Button>
          </div>
        }
      >
        <FieldGroup>{children(form)}</FieldGroup>
      </SectionCard>
    </form>
  );
}
