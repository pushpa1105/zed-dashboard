import { MailCheck, Wand2 } from 'lucide-react';
import { useState } from 'react';

import { BrandLogo } from '@/core/brand/components/brand-logo';
import { useTranslation } from '@/core/i18n/use-translation';
import { Head } from '@/core/layout/head';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Spinner } from '@/shared/ui/spinner';

import { BackToGallery, Divider } from '../components/template-kit';
import { TemplateSignIn } from '../components/template-sign-in';

/** Auth template 3: no card, no chrome; magic link first, password second. */
export default function AuthMinimalPage() {
  const { t } = useTranslation('pages');
  const [mode, setMode] = useState<'link' | 'password'>('link');
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const valid = /^\S+@\S+\.\S+$/.test(email);

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-6">
      <Head title={t('templates.authMinimal.title')} />
      <div className="w-full max-w-[22rem] space-y-8">
        <BrandLogo />
        {state === 'sent' ? (
          <div className="space-y-4">
            <span className="flex size-11 items-center justify-center rounded-full bg-success/10 text-success">
              <MailCheck className="size-5" />
            </span>
            <h1 className="text-2xl font-semibold tracking-tight">{t('auth.minimal.sentTitle')}</h1>
            <p className="text-sm text-muted-foreground">{t('auth.minimal.sentBody', { email })}</p>
            <Button variant="ghost" className="-ml-3" onClick={() => setState('idle')}>
              {t('auth.minimal.useAnother')}
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">{t('auth.minimal.title')}</h1>
              <p className="text-sm text-muted-foreground">{t('auth.minimal.subtitle')}</p>
            </div>
            {mode === 'link' ? (
              <form
                className="grid gap-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!valid) return;
                  setState('sending');
                  window.setTimeout(() => setState('sent'), 800);
                }}
              >
                <div className="grid gap-2">
                  <Label htmlFor="min-email">{t('auth.fields.email')}</Label>
                  <Input
                    id="min-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <Button type="submit" size="lg" disabled={!valid || state === 'sending'}>
                  {state === 'sending' ? <Spinner /> : <Wand2 />} {t('auth.minimal.sendLink')}
                </Button>
              </form>
            ) : (
              <TemplateSignIn idPrefix="minimal" />
            )}
            <Divider>{t('auth.or')}</Divider>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setMode(mode === 'link' ? 'password' : 'link')}
            >
              {mode === 'link' ? t('auth.minimal.usePassword') : t('auth.minimal.useLink')}
            </Button>
            <p className="text-xs text-muted-foreground">{t('auth.legal')}</p>
          </>
        )}
      </div>
      <BackToGallery />
    </div>
  );
}
