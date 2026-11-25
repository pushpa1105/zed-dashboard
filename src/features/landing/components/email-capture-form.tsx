import { zodResolver } from '@hookform/resolvers/zod';
import { useId, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useTranslation } from '@/core/i18n/use-translation';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Spinner } from '@/shared/ui/spinner';

type EmailCaptureFormProps = {
  submitLabel: string;
  /** Called with the address once "sent". Replace the fake delay with your API call. */
  onSubmitted: (email: string) => void;
  className?: string;
};

const fakeRequest = () => new Promise((resolve) => setTimeout(resolve, 700));

/** Email + submit in one row (stacks on phones). Validated with Zod. */
export function EmailCaptureForm({ submitLabel, onSubmitted, className }: EmailCaptureFormProps) {
  const { t } = useTranslation('landing');
  const id = useId();
  const schema = useMemo(() => z.object({ email: z.email(t('common.invalidEmail')) }), [t]);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });
  const error = form.formState.errors.email?.message;

  return (
    <form
      noValidate
      className={cn('space-y-2', className)}
      onSubmit={form.handleSubmit(async ({ email }) => {
        await fakeRequest();
        onSubmitted(email);
        form.reset();
      })}
    >
      <label htmlFor={id} className="sr-only">
        {t('common.email')}
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id={id}
          type="email"
          autoComplete="email"
          placeholder={t('common.emailPlaceholder')}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className="h-11 flex-1 px-3.5"
          {...form.register('email')}
        />
        <Button
          type="submit"
          size="lg"
          className="h-11 px-5"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting && <Spinner />}
          {submitLabel}
        </Button>
      </div>
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
