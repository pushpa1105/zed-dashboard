import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/shared/ui/navigation-menu';

export type MegaMenuLink = {
  id: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  href?: string;
  badge?: ReactNode;
  disabled?: boolean;
};

export type MegaMenuEntry =
  | { id: string; label: string; href: string }
  | {
      id: string;
      label: string;
      /** Columns of links; each column can have a heading. */
      columns: Array<{ heading?: string; links: MegaMenuLink[] }>;
      /** Optional highlighted panel on the right (promo, featured article). */
      feature?: ReactNode;
    };

/**
 * Website-style top menu: plain links plus panels with columns of rich links
 * (icon, title, description) and an optional featured block.
 */
export function MegaMenu({ entries, className }: { entries: MegaMenuEntry[]; className?: string }) {
  return (
    <NavigationMenu viewport={false} className={className}>
      <NavigationMenuList>
        {entries.map((entry) =>
          'href' in entry ? (
            <NavigationMenuItem key={entry.id}>
              <NavigationMenuLink href={entry.href} className="h-9 px-3 text-sm font-medium">
                {entry.label}
              </NavigationMenuLink>
            </NavigationMenuItem>
          ) : (
            <NavigationMenuItem key={entry.id}>
              <NavigationMenuTrigger className="h-9">{entry.label}</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div
                  className={cn(
                    'grid gap-4 p-3',
                    entry.feature ? 'w-[44rem] grid-cols-[1fr_1fr_14rem]' : 'w-[34rem] grid-cols-2',
                  )}
                >
                  {entry.columns.map((col, i) => (
                    <div key={i} className="space-y-1">
                      {col.heading && (
                        <p className="px-2 pb-1 text-[0.6875rem] font-medium tracking-wider text-muted-foreground uppercase">
                          {col.heading}
                        </p>
                      )}
                      {col.links.map((link) => (
                        <NavigationMenuLink
                          key={link.id}
                          href={link.disabled ? undefined : link.href}
                          aria-disabled={link.disabled || undefined}
                          className="flex-row items-start gap-3 rounded-lg p-2 aria-disabled:pointer-events-none aria-disabled:opacity-45"
                        >
                          {link.icon && (
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-background">
                              <link.icon className="size-4" />
                            </span>
                          )}
                          <span className="grid gap-0.5">
                            <span className="flex items-center gap-1.5 text-sm font-medium">
                              {link.title}
                              {link.badge}
                            </span>
                            {link.description && (
                              <span className="line-clamp-2 text-xs text-muted-foreground">
                                {link.description}
                              </span>
                            )}
                          </span>
                        </NavigationMenuLink>
                      ))}
                    </div>
                  ))}
                  {entry.feature && (
                    <div className="rounded-lg bg-muted/60 p-4">{entry.feature}</div>
                  )}
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          ),
        )}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
