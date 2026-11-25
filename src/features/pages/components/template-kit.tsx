import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Link } from '@/core/router/router';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';

import { pagesRoutes } from '../routes';

/** Floating "back to the gallery" pill shown on full-page templates. */
export function BackToGallery() {
  const { t } = useTranslation('pages');
  return (
    <Link
      to={pagesRoutes.index.href()}
      className="fixed right-4 bottom-4 z-50 inline-flex items-center gap-1.5 rounded-full border bg-popover/90 px-3 py-1.5 text-xs text-muted-foreground shadow-lg backdrop-blur hover:text-foreground"
    >
      <ArrowLeft className="size-3.5" /> {t('gallery.back')}
    </Link>
  );
}

/** A provider monogram on a neutral chip (no third-party logos bundled). */
function Monogram({ letter, className }: { letter: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-5 items-center justify-center rounded-full text-[0.625rem] font-bold text-overlay-foreground',
        className,
      )}
    >
      {letter}
    </span>
  );
}

/** "Continue with …" buttons. Wire them to your OAuth provider. */
export function SocialButtons({
  onPick,
  className,
}: {
  onPick: (provider: string) => void;
  className?: string;
}) {
  const { t } = useTranslation('pages');
  // theme-exempt: third-party brand colors
  const providers = [
    { key: 'google', letter: 'G', className: 'bg-[#4285f4]' },
    { key: 'github', letter: 'GH', className: 'bg-neutral-800' },
    { key: 'microsoft', letter: 'M', className: 'bg-[#00a4ef]' },
  ] as const;
  return (
    <div className={cn('grid gap-2 sm:grid-cols-3', className)}>
      {providers.map((p) => (
        <Button
          key={p.key}
          type="button"
          variant="outline"
          onClick={() => onPick(t(`auth.providers.${p.key}`))}
        >
          <Monogram letter={p.letter} className={p.className} />
          {t(`auth.providers.${p.key}`)}
        </Button>
      ))}
    </div>
  );
}

/** Thin line with a centered label ("or continue with email"). */
export function Divider({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      {children}
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export function FieldMessage({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return <p className="text-xs text-destructive">{children}</p>;
}
