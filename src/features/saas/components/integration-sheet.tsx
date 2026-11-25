import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { FormField } from '@/core/forms/form-field';
import { useTranslation } from '@/core/i18n/use-translation';
import { DescriptionList } from '@/shared/components/display/description-list';
import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { CheckboxGroup } from '@/shared/components/forms/checkbox-group';
import { SegmentedControl } from '@/shared/components/forms/segmented-control';
import { formatDate } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { FieldGroup } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/shared/ui/sheet';

import { useConnectIntegration, useDisconnectIntegration } from '../api/integrations-api';
import { compact } from '../lib/format';
import {
  integrationConfigSchema,
  SYNC_MODES,
  type Integration,
  type IntegrationConfig,
} from '../model/integrations';

function IntegrationForm({
  integration,
  onDone,
}: {
  integration: Integration;
  onDone: () => void;
}) {
  const { t, i18n } = useTranslation('saas');
  const connect = useConnectIntegration();
  const disconnect = useDisconnectIntegration();
  const form = useForm<IntegrationConfig>({
    resolver: zodResolver(integrationConfigSchema),
    defaultValues: integration.config ?? {
      account: '',
      events: integration.events,
      sync: 'realtime',
    },
  });
  const { config, connectedAt } = integration;

  return (
    <>
      <SheetHeader className="flex-row items-center gap-3">
        <InitialsAvatar name={integration.name} shape="square" size="md" />
        <div className="min-w-0">
          <SheetTitle>{integration.name}</SheetTitle>
          <SheetDescription>{integration.description}</SheetDescription>
        </div>
      </SheetHeader>
      <div className="space-y-6 px-4">
        {connectedAt && (
          <DescriptionList
            items={[
              {
                key: 'since',
                term: t('integrations.sheet.since'),
                detail: formatDate(connectedAt, 'MMM D, YYYY'),
              },
              {
                key: 'synced',
                term: t('integrations.sheet.synced'),
                detail: compact(integration.synced, i18n.language),
              },
            ]}
          />
        )}
        <form
          id="integration-form"
          noValidate
          onSubmit={form.handleSubmit((values) =>
            connect.mutate({ id: integration.id, ...values }, { onSuccess: onDone }),
          )}
        >
          <FieldGroup>
            <FormField
              control={form.control}
              name="account"
              label={t('integrations.sheet.account')}
              description={t('integrations.sheet.accountHint')}
              required
              render={({ field, id, invalid }) => (
                <Input id={id} aria-invalid={invalid} autoComplete="off" {...field} />
              )}
            />
            <FormField
              control={form.control}
              name="events"
              label={t('integrations.sheet.events')}
              required
              render={({ field }) => (
                <CheckboxGroup
                  value={field.value}
                  onChange={field.onChange}
                  selectAllLabel={t('integrations.sheet.allEvents')}
                  options={integration.events.map((e) => ({ value: e, label: e }))}
                />
              )}
            />
            <FormField
              control={form.control}
              name="sync"
              label={t('integrations.sheet.sync')}
              render={({ field }) => (
                <SegmentedControl
                  aria-label={t('integrations.sheet.sync')}
                  value={field.value}
                  onChange={field.onChange}
                  options={SYNC_MODES.map((value) => ({
                    value,
                    label: t(`integrations.sync.${value}`),
                  }))}
                  block
                />
              )}
            />
          </FieldGroup>
        </form>
      </div>
      <SheetFooter className="flex-row justify-end">
        {config && (
          <Button
            variant="ghost"
            className="mr-auto text-destructive hover:text-destructive"
            disabled={disconnect.isPending}
            onClick={() => disconnect.mutate(integration.id, { onSuccess: onDone })}
          >
            {t('integrations.disconnect')}
          </Button>
        )}
        <Button type="submit" form="integration-form" disabled={connect.isPending}>
          {t(config ? 'integrations.sheet.save' : 'integrations.connect')}
        </Button>
      </SheetFooter>
    </>
  );
}

export function IntegrationSheet({
  integration,
  onClose,
}: {
  integration: Integration | null;
  onClose: () => void;
}) {
  return (
    <Sheet open={!!integration} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {integration && (
          <IntegrationForm key={integration.id} integration={integration} onDone={onClose} />
        )}
      </SheetContent>
    </Sheet>
  );
}
