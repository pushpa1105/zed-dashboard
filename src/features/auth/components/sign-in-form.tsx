import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldCheck, UserRound } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';

import { getErrorMessage } from '@/core/api/errors';
import { credentialsSchema, useSignIn, type Credentials } from '@/core/auth/session';
import { routes } from '@/core/config/routes';
import { siteConfig } from '@/core/config/site';
import { TextField } from '@/core/forms/text-field';
import { useTranslation } from '@/core/i18n/use-translation';
import { Link, useSearchParams } from '@/core/router/router';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Field, FieldDescription, FieldGroup, FieldSeparator } from '@/shared/ui/field';
import { Spinner } from '@/shared/ui/spinner';

type DemoRole = keyof typeof siteConfig.demo.accounts;

const isDemoRole = (value: string | null): value is DemoRole =>
  value !== null && value in siteConfig.demo.accounts;

/**
 * After a successful sign-in the session query is populated and the guest
 * guard redirects automatically, so `onSuccess` is optional.
 *
 * While the mock API is on, the form is prefilled with the demo account and
 * offers one-click demo buttons. `?demo=admin|member` signs in immediately
 * (used by "Live preview" links on the landing page).
 */
export function SignInForm({ onSuccess }: { onSuccess?: () => void }) {
  const { t } = useTranslation('auth');
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirectTo');
  const demoParam = searchParams.get('demo');
  const signIn = useSignIn();
  const demo = siteConfig.demo;

  const form = useForm<Credentials>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: demo.enabled ? demo.accounts.admin : { email: '', password: '' },
  });

  const signInAs = (role: DemoRole) => {
    form.reset(demo.accounts[role]);
    signIn.mutate(demo.accounts[role], { onSuccess });
  };

  // `?demo=` auto sign-in. The ref keeps StrictMode's double effect from firing twice.
  const autoStarted = useRef(false);
  useEffect(() => {
    if (!demo.enabled || autoStarted.current || !isDemoRole(demoParam)) return;
    autoStarted.current = true;
    signInAs(demoParam);
    // Runs once on mount; signInAs is stable for this purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pendingRole = signIn.isPending
    ? (Object.keys(demo.accounts) as DemoRole[]).find(
        (role) => demo.accounts[role].email === signIn.variables?.email,
      )
    : undefined;

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">{t('signIn.title')}</CardTitle>
        <CardDescription>{t('signIn.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={form.handleSubmit((values) => signIn.mutate(values, { onSuccess }))}
          noValidate
        >
          <FieldGroup>
            {signIn.isError && (
              <Alert variant="destructive">
                <AlertDescription>{getErrorMessage(signIn.error)}</AlertDescription>
              </Alert>
            )}
            {demo.enabled && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={signIn.isPending}
                    onClick={() => signInAs('admin')}
                  >
                    {pendingRole === 'admin' ? <Spinner /> : <ShieldCheck />}
                    {t('signIn.demoAdmin')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={signIn.isPending}
                    onClick={() => signInAs('member')}
                  >
                    {pendingRole === 'member' ? <Spinner /> : <UserRound />}
                    {t('signIn.demoMember')}
                  </Button>
                </div>
                <FieldSeparator>{t('signIn.orWithEmail')}</FieldSeparator>
              </>
            )}
            <TextField
              control={form.control}
              name="email"
              label={t('fields.email')}
              type="email"
              autoComplete="email"
            />
            <TextField
              control={form.control}
              name="password"
              label={t('fields.password')}
              type="password"
              autoComplete="current-password"
            />
            <Field>
              <Button type="submit" disabled={signIn.isPending}>
                {signIn.isPending && !pendingRole && <Spinner />} {t('signIn.submit')}
              </Button>
              <FieldDescription className="text-center">
                {t('signIn.noAccount')}{' '}
                <Link to={routes.register.href({ redirectTo })}>{t('signUp.submit')}</Link>
              </FieldDescription>
              {demo.enabled && (
                <FieldDescription className="text-center text-xs">
                  {t('signIn.demo')}
                </FieldDescription>
              )}
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
