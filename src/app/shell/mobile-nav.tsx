import { Menu } from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/shared/ui/sheet';

import { NavList } from './nav/nav-list';
import { useShell } from './nav/use-shell';
import { WorkspaceSwitcher } from './workspace-switcher';

/** Hamburger + sheet with the full menu, for layouts whose menu hides on small screens. */
export function MobileNav({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { sections, trail } = useShell();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('-ml-1', className)}
          aria-label={t('shell.openMenu')}
        >
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[18rem] gap-0 p-0">
        <SheetHeader className="border-b p-3">
          <SheetTitle className="sr-only">{t('shell.openMenu')}</SheetTitle>
          <WorkspaceSwitcher />
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-3">
          <NavList sections={sections} trail={trail} onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
