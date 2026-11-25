import type { ReactNode } from 'react';

import { MobileNav } from '../mobile-nav';
import { NavList } from '../nav/nav-list';
import { useShell } from '../nav/use-shell';
import { ShellActions, ShellBreadcrumbs } from '../shell-header';
import { WorkspaceSwitcher } from '../workspace-switcher';

/**
 * Boxed: the app sits in a centered frame on a tinted canvas, with its menu
 * inside the frame. Reads like a desktop app; good for admin and ERP tools.
 */
export function BoxedLayout({ children }: { children: ReactNode }) {
  const { sections, trail } = useShell();

  return (
    <div className="min-h-svh bg-muted/60 bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--primary)_10%,transparent),transparent_60%)] pb-8">
      <header className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 md:px-6">
        <MobileNav className="lg:hidden" />
        <WorkspaceSwitcher variant="inline" />
        <span className="hidden text-muted-foreground/50 lg:inline">/</span>
        <ShellBreadcrumbs hideRoot className="hidden lg:flex" />
        <ShellActions withUser className="ml-auto" />
      </header>
      <div className="mx-auto max-w-[1400px] px-2 md:px-6">
        <div className="grid min-h-[calc(100svh-6rem)] overflow-hidden rounded-2xl border bg-card shadow-sm lg:grid-cols-[15.5rem_1fr]">
          <aside className="hidden border-r bg-muted/25 p-3 lg:block">
            <div className="sticky top-3">
              <NavList sections={sections} trail={trail} />
            </div>
          </aside>
          <main className="min-w-0 bg-background">{children}</main>
        </div>
      </div>
    </div>
  );
}
