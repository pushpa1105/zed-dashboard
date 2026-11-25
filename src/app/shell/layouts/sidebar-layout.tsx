import type { ReactNode } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { cn } from '@/shared/lib/cn';
import { Separator } from '@/shared/ui/separator';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/shared/ui/sidebar';

import { NavTree } from '../nav/nav-tree';
import { useShell } from '../nav/use-shell';
import { ShellHeader } from '../shell-header';
import { UserMenu } from '../user-menu';
import { WorkspaceSwitcher } from '../workspace-switcher';

/**
 * Classic collapsible sidebar. Covers four layouts:
 * `sidebar`, `sidebar-dark` (dark rail, light content), `inset` (content as a
 * rounded card) and `floating` (detached sidebar card).
 */
export function SidebarLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { sections, trail, layout } = useShell();
  const variant = layout === 'inset' || layout === 'floating' ? layout : 'sidebar';

  return (
    <SidebarProvider>
      <Sidebar
        collapsible="icon"
        variant={variant}
        className={cn(layout === 'sidebar-dark' && 'sidebar-dark text-sidebar-foreground')}
      >
        <SidebarHeader className="h-16 justify-center border-b border-sidebar-border/70 px-3 group-data-[variant=floating]:border-b-0 group-data-[variant=inset]:border-b-0">
          <WorkspaceSwitcher />
        </SidebarHeader>
        <SidebarContent className="gap-1 py-2">
          <NavTree sections={sections} trail={trail} />
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border/70 p-2 group-data-[variant=floating]:border-t-0 group-data-[variant=inset]:border-t-0">
          <UserMenu />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset className="min-w-0">
        <ShellHeader
          className="group-has-data-[variant=inset]/sidebar-wrapper:rounded-t-xl"
          leading={
            <>
              <SidebarTrigger className="-ml-1" aria-label={t('shell.toggleSidebar')} />
              <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-5" />
            </>
          }
        />
        <div className="flex-1">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
