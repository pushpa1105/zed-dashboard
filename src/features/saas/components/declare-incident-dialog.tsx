import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { FormField } from '@/core/forms/form-field';
import { useTranslation } from '@/core/i18n/use-translation';
import { CheckboxGroup } from '@/shared/components/forms/checkbox-group';
import { SegmentedControl } from '@/shared/components/forms/segmented-control';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { FieldGroup } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';

import { useDeclareIncident } from '../api/admin-api';
import {
  incidentFormSchema,
  INCIDENT_IMPACTS,
  type IncidentForm,
  type StatusComponent,
} from '../model/admin';

const EMPTY: IncidentForm = { title: '', impact: 'minor', componentIds: [], message: '' };

export function DeclareIncidentDialog({
  open,
  onOpenChange,
  components,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  components: StatusComponent[];
}) {
  const { t } = useTranslation('saas');
  const declare = useDeclareIncident();
  const form = useForm<IncidentForm>({
    resolver: zodResolver(incidentFormSchema),
    defaultValues: EMPTY,
  });

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) form.reset(EMPTY);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('status.declare.title')}</DialogTitle>
          <DialogDescription>{t('status.declare.description')}</DialogDescription>
        </DialogHeader>
        <form
          id="incident-form"
          noValidate
          onSubmit={form.handleSubmit((values) =>
            declare.mutate(values, { onSuccess: () => close(false) }),
          )}
        >
          <FieldGroup>
            <FormField
              control={form.control}
              name="title"
              label={t('status.declare.name')}
              required
              render={({ field, id, invalid }) => (
                <Input
                  id={id}
                  aria-invalid={invalid}
                  placeholder={t('status.declare.namePlaceholder')}
                  {...field}
                />
              )}
            />
            <FormField
              control={form.control}
              name="impact"
              label={t('status.declare.impact')}
              render={({ field }) => (
                <SegmentedControl
                  aria-label={t('status.declare.impact')}
                  value={field.value}
                  onChange={field.onChange}
                  options={INCIDENT_IMPACTS.map((value) => ({
                    value,
                    label: t(`status.impact.${value}`),
                  }))}
                  block
                />
              )}
            />
            <FormField
              control={form.control}
              name="componentIds"
              label={t('status.declare.components')}
              required
              render={({ field }) => (
                <CheckboxGroup
                  value={field.value}
                  onChange={field.onChange}
                  orientation="horizontal"
                  options={components.map((c) => ({ value: c.id, label: c.name }))}
                />
              )}
            />
            <FormField
              control={form.control}
              name="message"
              label={t('status.declare.message')}
              description={t('status.declare.messageHint')}
              required
              render={({ field, id, invalid }) => (
                <Textarea id={id} aria-invalid={invalid} rows={4} {...field} />
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="incident-form" disabled={declare.isPending}>
            {t('status.declare.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
