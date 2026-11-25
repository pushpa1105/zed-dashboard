import { ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

import { BrandLogo } from '@/core/brand/components/brand-logo';
import { useTranslation } from '@/core/i18n/use-translation';
import { Head } from '@/core/layout/head';
import { notify } from '@/core/notify/notify';
import { Link } from '@/core/router/router';
import { OtpInput } from '@/shared/components/forms/otp-input';
import { Button } from '@/shared/ui/button';
import { Spinner } from '@/shared/ui/spinner';

import { BackToGallery } from '../components/template-kit';
import { pagesRoutes } from '../routes';

const RESEND_AFTER = 30;
/** Any code works except this one, which shows the error state. */
const WRONG_CODE = '000000';

/** Auth template 4: two-step verification with resend timer and error state. */
export default function AuthOtpPage() {
  const { t } = useTranslation('pages');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'error'>('idle');
  const [seconds, setSeconds] = useState(RESEND_AFTER);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = window.setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [seconds]);

  const verify = (value: string) => {
    setStatus('checking');
    window.setTimeout(() => {
      if (value === WRONG_CODE) {
        setStatus('error');
        return;
      }
      setStatus('idle');
      notify.success(t('auth.otp.verified'));
    }, 700);
  };

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/40 px-4">
      <Head title={t('templates.authOtp.title')} />
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
        <BrandLogo className="justify-center" />
        <span className="mx-auto mt-8 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ShieldCheck className="size-5" />
        </span>
        <h1 className="mt-5 text-xl font-semibold tracking-tight">{t('auth.otp.title')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('auth.otp.subtitle', { email: 'h•••••@northwind.io' })}
        </p>
        <div className="mt-8 flex justify-center">
          <OtpInput
            value={code}
            onChange={(value) => {
              setCode(value);
              if (status === 'error') setStatus('idle');
            }}
            onComplete={verify}
            length={6}
            groupSize={3}
            invalid={status === 'error'}
            autoFocus
          />
        </div>
        <p className="mt-3 min-h-5 text-xs text-destructive" aria-live="polite">
          {status === 'error' && t('auth.otp.wrong')}
        </p>
        <Button
          className="mt-4 w-full"
          size="lg"
          disabled={code.length < 6 || status === 'checking'}
          onClick={() => verify(code)}
        >
          {status === 'checking' && <Spinner />} {t('auth.otp.verify')}
        </Button>
        <p className="mt-6 text-sm text-muted-foreground">
          {seconds > 0 ? (
            t('auth.otp.resendIn', { seconds })
          ) : (
            <button
              type="button"
              className="font-medium text-primary hover:underline"
              onClick={() => {
                setSeconds(RESEND_AFTER);
                notify.info(t('auth.otp.resent'));
              }}
            >
              {t('auth.otp.resend')}
            </button>
          )}
        </p>
        <p className="mt-6 border-t pt-5 text-xs text-muted-foreground">
          {t('auth.otp.hint')}{' '}
          <Link to={pagesRoutes.authSplit.href()} className="underline">
            {t('auth.otp.otherMethod')}
          </Link>
        </p>
      </div>
      <BackToGallery />
    </div>
  );
}
