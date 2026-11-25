import type { ElementType, ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

export type SubNavItem = {
  key: string;
  label: ReactNode;
  /** Rendered as a link when set. */
  href?: string;
  onSelect?: () => void;
  active?: boolean;
  count?: ReactNode;
};

export type SubNavProps = {
  items: SubNavItem[];
  /** `pills` rounded chips in a tray (default), `underline` text links with an indicator. */
  variant?: 'pills' | 'underline';
  /**
   * Component used for items with `href`. Pass your router's Link to get
   * client-side navigation (it receives `href` as `to` too).
   */
  linkComponent?: ElementType;
  className?: string;
  'aria-label'?: string;
};

/** Secondary navigation between sibling pages (not tab panels: each item is a route). */
export function SubNav({
  items,
  variant = 'pills',
  linkComponent: LinkComponent = 'a',
  className,
  ...rest
}: SubNavProps) {
  return (
    <nav
      aria-label={rest['aria-label']}
      className={cn(
        'flex items-center gap-1 overflow-x-auto',
        variant === 'pills' && 'w-fit rounded-full bg-muted/70 p-1',
        variant === 'underline' && 'gap-5 border-b',
        className,
      )}
    >
      {items.map((item) => {
        const classes = cn(
          'inline-flex shrink-0 items-center gap-1.5 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground',
          variant === 'pills' && 'h-8 rounded-full px-3.5',
          variant === 'pills' &&
            item.active &&
            'bg-card text-foreground shadow-xs ring-1 ring-border',
          variant === 'underline' && '-mb-px border-b-2 border-transparent pt-1 pb-2.5',
          variant === 'underline' && item.active && 'border-primary text-foreground',
        );
        const content = (
          <>
            {item.label}
            {item.count !== undefined && (
              <span className="rounded-full bg-muted px-1.5 text-xs tabular-nums">
                {item.count}
              </span>
            )}
          </>
        );
        return item.href ? (
          <LinkComponent
            key={item.key}
            href={item.href}
            to={item.href}
            aria-current={item.active ? 'page' : undefined}
            className={classes}
          >
            {content}
          </LinkComponent>
        ) : (
          <button
            key={item.key}
            type="button"
            onClick={item.onSelect}
            aria-current={item.active ? 'page' : undefined}
            className={classes}
          >
            {content}
          </button>
        );
      })}
    </nav>
  );
}
