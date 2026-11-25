import { ArrowRight } from 'lucide-react';

import { useSession } from '@/core/auth/session';
import { HOME_AFTER_LOGIN, routes } from '@/core/config/routes';
import { useTranslation } from '@/core/i18n/use-translation';
import { Link } from '@/core/router/router';
import { Button } from '@/shared/ui/button';

/**
 * "Get started" for visitors (→ sign in), "Open the app" once signed in.
 * The e2e smoke test clicks the signed-out variant by its name.
 */
export function PrimaryCta({
  size = 'lg',
  className,
  arrow = true,
}: {
  size?: 'default' | 'lg';
  className?: string;
  arrow?: boolean;
}) {
  const { t } = useTranslation('landing');
  const { data: user } = useSession();

  return (
    <Button size={size} className={className} asChild>
      <Link to={user ? HOME_AFTER_LOGIN.href() : routes.login.href()}>
        {user ? t('common.openApp') : t('common.getStarted')}
        {arrow && <ArrowRight data-icon="inline-end" />}
      </Link>
    </Button>
  );
}
