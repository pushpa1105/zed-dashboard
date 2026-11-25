import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { useTranslation } from '@/core/i18n/use-translation';
import { notify } from '@/core/notify/notify';
import { Link } from '@/core/router/router';
import { PasswordInput } from '@/shared/components/forms/password-input';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Spinner } from '@/shared/ui/spinner';

import { pagesRoutes } from '../routes';

import { FieldMessage } from './template-kit';

const schema = z.object({
  email: z.email(),
  password: z.string().min(8),
  remember: z.boolean(),
});
type Values = z.infer<typeof schema>;

/**
 * Visual sign-in form for the auth templates. Submitting only shows a toast:
 * the app's real sign-in lives at /login.
 */
export function TemplateSignIn({ idPrefix }: { idPrefix: string }) {
  const { t } = useTranslation('pages');
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: 'hannah@northwind.io', password: '', remember: true },
  });
  const { errors, isSubmitting } = form.formState;

  return (
    <form
      noValidate
      className="grid gap-5"
      onSubmit={form.handleSubmit(async (values) => {
        await new Promise((resolve) => setTimeout(resolve, 700));
        notify.success(t('auth.toast.signedIn'), { description: values.email });
      })}
    >
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-email`}>{t('auth.fields.email')}</Label>
        <Input
          id={`${idPrefix}-email`}
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          {...form.register('email')}
        />
        <FieldMessage>{errors.email && t('auth.errors.email')}</FieldMessage>
      </div>
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={`${idPrefix}-password`}>{t('auth.fields.password')}</Label>
          <Link
            to={pagesRoutes.authForgot.href()}
            className="text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            {t('auth.forgotLink')}
          </Link>
        </div>
        <PasswordInput
          id={`${idPrefix}-password`}
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          showLabel={t('auth.show')}
          hideLabel={t('auth.hide')}
          {...form.register('password')}
        />
        <FieldMessage>{errors.password && t('auth.errors.password')}</FieldMessage>
      </div>
      <Controller
        control={form.control}
        name="remember"
        render={({ field }) => (
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />
            {t('auth.remember')}
          </label>
        )}
      />
      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting && <Spinner />} {t('auth.signIn')}
      </Button>
    </form>
  );
}
