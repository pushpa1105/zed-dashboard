import {
  Archive,
  BarChart3,
  Bell,
  BookOpen,
  Boxes,
  Building2,
  ChevronDown,
  Copy,
  CreditCard,
  FileText,
  Folder,
  Inbox,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Mail,
  Pencil,
  Plug,
  Search,
  Settings,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Star,
  Trash2,
  Users,
  Workflow,
} from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Stepper } from '@/shared/components/display/stepper';
import { Tag } from '@/shared/components/display/tag';
import { Breadcrumbs } from '@/shared/components/navigation/breadcrumbs';
import { MegaMenu } from '@/shared/components/navigation/mega-menu';
import { NestedMenu, type NestedMenuGroup } from '@/shared/components/navigation/nested-menu';
import { PaginationBar } from '@/shared/components/navigation/pagination-bar';
import { SubNav } from '@/shared/components/navigation/sub-nav';
import {
  VariantTabs,
  VariantTabsList,
  VariantTabsTrigger,
} from '@/shared/components/navigation/variant-tabs';
import { Button } from '@/shared/ui/button';
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
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
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from '@/shared/ui/menubar';

import { ElementsPage } from '../components/elements-page';
import { Demo, ShowcaseGrid } from '../components/showcase';

const count = (n: number) => (
  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-[0.6875rem] font-medium text-muted-foreground tabular-nums">
    {n}
  </span>
);

const menuGroups: NestedMenuGroup[] = [
  {
    id: 'main',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'inbox', label: 'Inbox', icon: Inbox, badge: count(12) },
    ],
  },
  {
    id: 'commerce',
    label: 'Commerce',
    collapsible: true,
    items: [
      {
        id: 'catalog',
        label: 'Catalog',
        icon: ShoppingBag,
        children: [
          { id: 'products', label: 'Products', badge: count(248) },
          {
            id: 'collections',
            label: 'Collections',
            children: [
              { id: 'summer', label: 'Summer 2026' },
              { id: 'outlet', label: 'Outlet' },
              {
                id: 'drafts',
                label: 'Drafts',
                disabled: true,
                disabledReason: 'Requires the Editor role',
              },
            ],
          },
          { id: 'inventory', label: 'Inventory' },
        ],
      },
      { id: 'customers', label: 'Customers', icon: Users },
      {
        id: 'reports',
        label: 'Reports',
        icon: BarChart3,
        badge: (
          <Tag tone="primary" size="sm" pill>
            New
          </Tag>
        ),
      },
    ],
  },
  {
    id: 'admin',
    label: 'Administration',
    collapsible: true,
    items: [
      { id: 'integrations', label: 'Integrations', icon: Plug },
      {
        id: 'audit',
        label: 'Audit log',
        icon: ShieldCheck,
        disabled: true,
        disabledReason: 'Available on the Enterprise plan',
      },
      { id: 'settings', label: 'Settings', icon: Settings },
    ],
  },
];

export default function MenusPage() {
  const { t } = useTranslation('ui-elements');
  const [active, setActive] = useState('products');
  const [showArchived, setShowArchived] = useState(false);
  const [density, setDensity] = useState('comfortable');
  const [pillTab, setPillTab] = useState('open');
  const [step, setStep] = useState(2);
  const [page, setPage] = useState(4);
  const [pageSize, setPageSize] = useState(20);
  const [loaded, setLoaded] = useState(24);

  return (
    <ElementsPage page="menus">
      <ShowcaseGrid>
        <Demo id="menuNested">
          <div className="max-w-xs">
            <NestedMenu
              groups={menuGroups}
              activeId={active}
              onSelect={(item) => setActive(item.id)}
              defaultOpen={['catalog', 'collections']}
            />
          </div>
          <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">
            {t('menusUi.selected')}: <span className="font-medium text-foreground">{active}</span>
          </p>
        </Demo>
        <Demo id="menuSidebarMini" contentClassName="flex flex-col">
          <div className="flex min-h-[26rem] flex-1 overflow-hidden rounded-xl border bg-background">
            <aside className="sidebar-dark w-56 shrink-0 space-y-4 overflow-y-auto bg-sidebar p-3">
              <div className="flex items-center gap-2 px-1 py-1">
                <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <Building2 className="size-4" />
                </span>
                <span className="text-sm font-semibold text-sidebar-foreground">Northwind</span>
              </div>
              <NestedMenu
                groups={menuGroups}
                activeId={active}
                onSelect={(item) => setActive(item.id)}
                defaultOpen={['catalog']}
              />
            </aside>
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex h-12 items-center gap-2 border-b px-4 text-sm">
                <Search className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">Search…</span>
                <Bell className="ml-auto size-4 text-muted-foreground" />
              </div>
              <div className="grid flex-1 grid-cols-2 gap-3 p-4">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="rounded-lg border bg-card p-3">
                    <div className="h-2 w-16 rounded bg-muted" />
                    <div className="mt-2 h-4 w-20 rounded bg-muted-foreground/20" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Demo>
      </ShowcaseGrid>

      <Demo id="menuMega" contentClassName="min-h-28">
        <div className="flex items-center justify-between rounded-xl border bg-background px-4 py-2">
          <span className="text-sm font-semibold">Orbitly</span>
          <MegaMenu
            entries={[
              {
                id: 'product',
                label: 'Product',
                columns: [
                  {
                    heading: 'Analyze',
                    links: [
                      {
                        id: 'dash',
                        title: 'Dashboards',
                        description: 'Every metric your board asks for.',
                        icon: LayoutDashboard,
                        href: '#',
                      },
                      {
                        id: 'rep',
                        title: 'Reports',
                        description: 'Scheduled PDFs and Slack digests.',
                        icon: FileText,
                        href: '#',
                      },
                      {
                        id: 'alerts',
                        title: 'Alerts',
                        description: 'Know why a number moved.',
                        icon: Bell,
                        href: '#',
                        badge: (
                          <Tag tone="primary" size="sm" pill>
                            New
                          </Tag>
                        ),
                      },
                    ],
                  },
                  {
                    heading: 'Build',
                    links: [
                      {
                        id: 'flows',
                        title: 'Workflows',
                        description: 'Automate the follow-up.',
                        icon: Workflow,
                        href: '#',
                      },
                      {
                        id: 'api',
                        title: 'API & embeds',
                        description: 'Ship analytics inside your product.',
                        icon: Plug,
                        href: '#',
                      },
                      {
                        id: 'inv',
                        title: 'Inventory sync',
                        description: 'Coming in Q1.',
                        icon: Boxes,
                        disabled: true,
                      },
                    ],
                  },
                ],
                feature: (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-primary uppercase">What’s new</p>
                    <p className="text-sm font-semibold">Cohort retention reports</p>
                    <p className="text-xs text-muted-foreground">
                      See which signups stick, by week or month.
                    </p>
                    <Button size="sm" variant="outline" className="mt-1">
                      Read the post
                    </Button>
                  </div>
                ),
              },
              {
                id: 'resources',
                label: 'Resources',
                columns: [
                  {
                    links: [
                      {
                        id: 'docs',
                        title: 'Documentation',
                        description: 'Guides and API reference.',
                        icon: BookOpen,
                        href: '#',
                      },
                      {
                        id: 'help',
                        title: 'Help center',
                        description: 'Answers in minutes.',
                        icon: LifeBuoy,
                        href: '#',
                      },
                    ],
                  },
                  {
                    links: [
                      {
                        id: 'changelog',
                        title: 'Changelog',
                        description: 'Shipped every week.',
                        icon: FileText,
                        href: '#',
                      },
                      {
                        id: 'community',
                        title: 'Community',
                        description: '3,000 analysts trading notes.',
                        icon: Users,
                        href: '#',
                      },
                    ],
                  },
                ],
              },
              { id: 'pricing', label: 'Pricing', href: '#' },
            ]}
          />
          <Button size="sm">Start free</Button>
        </div>
      </Demo>

      <ShowcaseGrid cols={3}>
        <Demo id="menuDropdowns">
          <div className="flex flex-wrap gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Actions <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start">
                <DropdownMenuLabel>Invoice INV-2041</DropdownMenuLabel>
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <Pencil /> Edit <DropdownMenuShortcut>E</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Copy /> Duplicate <DropdownMenuShortcut>Ctrl D</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Share2 /> Share
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem>
                        <Mail /> Email
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy /> Copy link
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled>
                        <CreditCard /> Payment link
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuItem disabled>
                    <Archive /> Archive
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive">
                  <Trash2 /> Delete <DropdownMenuShortcut>Del</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  View <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-52" align="start">
                <DropdownMenuLabel>Show</DropdownMenuLabel>
                <DropdownMenuCheckboxItem checked={showArchived} onCheckedChange={setShowArchived}>
                  Archived items
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked disabled>
                  Required columns
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Density</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={density} onValueChange={setDensity}>
                  <DropdownMenuRadioItem value="compact">Compact</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="comfortable">Comfortable</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="spacious">Spacious</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Account">
                  <Users />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem>
                  <Settings /> Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <LifeBuoy /> Support
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Demo>

        <Demo id="menuContext">
          <ContextMenu>
            <ContextMenuTrigger className="flex h-36 items-center justify-center rounded-xl border-2 border-dashed text-sm text-muted-foreground">
              {t('menusUi.rightClick')}
            </ContextMenuTrigger>
            <ContextMenuContent className="w-56">
              <ContextMenuItem>
                <Folder /> Open <ContextMenuShortcut>Enter</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuItem>
                <Pencil /> Rename <ContextMenuShortcut>F2</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuSub>
                <ContextMenuSubTrigger>
                  <Share2 /> Move to
                </ContextMenuSubTrigger>
                <ContextMenuSubContent>
                  <ContextMenuItem>Design</ContextMenuItem>
                  <ContextMenuItem>Finance</ContextMenuItem>
                  <ContextMenuItem disabled>Legal (read-only)</ContextMenuItem>
                </ContextMenuSubContent>
              </ContextMenuSub>
              <ContextMenuCheckboxItem checked>
                <Star /> Starred
              </ContextMenuCheckboxItem>
              <ContextMenuSeparator />
              <ContextMenuItem variant="destructive">
                <Trash2 /> Move to trash
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </Demo>

        <Demo id="menuMenubar">
          <Menubar className="w-fit">
            <MenubarMenu>
              <MenubarTrigger>File</MenubarTrigger>
              <MenubarContent>
                <MenubarItem>
                  New report <MenubarShortcut>Ctrl N</MenubarShortcut>
                </MenubarItem>
                <MenubarSub>
                  <MenubarSubTrigger>Export</MenubarSubTrigger>
                  <MenubarSubContent>
                    <MenubarItem>CSV</MenubarItem>
                    <MenubarItem>PDF</MenubarItem>
                    <MenubarItem disabled>Excel</MenubarItem>
                  </MenubarSubContent>
                </MenubarSub>
                <MenubarSeparator />
                <MenubarItem>
                  Print <MenubarShortcut>Ctrl P</MenubarShortcut>
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger>Edit</MenubarTrigger>
              <MenubarContent>
                <MenubarItem>
                  Undo <MenubarShortcut>Ctrl Z</MenubarShortcut>
                </MenubarItem>
                <MenubarItem disabled>
                  Redo <MenubarShortcut>Ctrl Y</MenubarShortcut>
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger>View</MenubarTrigger>
              <MenubarContent>
                <MenubarCheckboxItem checked>Grid lines</MenubarCheckboxItem>
                <MenubarCheckboxItem>Full screen</MenubarCheckboxItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </Demo>
      </ShowcaseGrid>

      <ShowcaseGrid>
        <Demo id="menuSegmented">
          <div className="space-y-5">
            <VariantTabs variant="segmented" defaultValue="week">
              <VariantTabsList>
                <VariantTabsTrigger value="day">Day</VariantTabsTrigger>
                <VariantTabsTrigger value="week">Week</VariantTabsTrigger>
                <VariantTabsTrigger value="month">Month</VariantTabsTrigger>
                <VariantTabsTrigger value="year" disabled>
                  Year
                </VariantTabsTrigger>
              </VariantTabsList>
            </VariantTabs>
            <VariantTabs variant="underline" defaultValue="overview">
              <VariantTabsList>
                <VariantTabsTrigger value="overview">Overview</VariantTabsTrigger>
                <VariantTabsTrigger value="activity" count={8}>
                  Activity
                </VariantTabsTrigger>
                <VariantTabsTrigger value="members" count={24}>
                  Members
                </VariantTabsTrigger>
                <VariantTabsTrigger value="billing" disabled>
                  Billing
                </VariantTabsTrigger>
              </VariantTabsList>
            </VariantTabs>
          </div>
        </Demo>
        <Demo id="menuPills">
          <div className="space-y-5">
            <SubNav
              items={[
                { key: 'open', label: 'Open', count: 14 },
                { key: 'pending', label: 'Pending', count: 3 },
                { key: 'closed', label: 'Closed', count: 128 },
              ].map((item) => ({
                ...item,
                active: item.key === pillTab,
                onSelect: () => setPillTab(item.key),
              }))}
            />
            <SubNav
              variant="underline"
              items={[
                { key: 'open', label: 'Open', count: 14 },
                { key: 'pending', label: 'Pending', count: 3 },
                { key: 'closed', label: 'Closed', count: 128 },
              ].map((item) => ({
                ...item,
                active: item.key === pillTab,
                onSelect: () => setPillTab(item.key),
              }))}
            />
          </div>
        </Demo>
      </ShowcaseGrid>

      <ShowcaseGrid>
        <Demo id="menuBreadcrumbs">
          <div className="space-y-4">
            <Breadcrumbs
              items={[
                { key: 'home', label: 'Home', href: '#' },
                { key: 'settings', label: 'Settings' },
              ]}
            />
            <Breadcrumbs
              maxItems={4}
              items={[
                { key: 'ws', label: 'Workspace', href: '#' },
                { key: 'proj', label: 'Projects', href: '#' },
                { key: 'q4', label: 'Q4 launch', href: '#' },
                { key: 'docs', label: 'Documents', href: '#' },
                { key: 'specs', label: 'Specs', href: '#' },
                { key: 'pricing', label: 'Pricing page v3' },
              ]}
            />
          </div>
        </Demo>
        <Demo id="menuStepper">
          <Stepper
            current={step}
            onStepClick={(i) => i < step && setStep(i)}
            steps={[
              { key: 'account', title: 'Account', description: 'Email and password' },
              { key: 'company', title: 'Company', description: 'Name and size' },
              { key: 'team', title: 'Team', description: 'Invite people' },
              { key: 'done', title: 'Done' },
            ]}
          />
          <div className="mt-4 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={step === 0}
              onClick={() => setStep(step - 1)}
            >
              Back
            </Button>
            <Button size="sm" disabled={step === 3} onClick={() => setStep(step + 1)}>
              Next
            </Button>
          </div>
        </Demo>
      </ShowcaseGrid>

      <Demo id="menuPagination">
        <div className="space-y-6">
          <PaginationBar
            page={page}
            totalPages={18}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
          />
          <div className="flex items-center justify-between rounded-lg border px-4 py-2.5">
            <Button
              size="sm"
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground tabular-nums">
              {t('menusUi.paginationCompact', { page, total: 18 })}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={page === 18}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Button
              variant="outline"
              disabled={loaded >= 120}
              onClick={() => setLoaded(Math.min(120, loaded + 24))}
            >
              {t('menusUi.loadMore')}
            </Button>
            <span className="text-xs text-muted-foreground tabular-nums">
              {t('menusUi.loaded', { count: loaded, total: 120 })}
            </span>
          </div>
        </div>
      </Demo>
    </ElementsPage>
  );
}
