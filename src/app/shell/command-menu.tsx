import { LayoutGrid, Monitor, Moon, Search, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useSession } from '@/core/auth/session';
import { translateLabel } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { useNavigate } from '@/core/router/router';
import { useThemeStore } from '@/core/theme/store';
import { Kbd } from '@/shared/components/kbd';
import { Button } from '@/shared/ui/button';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/shared/ui/command';

import { modules } from '../modules';
import { filterNav, flattenNav, getCommands, getNavItems, getWorkspaces } from '../registry';

/**
 * ⌘K / Ctrl+K command palette. Pages come from every module's `nav` and every
 * workspace menu, actions from every module's `commands`: new features and
 * dashboards show up here automatically.
 */
export function CommandMenu({ variant = 'field' }: { variant?: 'field' | 'icon' }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: user } = useSession();
  const setMode = useThemeStore((s) => s.setMode);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const run = (action: () => void) => {
    setOpen(false);
    action();
  };

  const pages = getNavItems(modules, user);
  const actions = getCommands(modules, user);
  const workspaces = getWorkspaces(modules);
  const themeModes = [
    { value: 'light', label: t('theme.light'), icon: Sun },
    { value: 'dark', label: t('theme.dark'), icon: Moon },
    { value: 'system', label: t('theme.system'), icon: Monitor },
  ] as const;

  return (
    <>
      {variant === 'field' && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="hidden h-9 w-64 items-center gap-2 rounded-lg border bg-muted/40 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted lg:flex"
        >
          <Search className="size-4" />
          <span className="flex-1 text-left">{t('shell.commandMenu')}</span>
          <Kbd>Ctrl K</Kbd>
        </button>
      )}
      <Button
        variant="ghost"
        size="icon"
        className={variant === 'field' ? 'lg:hidden' : undefined}
        aria-label={t('shell.commandMenu')}
        onClick={() => setOpen(true)}
      >
        <Search />
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen} title={t('shell.commandMenu')}>
        <Command>
          <CommandInput placeholder={t('shell.commandMenu')} />
          <CommandList>
            <CommandEmpty>{t('shell.commandEmpty')}</CommandEmpty>
            <CommandGroup heading={t('shell.commandPages')}>
              {pages.map((item) => (
                <CommandItem key={item.to} onSelect={() => run(() => void navigate(item.to))}>
                  <item.icon /> {translateLabel(item.label, t)}
                </CommandItem>
              ))}
            </CommandGroup>
            {workspaces.length > 0 && (
              <CommandGroup heading={t('navGroups.dashboards')}>
                {workspaces.map((ws) => (
                  <CommandItem
                    key={ws.id}
                    keywords={['dashboard', 'workspace']}
                    onSelect={() => run(() => void navigate(ws.basePath))}
                  >
                    <ws.icon /> {translateLabel(ws.name, t)}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {workspaces.map((ws) => {
              const entries = filterNav(ws.nav, user)
                .flatMap((section) => flattenNav(section.items))
                .filter((node) => !node.disabled && !node.external);
              if (!entries.length) return null;
              const wsName = translateLabel(ws.name, t);
              return (
                <CommandGroup key={ws.id} heading={wsName}>
                  {entries.map((node) => {
                    const Icon = node.icon ?? LayoutGrid;
                    const label = translateLabel(node.label, t);
                    return (
                      <CommandItem
                        key={node.to}
                        value={`${wsName} ${label} ${node.to}`}
                        onSelect={() => run(() => void navigate(node.to!))}
                      >
                        <Icon /> {label}
                        <span className="ml-auto text-xs text-muted-foreground">{wsName}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              );
            })}
            {actions.length > 0 && (
              <CommandGroup heading={t('shell.commandActions')}>
                {actions.map((command) => (
                  <CommandItem
                    key={command.id}
                    keywords={command.keywords}
                    onSelect={() => run(() => void navigate(command.to))}
                  >
                    <command.icon /> {translateLabel(command.label, t)}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            <CommandGroup heading={t('shell.commandTheme')}>
              {themeModes.map(({ value, label, icon: Icon }) => (
                <CommandItem
                  key={value}
                  keywords={['theme', 'mode']}
                  onSelect={() => run(() => setMode(value))}
                >
                  <Icon /> {label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
