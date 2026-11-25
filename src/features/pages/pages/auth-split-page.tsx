import { Star } from 'lucide-react';

import { BrandLogo } from '@/core/brand/components/brand-logo';
import { useTranslation } from '@/core/i18n/use-translation';
import { Head } from '@/core/layout/head';
import { notify } from '@/core/notify/notify';
import { Link } from '@/core/router/router';

import { BackToGallery, Divider, SocialButtons } from '../components/template-kit';
import { TemplateSignIn } from '../components/template-sign-in';
import { pagesRoutes } from '../routes';

/** Auth template 1: brand panel with proof on the left, form on the right. */
export default function AuthSplitPage() {
  const { t } = useTranslation('pages');

  return (
    <div className="grid min-h-svh lg:grid-cols-[1.05fr_1fr]">
      <Head title={t('templates.authSplit.title')} />
      <aside className="relative hidden overflow-hidden bg-primary p-10 text-primary-foreground lg:flex lg:flex-col">
        <div
          aria-hidden
          className="absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)] opacity-25"
          style={{
            backgroundImage:
              'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />
        <BrandLogo inverted className="relative" />
        <div className="relative mt-auto max-w-lg space-y-8">
          <div className="grid grid-cols-3 gap-3">
            {(['teams', 'uptime', 'saved'] as const).map((stat) => (
              <div key={stat} className="rounded-xl bg-primary-foreground/10 p-4 backdrop-blur">
                <p className="text-2xl font-semibold tabular-nums">
                  {t(`auth.split.stats.${stat}.value`)}
                </p>
                <p className="mt-1 text-xs text-primary-foreground/75">
                  {t(`auth.split.stats.${stat}.label`)}
                </p>
              </div>
            ))}
          </div>
          <figure className="space-y-4">
            <div className="flex gap-0.5" aria-label="5/5">
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} className="size-4 fill-current" />
              ))}
            </div>
            <blockquote className="text-xl leading-snug font-medium text-balance">
              “{t('auth.split.quote')}”
            </blockquote>
            <figcaption className="text-sm text-primary-foreground/80">
              {t('auth.split.author')}
            </figcaption>
          </figure>
        </div>
      </aside>

      <main className="flex flex-col px-6 py-8 sm:px-10">
        <div className="flex items-center justify-between lg:justify-end">
          <BrandLogo className="lg:hidden" />
          <p className="text-sm text-muted-foreground">
            {t('auth.noAccount')}{' '}
            <Link
              to={pagesRoutes.authIllustrated.href()}
              className="font-medium text-foreground hover:underline"
            >
              {t('auth.signUp')}
            </Link>
          </p>
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-7 py-12">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">{t('auth.split.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('auth.split.subtitle')}</p>
          </div>
          <SocialButtons
            className="sm:grid-cols-1"
            onPick={(provider) => notify.info(t('auth.toast.provider', { provider }))}
          />
          <Divider>{t('auth.orEmail')}</Divider>
          <TemplateSignIn idPrefix="split" />
        </div>
        <p className="text-center text-xs text-muted-foreground">{t('auth.legal')}</p>
      </main>
      <BackToGallery />
    </div>
  );
}
