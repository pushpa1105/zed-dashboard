import { ChevronsUpDown, LogOut, Settings } from 'lucide-react';
import type { ReactNode } from 'react';

import { hasRole } from '@/core/auth/access';
import { useCurrentUser, useSignOut } from '@/core/auth/session';
import { routes } from '@/core/config/routes';
import { translateLabel } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Link, useNavigate } from '@/core/router/router';
import { getInitials } from '@/shared/lib/format';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/shared/ui/sidebar';

import { useShell } from './nav/use-shell';

function UserMenuContent({ side }: { side: 'top' | 'bottom' }) {
  const { t } = useTranslation(['common', 'settings']);
  const navigate = useNavigate();
  const user = useCurrentUser();
  const signOut = useSignOut();
  const { workspace } = useShell();
  const links = (workspace.accountLinks ?? []).filter((link) => hasRole(user, link.roles));

  return (
    <DropdownMenuContent side={side} align={side === 'top' ? 'start' : 'end'} className="min-w-56">
      <DropdownMenuLabel className="font-normal">
        <span className="block text-sm font-medium">
          {user.firstName} {user.lastName}
        </span>
        <span className="block text-xs text-muted-foreground">{user.email}</span>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      {links.length > 0 && (
        <>
          <DropdownMenuGroup>
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <DropdownMenuItem key={link.id} asChild>
                  <Link to={link.to}>
                    <Icon /> {translateLabel(link.label, t)}
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
        </>
      )}
      <DropdownMenuItem asChild>
        <Link to={routes.settings.href({ tab: 'profile' })}>
          <Settings /> {t('settings:nav')}
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() =>
          signOut.mutate(undefined, { onSettled: () => void navigate(routes.login.href()) })
        }
      >
        <LogOut /> {t('shell.signOut')}
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}

function UserAvatar({ className }: { className?: string }): ReactNode {
  const user = useCurrentUser();
  return (
    <Avatar className={className}>
      <AvatarFallback className="rounded-[inherit] bg-primary/10 text-xs font-medium text-primary">
        {getInitials(user.firstName, user.lastName)}
      </AvatarFallback>
    </Avatar>
  );
}

/** Account menu. `sidebar` renders a full row for the sidebar footer, `header` an avatar button. */
export function UserMenu({ variant = 'sidebar' }: { variant?: 'sidebar' | 'header' }) {
  const { t } = useTranslation();
  const user = useCurrentUser();

  if (variant === 'header') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label={t('shell.account')}
          >
            <UserAvatar className="size-8 rounded-full" />
          </Button>
        </DropdownMenuTrigger>
        <UserMenuContent side="bottom" />
      </DropdownMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
              <UserAvatar className="size-8 rounded-lg" />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {user.firstName} {user.lastName}
                </span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <UserMenuContent side="top" />
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
