import { Lock } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Head } from '@/core/layout/head';
import { notify } from '@/core/notify/notify';
import { Link } from '@/core/router/router';
import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { PasswordInput } from '@/shared/components/forms/password-input';
import { formatDate } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Spinner } from '@/shared/ui/spinner';

import { BackToGallery } from '../components/template-kit';
import { pagesRoutes } from '../routes';

/** Auth template 6: session locked after inactivity; a dark, focused screen. */
export default function AuthLockPage() {
  const { t } = useTranslation('pages');
  const [now, setNow] = useState(() => new Date());
  const [password, setPassword] = useState('');
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="dark flex min-h-svh flex-col items-center justify-center bg-background bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--primary)_35%,transparent),transparent_60%)] px-6 text-foreground">
      <Head title={t('templates.authLock.title')} />
      <p className="text-6xl font-light tracking-tight tabular-nums">
        {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">{formatDate(now, 'dddd, MMMM D')}</p>

      <div className="mt-14 flex w-full max-w-xs flex-col items-center text-center">
        <span className="rounded-full bg-foreground/10 p-1.5">
          <InitialsAvatar name="Hannah Morgan" size="xl" />
        </span>
        <p className="mt-4 font-semibold">Hannah Morgan</p>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="size-3" /> {t('auth.lock.locked')}
        </p>
        <form
          className="mt-6 grid w-full gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!password) return;
            setChecking(true);
            window.setTimeout(() => {
              setChecking(false);
              notify.success(t('auth.lock.unlocked'));
            }, 700);
          }}
        >
          <PasswordInput
            aria-label={t('auth.fields.password')}
            placeholder={t('auth.fields.password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            showLabel={t('auth.show')}
            hideLabel={t('auth.hide')}
          />
          <Button type="submit" disabled={!password || checking}>
            {checking && <Spinner />} {t('auth.lock.unlock')}
          </Button>
        </form>
        <Link
          to={pagesRoutes.authSplit.href()}
          className="mt-6 text-xs text-muted-foreground hover:text-foreground hover:underline"
        >
          {t('auth.lock.notYou')}
        </Link>
      </div>
      <BackToGallery />
    </div>
  );
}
