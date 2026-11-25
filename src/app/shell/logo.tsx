import { BrandLogo } from '@/core/brand/components/brand-logo';
import { routes } from '@/core/config/routes';
import { Link } from '@/core/router/router';

export function Logo({ className, to = routes.home.href() }: { className?: string; to?: string }) {
  return (
    <Link to={to} className={className}>
      <BrandLogo />
    </Link>
  );
}
