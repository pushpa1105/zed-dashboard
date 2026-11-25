import { ArrowLeft, Home } from 'lucide-react';

import { routes } from '@/core/config/routes';
import { useTranslation } from '@/core/i18n/use-translation';
import { Head } from '@/core/layout/head';
import { Link, useNavigate } from '@/core/router/router';
import { Button } from '@/shared/ui/button';

import { BackToGallery } from '../components/template-kit';

/** A grid with a few tiles knocked out of place: "this page went missing". */
function BrokenGrid() {
  const tiles = Array.from({ length: 16 }, (_, i) => i);
  const missing = new Set([5, 6, 10]);
  return (
    <div className="relative mx-auto grid w-72 grid-cols-4 gap-3 sm:w-96" aria-hidden>
      {tiles.map((i) => (
        <span
          key={i}
          className={
            missing.has(i)
              ? 'aspect-square rounded-xl border-2 border-dashed border-primary/40'
              : 'aspect-square rounded-xl bg-muted'
          }
        />
      ))}
      <span className="absolute -right-6 -bottom-6 aspect-square w-[22%] rotate-12 rounded-xl bg-primary shadow-lg shadow-primary/30" />
      <span className="absolute -top-5 right-10 aspect-square w-[18%] -rotate-6 rounded-xl bg-chart-2/70" />
    </div>
  );
}

/** Status template: 404, split layout with an illustration. */
export default function NotFoundAltPage() {
  const { t } = useTranslation('pages');
  const navigate = useNavigate();

  return (
    <div className="grid min-h-svh items-center gap-12 bg-background px-6 py-16 md:grid-cols-2 md:px-16">
      <Head title={t('templates.notFoundAlt.title')} />
      <div className="max-w-md space-y-6 md:justify-self-end">
        <p className="text-[7rem] leading-none font-semibold tracking-tighter text-primary/90 tabular-nums">
          404
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-balance">
          {t('status.notFoundAlt.title')}
        </h1>
        <p className="text-muted-foreground">{t('status.notFoundAlt.body')}</p>
        <div className="flex flex-wrap gap-3">
          <Button size="lg" onClick={() => void navigate(-1)}>
            <ArrowLeft /> {t('status.back')}
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to={routes.home.href()}>
              <Home /> {t('status.home')}
            </Link>
          </Button>
        </div>
      </div>
      <div className="md:justify-self-start md:pl-8">
        <BrokenGrid />
      </div>
      <BackToGallery />
    </div>
  );
}
