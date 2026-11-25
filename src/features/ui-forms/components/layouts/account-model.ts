import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useTranslation } from '@/core/i18n/use-translation';
import { notify } from '@/core/notify/notify';
import { useDemoSubmit } from '@/features/ui-forms/api/ui-forms-api';

/** One "Account" form, rendered in many layouts on the form-layouts page. */
export const ROLES = ['owner', 'admin', 'editor', 'viewer'] as const;

export const TIMEZONES = [
  { value: 'America/Los_Angeles', label: 'Los Angeles (UTC−8)' },
  { value: 'America/New_York', label: 'New York (UTC−5)' },
  { value: 'Europe/London', label: 'London (UTC+0)' },
  { value: 'Europe/Berlin', label: 'Berlin (UTC+1)' },
  { value: 'Asia/Kathmandu', label: 'Kathmandu (UTC+5:45)' },
  { value: 'Asia/Singapore', label: 'Singapore (UTC+8)' },
  { value: 'Australia/Sydney', label: 'Sydney (UTC+11)' },
];

export const accountSchema = z.object({
  firstName: z.string().trim().min(1, 'validation.required'),
  lastName: z.string().trim().min(1, 'validation.required'),
  email: z.string().trim().email('validation.email'),
  role: z.enum(ROLES),
  timezone: z.string().min(1, 'validation.required'),
  bio: z.string().max(160, 'validation.tooLong'),
  newsletter: z.boolean(),
});

export type AccountValues = z.infer<typeof accountSchema>;
export type AccountFieldName = keyof AccountValues;

export const ACCOUNT_DEFAULTS: AccountValues = {
  firstName: 'Hannah',
  lastName: 'Morgan',
  email: 'hannah@northwind.io',
  role: 'admin',
  timezone: 'Europe/London',
  bio: '',
  newsletter: true,
};

/** Form instance + submit handler that posts to the mock API and toasts. */
export function useAccountForm(onDone?: () => void) {
  const { t } = useTranslation('ui-forms');
  const form = useForm<AccountValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: ACCOUNT_DEFAULTS,
  });
  const submit = useDemoSubmit({
    onSuccess: (_, values) => {
      notify.success(t('layouts.saved'), {
        description: t('layouts.savedFor', { name: `${values.firstName} ${values.lastName}` }),
      });
      form.reset(values as AccountValues);
      onDone?.();
    },
  });
  const onSubmit = form.handleSubmit((values) => submit.mutate(values));
  return { form, onSubmit, pending: submit.isPending };
}
