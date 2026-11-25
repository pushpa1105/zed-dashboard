import { useResolvedThemeMode } from '@/core/theme/engine';
import { cn } from '@/shared/lib/cn';

import { markSvg } from '../config';
import { useBrand } from '../store';

/** The square brand icon: the uploaded mark, or the built-in one in the brand color. */
export function BrandMark({ className, inverted }: { className?: string; inverted?: boolean }) {
  const brand = useBrand();
  const size = cn('size-7 shrink-0', className);
  if (brand.mark) return <img src={brand.mark} alt="" className={cn(size, 'object-contain')} />;

  const [background, foreground] = inverted
    ? ['var(--primary-foreground)', 'var(--primary)']
    : ['var(--primary)', 'var(--primary-foreground)'];
  return (
    <span
      aria-hidden
      className={cn(size, '[&>svg]:size-full')}
      dangerouslySetInnerHTML={{ __html: markSvg(background, foreground) }}
    />
  );
}

/**
 * The brand everywhere it appears: the uploaded logo (per light/dark mode) or
 * mark + name. `inverted` is for brand-colored surfaces.
 */
export function BrandLogo({
  className,
  markClassName,
  showName = true,
  inverted,
}: {
  className?: string;
  markClassName?: string;
  showName?: boolean;
  inverted?: boolean;
}) {
  const brand = useBrand();
  const dark = useResolvedThemeMode() === 'dark' || inverted;
  const logo = (dark && brand.logoDark) || brand.logo;

  if (logo && showName) {
    return <img src={logo} alt={brand.name} className={cn('h-7 w-auto max-w-40', className)} />;
  }
  return (
    <span className={cn('inline-flex min-w-0 items-center gap-2 font-semibold', className)}>
      <BrandMark className={markClassName} inverted={inverted} />
      {showName ? <span className="truncate tracking-tight">{brand.name}</span> : null}
    </span>
  );
}
