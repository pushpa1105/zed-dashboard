import { zodResolver } from '@hookform/resolvers/zod';
import { BarChart3, Building, CheckCircle2, LayoutGrid, Users } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { FormField } from '@/core/forms/form-field';
import { useTranslation } from '@/core/i18n/use-translation';
import { notify } from '@/core/notify/notify';
import { RadioCards } from '@/shared/components/forms/choice-cards';
import { OtpInput } from '@/shared/components/forms/otp-input';
import { SegmentedControl } from '@/shared/components/forms/segmented-control';
import { TagInput } from '@/shared/components/forms/tag-input';
import { Wizard } from '@/shared/components/forms/wizard';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const schema = z.object({
  workspace: z.string().trim().min(3, 'ui-forms:validation.workspace'),
  slug: z.string().regex(/^[a-z0-9-]{3,}$/, 'ui-forms:validation.slug'),
  useCase: z.string().min(1, 'validation.required'),
  invites: z.array(z.string()),
  billing: z.enum(['monthly', 'yearly']),
  code: z.string().length(6, 'ui-forms:validation.code'),
});

type Values = z.infer<typeof schema>;

/** Multi-step onboarding built on `Wizard`; each step validates its own fields. */
export function OnboardingWizard() {
  const { t } = useTranslation('ui-forms');
  const [done, setDone] = useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      workspace: '',
      slug: '',
      useCase: '',
      invites: [],
      billing: 'yearly',
      code: '',
    },
  });
  const { control } = form;

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="size-6" />
        </span>
        <p className="font-medium">
          {t('wizard.doneTitle', { name: form.getValues('workspace') })}
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">{t('wizard.doneText')}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            form.reset();
            setDone(false);
          }}
        >
          {t('wizard.restart')}
        </Button>
      </div>
    );
  }

  return (
    <Wizard
      labels={{
        back: t('wizard.back'),
        next: t('wizard.next'),
        finish: t('wizard.finish'),
        step: (n, total) => t('wizard.stepOf', { n, total }),
      }}
      onComplete={async () => {
        await new Promise((r) => setTimeout(r, 600));
        notify.success(t('wizard.created'));
        setDone(true);
      }}
      steps={[
        {
          key: 'workspace',
          title: t('wizard.steps.workspace'),
          description: t('wizard.steps.workspaceHint'),
          validate: () => form.trigger(['workspace', 'slug']),
          content: (
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={control}
                name="workspace"
                label={t('wizard.workspaceName')}
                render={({ field, id, invalid }) => (
                  <Input
                    {...field}
                    id={id}
                    aria-invalid={invalid}
                    placeholder="Acme Analytics"
                    onChange={(e) => {
                      field.onChange(e);
                      if (!form.getFieldState('slug').isDirty) {
                        form.setValue(
                          'slug',
                          e.target.value
                            .toLowerCase()
                            .trim()
                            .replace(/[^a-z0-9]+/g, '-')
                            .replace(/^-|-$/g, ''),
                        );
                      }
                    }}
                  />
                )}
              />
              <FormField
                control={control}
                name="slug"
                label={t('wizard.slug')}
                description={t('wizard.slugHint')}
                render={({ field, id, invalid }) => (
                  <Input {...field} id={id} aria-invalid={invalid} className="font-mono" />
                )}
              />
            </div>
          ),
        },
        {
          key: 'use',
          title: t('wizard.steps.use'),
          description: t('wizard.steps.useHint'),
          validate: () => form.trigger('useCase'),
          content: (
            <FormField
              control={control}
              name="useCase"
              render={({ field }) => (
                <RadioCards
                  columns={3}
                  value={field.value || null}
                  onChange={field.onChange}
                  aria-label={t('wizard.steps.use')}
                  options={[
                    {
                      value: 'analytics',
                      title: t('wizard.uses.analytics'),
                      description: t('wizard.uses.analyticsHint'),
                      icon: <BarChart3 />,
                    },
                    {
                      value: 'ops',
                      title: t('wizard.uses.ops'),
                      description: t('wizard.uses.opsHint'),
                      icon: <LayoutGrid />,
                    },
                    {
                      value: 'crm',
                      title: t('wizard.uses.crm'),
                      description: t('wizard.uses.crmHint'),
                      icon: <Users />,
                    },
                  ]}
                />
              )}
            />
          ),
        },
        {
          key: 'team',
          title: t('wizard.steps.team'),
          description: t('wizard.steps.teamHint'),
          content: (
            <div className="space-y-4">
              <FormField
                control={control}
                name="invites"
                label={t('wizard.invites')}
                description={t('wizard.invitesHint')}
                render={({ field, id }) => (
                  <TagInput
                    id={id}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="name@company.com"
                    lowercase
                    validate={(v) =>
                      EMAIL.test(v) ? undefined : t('wizard.invalidEmail', { email: v })
                    }
                  />
                )}
              />
              <FormField
                control={control}
                name="billing"
                label={t('wizard.billing')}
                render={({ field }) => (
                  <SegmentedControl
                    value={field.value}
                    onChange={field.onChange}
                    aria-label={t('wizard.billing')}
                    options={[
                      { value: 'monthly', label: t('wizard.monthly') },
                      { value: 'yearly', label: t('wizard.yearly') },
                    ]}
                  />
                )}
              />
            </div>
          ),
        },
        {
          key: 'verify',
          title: t('wizard.steps.verify'),
          description: t('wizard.steps.verifyHint'),
          validate: () => form.trigger('code'),
          content: (
            <div className="flex flex-col items-start gap-3">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building className="size-4" /> {t('wizard.codeSent')}
              </p>
              <FormField
                control={control}
                name="code"
                label={t('wizard.code')}
                render={({ field, id, invalid }) => (
                  <OtpInput
                    id={id}
                    value={field.value}
                    onChange={field.onChange}
                    invalid={invalid}
                  />
                )}
              />
            </div>
          ),
        },
      ]}
    />
  );
}
