import {
  Archive,
  Copy,
  CreditCard,
  FileText,
  FolderOpen,
  Keyboard,
  LogOut,
  MoreHorizontal,
  Pencil,
  Plus,
  Settings,
  Share2,
  Star,
  Trash2,
  User,
  Users,
} from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { notify } from '@/core/notify/notify';
import { Button } from '@/shared/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/shared/ui/command';
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/shared/ui/context-menu';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from '@/shared/ui/menubar';

import { Demo } from './showcase';

function RichDropdown() {
  const { t } = useTranslation('ui-forms');
  const [columns, setColumns] = useState({ status: true, owner: true, updated: false });
  const [density, setDensity] = useState('comfortable');
  return (
    <div className="flex flex-wrap gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">{t('menus.account')}</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="start">
          <DropdownMenuLabel>{t('menus.myAccount')}</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <User /> {t('menus.profile')} <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <CreditCard /> {t('menus.billing')} <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Keyboard /> {t('menus.shortcuts')} <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Users /> {t('menus.invite')}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>{t('menus.byEmail')}</DropdownMenuItem>
              <DropdownMenuItem>{t('menus.byLink')}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>{t('menus.more')}</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem disabled>
            <Settings /> {t('menus.api')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">
            <LogOut /> {t('menus.logout')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">{t('menus.view')}</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-52" align="start">
          <DropdownMenuLabel>{t('menus.columns')}</DropdownMenuLabel>
          {(Object.keys(columns) as Array<keyof typeof columns>).map((key) => (
            <DropdownMenuCheckboxItem
              key={key}
              checked={columns[key]}
              onCheckedChange={(v) => setColumns((c) => ({ ...c, [key]: v === true }))}
              onSelect={(e) => e.preventDefault()}
            >
              {t(`menus.cols.${key}`)}
            </DropdownMenuCheckboxItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuLabel>{t('menus.density')}</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={density} onValueChange={setDensity}>
            <DropdownMenuRadioItem value="compact">{t('menus.compact')}</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="comfortable">
              {t('menus.comfortable')}
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={t('menus.rowActions')}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => notify.info(t('menus.editing'))}>
            <Pencil /> {t('menus.edit')}
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Copy /> {t('menus.duplicate')}
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Archive /> {t('menus.archive')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() =>
              notify.undoable(t('menus.trashed'), () => notify.info(t('dialogs.restored')), {
                undoLabel: t('dialogs.undo'),
              })
            }
          >
            <Trash2 /> {t('menus.delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function ContextMenuDemo() {
  const { t } = useTranslation('ui-forms');
  const [starred, setStarred] = useState(true);
  const [sort, setSort] = useState('name');
  return (
    <ContextMenu>
      <ContextMenuTrigger className="flex h-36 w-full items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground select-none">
        {t('menus.rightClick')}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem>
          <FolderOpen /> {t('menus.open')} <ContextMenuShortcut>↵</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>
          <Pencil /> {t('menus.rename')} <ContextMenuShortcut>F2</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Share2 /> {t('menus.share')}
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-44">
            <ContextMenuItem>{t('menus.copyLink')}</ContextMenuItem>
            <ContextMenuItem>{t('menus.byEmail')}</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuCheckboxItem checked={starred} onCheckedChange={(v) => setStarred(v === true)}>
          {t('menus.starred')}
        </ContextMenuCheckboxItem>
        <ContextMenuSeparator />
        <ContextMenuLabel>{t('menus.sortBy')}</ContextMenuLabel>
        <ContextMenuRadioGroup value={sort} onValueChange={setSort}>
          <ContextMenuRadioItem value="name">{t('menus.sortName')}</ContextMenuRadioItem>
          <ContextMenuRadioItem value="date">{t('menus.sortDate')}</ContextMenuRadioItem>
        </ContextMenuRadioGroup>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive">
          <Trash2 /> {t('menus.delete')} <ContextMenuShortcut>⌫</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function InlineCommand() {
  const { t } = useTranslation('ui-forms');
  const run = (label: string) => notify.message(t('menus.ran', { label }));
  return (
    <Command className="rounded-xl border">
      <CommandInput placeholder={t('menus.commandPlaceholder')} />
      <CommandList className="max-h-64">
        <CommandEmpty>{t('selects.noMatches')}</CommandEmpty>
        <CommandGroup heading={t('menus.suggestions')}>
          <CommandItem onSelect={() => run(t('menus.newDoc'))}>
            <FileText /> {t('menus.newDoc')} <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(t('menus.newProject'))}>
            <Plus /> {t('menus.newProject')}
          </CommandItem>
          <CommandItem onSelect={() => run(t('menus.favorites'))}>
            <Star /> {t('menus.favorites')}
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading={t('menus.settings')}>
          <CommandItem onSelect={() => run(t('menus.profile'))}>
            <User /> {t('menus.profile')} <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(t('menus.billing'))}>
            <CreditCard /> {t('menus.billing')} <CommandShortcut>⌘B</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

function MenubarDemo() {
  const { t } = useTranslation('ui-forms');
  const [ruler, setRuler] = useState(true);
  const [zoom, setZoom] = useState('100');
  return (
    <Menubar className="w-fit">
      <MenubarMenu>
        <MenubarTrigger>{t('menus.file')}</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            {t('menus.newDoc')} <MenubarShortcut>⌘N</MenubarShortcut>
          </MenubarItem>
          <MenubarSub>
            <MenubarSubTrigger>{t('menus.export')}</MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem>PDF</MenubarItem>
              <MenubarItem>CSV</MenubarItem>
              <MenubarItem>PNG</MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
          <MenubarSeparator />
          <MenubarItem>
            {t('menus.print')} <MenubarShortcut>⌘P</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>{t('menus.edit')}</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            {t('menus.undo')} <MenubarShortcut>⌘Z</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            {t('menus.redo')} <MenubarShortcut>⇧⌘Z</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>{t('menus.view')}</MenubarTrigger>
        <MenubarContent>
          <MenubarCheckboxItem checked={ruler} onCheckedChange={(v) => setRuler(v === true)}>
            {t('menus.ruler')}
          </MenubarCheckboxItem>
          <MenubarSeparator />
          <MenubarRadioGroup value={zoom} onValueChange={setZoom}>
            {['75', '100', '150'].map((z) => (
              <MenubarRadioItem key={z} value={z}>
                {z}%
              </MenubarRadioItem>
            ))}
          </MenubarRadioGroup>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}

/** Dropdowns, context menu, inline command palette and a menubar. */
export function MenuDemos() {
  const { t } = useTranslation('ui-forms');
  return (
    <>
      <Demo title={t('menus.dropdowns')} description={t('menus.dropdownsText')}>
        <RichDropdown />
      </Demo>
      <Demo title={t('menus.context')} description={t('menus.contextText')}>
        <ContextMenuDemo />
      </Demo>
      <Demo title={t('menus.command')} description={t('menus.commandText')}>
        <InlineCommand />
      </Demo>
      <Demo title={t('menus.menubar')} description={t('menus.menubarText')} wide>
        <MenubarDemo />
      </Demo>
    </>
  );
}
