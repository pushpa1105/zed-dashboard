import { ArrowUpRight } from 'lucide-react';
import type { HTMLAttributes, ReactNode, Ref } from 'react';

import { translateLabel, type NavBadge, type NavNode } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Link } from '@/core/router/router';
import { cn } from '@/shared/lib/cn';

import { useShell } from './use-shell';

const TONE_CLASS = {
  default: 'bg-muted text-muted-foreground',
  primary: 'bg-primary text-primary-foreground',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/20 text-foreground',
  danger: 'bg-destructive/15 text-destructive',
} as const;

/** Count or short tag next to a menu entry. */
export function NavBadgeView({ badge, className }: { badge: NavBadge; className?: string }) {
  const { t } = useTranslation();
  const { label, tone = 'default' } =
    typeof badge === 'object' ? badge : { label: badge, tone: 'default' as const };
  return (
    <span
      className={cn(
        'inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[0.6875rem] leading-none font-medium tabular-nums',
        TONE_CLASS[tone],
        className,
      )}
    >
      {typeof label === 'function' ? translateLabel(label, t) : label}
    </span>
  );
}

/**
 * Renders the right element for an entry: a router link, an external link,
 * or an inert span when disabled. Every layout uses it so behavior is identical.
 */
export function NavAnchor({
  node,
  className,
  children,
  onNavigate,
  hideExternalIcon,
  ...rest
}: {
  node: NavNode;
  /** Icon-only buttons (rail) have no room for the ↗ marker. */
  hideExternalIcon?: boolean;
  className?: string;
  children: ReactNode;
  onNavigate?: () => void;
} & Omit<HTMLAttributes<HTMLElement>, 'children' | 'className'> & {
    ref?: Ref<HTMLAnchorElement>;
  } & Record<`data-${string}`, string | boolean | undefined>) {
  const { preload } = useShell();
  if (node.disabled || !node.to) {
    return (
      <span aria-disabled={node.disabled || undefined} className={className} {...rest}>
        {children}
      </span>
    );
  }
  if (node.external) {
    return (
      <a
        href={node.to}
        target="_blank"
        rel="noreferrer"
        className={className}
        onClick={onNavigate}
        {...rest}
      >
        {children}
        {!hideExternalIcon && <ArrowUpRight className="ml-auto size-3.5 opacity-60" aria-hidden />}
      </a>
    );
  }
  const to = node.to;
  return (
    <Link
      to={to}
      className={className}
      onClick={onNavigate}
      onPointerEnter={() => preload(to)}
      onFocus={() => preload(to)}
      {...rest}
    >
      {children}
    </Link>
  );
}
