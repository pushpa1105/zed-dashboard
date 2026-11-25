import type { ReactNode } from 'react';

import { useSession } from '@/core/auth/session';
import { BrandLogo } from '@/core/brand/components/brand-logo';
import { HOME_AFTER_LOGIN, routes } from '@/core/config/routes';
import { LanguageSwitcher } from '@/core/i18n/components/language-switcher';
import { useTranslation } from '@/core/i18n/use-translation';
import { Link } from '@/core/router/router';
import { ModeToggle } from '@/core/theme/components/mode-toggle';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';

/** Slim marketing header for secondary public pages (gallery, variants). */
export function SimpleHeader({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  const { t } = useTranslation('landing');
  const { data: user } = useSession();

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70',
        className,
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5">
        <Link to={routes.home.href()} aria-label={t('brand')}>
          <BrandLogo />
        </Link>
        {children}
        <div className="ml-auto flex items-center gap-1">
          <LanguageSwitcher />
          <ModeToggle />
          <Button asChild variant={user ? 'default' : 'ghost'} className="ml-1">
            <Link to={user ? HOME_AFTER_LOGIN.href() : routes.login.href()}>
              {user ? t('common.openApp') : t('common.signIn')}
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
