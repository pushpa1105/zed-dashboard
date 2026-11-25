import { Activity, RefreshCw } from 'lucide-react';

import { BrandLogo } from '@/core/brand/components/brand-logo';
import { routes } from '@/core/config/routes';
import { useTranslation } from '@/core/i18n/use-translation';
import { Head } from '@/core/layout/head';
import { Link } from '@/core/router/router';
import { CopyButton } from '@/shared/components/display/copy-button';
import { Button } from '@/shared/ui/button';

import { BackToGallery } from '../components/template-kit';

const REQUEST_ID = 'req_7f3a91c2e04b';

/** Status template: 500 with a request id to quote to support. */
export default function ServerErrorPage() {
  const { t } = useTranslation('pages');

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/40 px-6">
      <Head title={t('templates.serverError.title')} />
      <div className="w-full max-w-lg rounded-2xl border bg-card p-8 shadow-sm md:p-10">
        <BrandLogo />
        <p className="mt-10 font-mono text-sm text-destructive">{t('status.serverError.code')}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {t('status.serverError.title')}
        </h1>
        <p className="mt-3 text-muted-foreground">{t('status.serverError.body')}</p>
        <div className="mt-6 flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-3 py-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{t('status.serverError.requestId')}</p>
            <p className="truncate font-mono text-sm">{REQUEST_ID}</p>
          </div>
          <CopyButton value={REQUEST_ID} />
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button onClick={() => window.location.reload()}>
            <RefreshCw /> {t('status.retry')}
          </Button>
          <Button variant="outline" asChild>
            <Link to={routes.home.href()}>{t('status.home')}</Link>
          </Button>
          <Button variant="ghost" asChild className="ml-auto">
            <a href="#status">
              <Activity /> {t('status.serverError.statusPage')}
            </a>
          </Button>
        </div>
      </div>
      <BackToGallery />
    </div>
  );
}
