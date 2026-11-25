import { Fragment, type ReactNode } from 'react';

import { translateLabel } from '@/core/feature/define-feature';
import { LanguageSwitcher } from '@/core/i18n/components/language-switcher';
import { useTranslation } from '@/core/i18n/use-translation';
import { usePageTitle } from '@/core/layout/page-title';
import { Link } from '@/core/router/router';
import { ModeToggle } from '@/core/theme/components/mode-toggle';
import { ThemeSheet } from '@/core/theme/components/theme-sheet';
import { cn } from '@/shared/lib/cn';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/shared/ui/breadcrumb';

import { CommandMenu } from './command-menu';
import { useShell } from './nav/use-shell';
import { NotificationsMenu } from './notifications-menu';
import { QuickCreateMenu } from './quick-create-menu';
import { UserMenu } from './user-menu';

/** Workspace › parent › page, derived from the active menu trail. */
export function ShellBreadcrumbs({
  className,
  hideRoot = false,
}: {
  className?: string;
  /** Skip the workspace name (when a switcher right before it already shows it). */
  hideRoot?: boolean;
}) {
  const { t } = useTranslation();
  const { workspace, trail, pathname } = useShell();
  const pageTitle = usePageTitle((s) => (s.pathname === pathname ? s.title : null));
  const leaf = trail.at(-1);
  // A page without its own menu entry (detail page, sub-tab) gets a final crumb
  // from its title, unless that title just repeats the menu entry.
  const extra =
    pageTitle &&
    leaf?.to?.split('?')[0] !== pathname &&
    pageTitle !== (leaf && translateLabel(leaf.label, t))
      ? pageTitle
      : null;
  const crumbs = trail;

  return (
    <Breadcrumb className={cn('min-w-0', className)}>
      <BreadcrumbList className="flex-nowrap">
        {!hideRoot && (
          <BreadcrumbItem className="hidden md:inline-flex">
            <BreadcrumbLink asChild>
              <Link to={workspace.basePath}>{translateLabel(workspace.name, t)}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
        )}
        {crumbs.map((node, i) => {
          const last = i === crumbs.length - 1 && !extra;
          return (
            <Fragment key={node.to ?? i}>
              {(i > 0 || !hideRoot) && <BreadcrumbSeparator className="hidden md:block" />}
              <BreadcrumbItem className={cn(!last && 'hidden md:inline-flex')}>
                {last || !node.to ? (
                  <BreadcrumbPage className="truncate">
                    {translateLabel(node.label, t)}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={node.to}>{translateLabel(node.label, t)}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
        {extra && (
          <>
            {(crumbs.length > 0 || !hideRoot) && (
              <BreadcrumbSeparator className="hidden md:block" />
            )}
            <BreadcrumbItem>
              <BreadcrumbPage className="truncate">{extra}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/** Search, the workspace's Create menu, language, notifications, theme, mode and (optionally) the account menu. */
export function ShellActions({
  withUser = false,
  searchVariant = 'field',
  className,
}: {
  withUser?: boolean;
  searchVariant?: 'field' | 'icon';
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <CommandMenu variant={searchVariant} />
      <QuickCreateMenu />
      <LanguageSwitcher />
      <NotificationsMenu />
      <ThemeSheet />
      <ModeToggle />
      {withUser && <UserMenu variant="header" />}
    </div>
  );
}

/** Standard 64px top bar: leading slot, breadcrumbs, actions. */
export function ShellHeader({
  leading,
  withUser,
  className,
  children,
}: {
  leading?: ReactNode;
  withUser?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <header
      className={cn(
        'sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur-md md:px-6',
        className,
      )}
    >
      {leading}
      {children ?? <ShellBreadcrumbs />}
      <ShellActions withUser={withUser} className="ml-auto" />
    </header>
  );
}
