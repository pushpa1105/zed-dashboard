import { ArrowLeft, KeyRound, MailOpen } from 'lucide-react';
import { useState } from 'react';

import { BrandLogo } from '@/core/brand/components/brand-logo';
import { useTranslation } from '@/core/i18n/use-translation';
import { Head } from '@/core/layout/head';
import { Link } from '@/core/router/router';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Spinner } from '@/shared/ui/spinner';

import { BackToGallery } from '../components/template-kit';
import { pagesRoutes } from '../routes';

/** Auth template 5: request a reset link, then a clear "what happens next". */
export default function AuthForgotPage() {
  const { t } = useTranslation('pages');
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const valid = /^\S+@\S+\.\S+$/.test(email);

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <Head title={t('templates.authForgot.title')} />
      <header className="flex h-16 items-center justify-between px-6">
        <BrandLogo />
        <Button variant="ghost" asChild>
          <Link to={pagesRoutes.authSplit.href()}>
            <ArrowLeft /> {t('auth.forgot.back')}
          </Link>
        </Button>
      </header>
      <main className="flex flex-1 items-center justify-center px-6 pb-16">
        <div className="w-full max-w-sm">
          {state === 'sent' ? (
            <div className="space-y-6">
              <span className="flex size-12 items-center justify-center rounded-xl border bg-card shadow-xs">
                <MailOpen className="size-5 text-primary" />
              </span>
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {t('auth.forgot.sentTitle')}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {t('auth.forgot.sentBody', { email })}
                </p>
              </div>
              <ol className="space-y-3 rounded-xl border bg-muted/40 p-4 text-sm">
                {(['open', 'click', 'choose'] as const).map((step, i) => (
                  <li key={step} className="flex gap-3">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[0.625rem] font-semibold text-primary-foreground">
                      {i + 1}
                    </span>
                    {t(`auth.forgot.steps.${step}`)}
                  </li>
                ))}
              </ol>
              <p className="text-xs text-muted-foreground">
                {t('auth.forgot.noEmail')}{' '}
                <button
                  type="button"
                  className="font-medium text-foreground underline"
                  onClick={() => setState('idle')}
                >
                  {t('auth.forgot.tryAgain')}
                </button>
              </p>
            </div>
          ) : (
            <form
              className="space-y-6"
              onSubmit={(event) => {
                event.preventDefault();
                if (!valid) return;
                setState('sending');
                window.setTimeout(() => setState('sent'), 800);
              }}
            >
              <span className="flex size-12 items-center justify-center rounded-xl border bg-card shadow-xs">
                <KeyRound className="size-5 text-primary" />
              </span>
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight">{t('auth.forgot.title')}</h1>
                <p className="text-sm text-muted-foreground">{t('auth.forgot.subtitle')}</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="forgot-email">{t('auth.fields.email')}</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={!valid || state === 'sending'}
              >
                {state === 'sending' && <Spinner />} {t('auth.forgot.submit')}
              </Button>
            </form>
          )}
        </div>
      </main>
      <BackToGallery />
    </div>
  );
}
