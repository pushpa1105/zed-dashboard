import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { findActiveSection } from '@/app/registry';
import { useTranslation } from '@/core/i18n/use-translation';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';

import { MobileNav } from '../mobile-nav';
import { NavList } from '../nav/nav-list';
import { useNavLabel } from '../nav/use-nav-label';
import { useShell } from '../nav/use-shell';
import { ShellHeader } from '../shell-header';
import { UserMenu } from '../user-menu';
import { WorkspaceSwitcher } from '../workspace-switcher';

/**
 * Two-level navigation: a narrow rail of sections, and a panel listing the
 * chosen section's pages. Picking a section only swaps the panel; it does not
 * navigate. The panel can be hidden for more room.
 */
export function DualLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const label = useNavLabel();
  const { sections, trail } = useShell();
  const routeSection = findActiveSection(sections, trail);
  const [picked, setPicked] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const current = sections.find((s) => s.id === picked) ?? routeSection;

  return (
    <div className="min-h-svh bg-background">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden border-r bg-sidebar md:flex',
          panelOpen ? 'w-[19rem]' : 'w-[4.5rem]',
        )}
      >
        <div className="flex w-[4.5rem] shrink-0 flex-col items-center gap-2 border-r py-3">
          <WorkspaceSwitcher variant="compact" />
          <nav className="mt-3 scrollbar-none flex min-h-0 flex-1 flex-col items-center gap-1 overflow-y-auto">
            {sections.map((section) => {
              const Icon = section.icon ?? section.items[0]?.icon;
              const text = section.label ? label({ label: section.label }) : section.id;
              const active = current?.id === section.id;
              return (
                <Tooltip key={section.id}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => {
                        setPicked(section.id);
                        setPanelOpen(true);
                      }}
                      aria-label={text}
                      aria-pressed={active}
                      className={cn(
                        'flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground [&>svg]:size-[1.15rem]',
                        active &&
                          'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary',
                      )}
                    >
                      {Icon && <Icon />}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">{text}</TooltipContent>
                </Tooltip>
              );
            })}
          </nav>
          <UserMenu variant="header" />
        </div>
        {panelOpen && current && (
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex h-16 shrink-0 items-center justify-between border-b px-4">
              <p className="truncate text-sm font-semibold">
                {current.label ? label({ label: current.label }) : null}
              </p>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setPanelOpen(false)}
                aria-label={t('shell.toggleSidebar')}
              >
                <PanelLeftClose />
              </Button>
            </div>
            <div className="flex-1 scrollbar-hover overflow-y-auto p-3">
              <NavList sections={[current]} trail={trail} showSectionLabels={false} />
            </div>
          </div>
        )}
      </aside>
      <div
        className={cn(
          'flex min-h-svh min-w-0 flex-col transition-[padding]',
          panelOpen ? 'md:pl-[19rem]' : 'md:pl-[4.5rem]',
        )}
      >
        <ShellHeader
          leading={
            <>
              <MobileNav className="md:hidden" />
              {!panelOpen && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="-ml-1 hidden md:inline-flex"
                  onClick={() => setPanelOpen(true)}
                  aria-label={t('shell.toggleSidebar')}
                >
                  <PanelLeftOpen />
                </Button>
              )}
            </>
          }
        />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
