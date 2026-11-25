import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronsUpDown,
  CreditCard,
  Italic,
  LayoutGrid,
  List,
  Settings,
  Underline,
  User,
  Users,
} from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Link } from '@/core/router/router';
import { Stepper } from '@/shared/components/display/stepper';
import { Breadcrumbs } from '@/shared/components/navigation/breadcrumbs';
import { PageTabs } from '@/shared/components/navigation/page-tabs';
import { PaginationBar } from '@/shared/components/navigation/pagination-bar';
import { SubNav } from '@/shared/components/navigation/sub-nav';
import {
  VariantTabs,
  VariantTabsContent,
  VariantTabsList,
  VariantTabsTrigger,
  type TabsVariant,
} from '@/shared/components/navigation/variant-tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/ui/accordion';
import { Button } from '@/shared/ui/button';
import { ButtonGroup } from '@/shared/ui/button-group';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/shared/ui/carousel';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/ui/collapsible';
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
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/shared/ui/navigation-menu';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/shared/ui/resizable';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group';

import { ElementsPage } from '../components/elements-page';
import { Demo, ShowcaseGrid } from '../components/showcase';

const TAB_VARIANTS: TabsVariant[] = ['underline', 'pills', 'segmented'];

const STEPS = [
  { key: 'details', title: 'Details', description: 'Name and owner' },
  { key: 'data', title: 'Data source', description: 'Connect a source' },
  { key: 'widgets', title: 'Widgets', description: 'Pick charts' },
  { key: 'share', title: 'Share', description: 'Invite the team' },
];

const RELEASES = Array.from({ length: 24 }, (_, i) => ({
  version: `v2.${24 - i}.0`,
  date: new Date(2026, 10, 24 - i * 6).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  }),
}));

const SLIDES = [
  { title: 'Revenue up 12%', body: 'Best month since launch, led by annual plans.' },
  { title: '1,204 new sign-ups', body: 'Organic search drove 48% of them.' },
  { title: 'Churn down to 2.1%', body: 'Onboarding emails are paying off.' },
  { title: 'NPS 61', body: 'Support response time halved this quarter.' },
];

const FAQ = [
  [
    'Can I use a single dashboard template?',
    'Yes. Each template is a feature folder: keep the one you need and delete the others.',
  ],
  [
    'Does it support dark mode?',
    'Every component uses design tokens, so light and dark both work out of the box.',
  ],
  [
    'How do I connect a real API?',
    'Turn off the mock backend and point VITE_APP_API_URL at your server.',
  ],
];

export default function NavigationPage() {
  const { t } = useTranslation('ui-elements');
  const [page, setPage] = useState(6);
  const [pageSize, setPageSize] = useState(20);
  const [step, setStep] = useState(1);
  const [subNav, setSubNav] = useState('overview');
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <ElementsPage page="navigation">
      <ShowcaseGrid>
        <Demo id="tabs" contentClassName="space-y-6">
          {TAB_VARIANTS.map((variant) => (
            <VariantTabs key={variant} variant={variant} defaultValue="overview">
              <VariantTabsList>
                <VariantTabsTrigger value="overview">Overview</VariantTabsTrigger>
                <VariantTabsTrigger
                  value="analytics"
                  count={variant === 'segmented' ? undefined : 12}
                >
                  Analytics
                </VariantTabsTrigger>
                <VariantTabsTrigger value="reports">Reports</VariantTabsTrigger>
                <VariantTabsTrigger value="archived" disabled>
                  Archived
                </VariantTabsTrigger>
              </VariantTabsList>
            </VariantTabs>
          ))}
        </Demo>

        <Demo id="tabsVertical" contentClassName="min-h-56">
          <VariantTabs variant="vertical" defaultValue="profile">
            <VariantTabsList>
              <VariantTabsTrigger value="profile">
                <User /> Profile
              </VariantTabsTrigger>
              <VariantTabsTrigger value="team">
                <Users /> Team
              </VariantTabsTrigger>
              <VariantTabsTrigger value="billing">
                <CreditCard /> Billing
              </VariantTabsTrigger>
              <VariantTabsTrigger value="settings">
                <Settings /> Settings
              </VariantTabsTrigger>
            </VariantTabsList>
            {['profile', 'team', 'billing', 'settings'].map((v) => (
              <VariantTabsContent key={v} value={v} className="rounded-lg border border-dashed p-6">
                <p className="text-sm font-medium capitalize">{v}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Vertical tabs suit settings pages with many sections.
                </p>
              </VariantTabsContent>
            ))}
          </VariantTabs>
        </Demo>

        <Demo id="pageTabs" className="lg:col-span-2">
          <PageTabs
            actions={
              <Button size="sm" variant="outline">
                Export
              </Button>
            }
            tabs={[
              {
                value: 'all',
                label: 'All orders',
                count: 1284,
                content: (
                  <p className="text-sm text-muted-foreground">All orders table goes here.</p>
                ),
              },
              {
                value: 'open',
                label: 'Open',
                count: 46,
                content: <p className="text-sm text-muted-foreground">Open orders.</p>,
              },
              {
                value: 'refunds',
                label: 'Refunds',
                count: 3,
                content: <p className="text-sm text-muted-foreground">Refund requests.</p>,
              },
            ]}
          />
        </Demo>

        <Demo id="subNav" contentClassName="space-y-5">
          <SubNav
            items={['overview', 'members', 'integrations', 'billing'].map((key) => ({
              key,
              label: key[0]!.toUpperCase() + key.slice(1),
              active: subNav === key,
              onSelect: () => setSubNav(key),
              count: key === 'members' ? 18 : undefined,
            }))}
          />
          <SubNav
            variant="underline"
            items={['overview', 'members', 'integrations', 'billing'].map((key) => ({
              key,
              label: key[0]!.toUpperCase() + key.slice(1),
              active: subNav === key,
              onSelect: () => setSubNav(key),
            }))}
          />
        </Demo>

        <Demo id="breadcrumbs" contentClassName="space-y-4">
          <Breadcrumbs
            linkComponent={Link}
            items={[
              { key: 'home', label: 'Home', href: '/app' },
              { key: 'projects', label: 'Projects', href: '/app/dashboards/projects' },
              { key: 'atlas', label: 'Atlas' },
            ]}
          />
          <Breadcrumbs
            linkComponent={Link}
            maxItems={4}
            items={[
              { key: 'home', label: 'Home', href: '/app' },
              { key: 'org', label: 'Northwind', href: '/app' },
              { key: 'ws', label: 'Workspaces', href: '/app' },
              { key: 'fin', label: 'Finance', href: '/app/dashboards/finance' },
              { key: 'rep', label: 'Reports', href: '/app' },
              { key: 'q4', label: 'Q4 board pack' },
            ]}
          />
        </Demo>

        <Demo id="pagination" className="lg:col-span-2">
          <PaginationBar
            page={page}
            totalPages={32}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            summary={
              <span className="tabular-nums">
                {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, 634)} of 634
              </span>
            }
          />
        </Demo>

        <Demo id="stepper" className="lg:col-span-2" contentClassName="space-y-8">
          <Stepper steps={STEPS} current={step} onStepClick={(i) => i < step && setStep(i)} />
          <div className="grid gap-8 md:grid-cols-[1fr_auto]">
            <Stepper steps={STEPS} current={step} orientation="vertical" />
            <div className="flex items-end gap-2">
              <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
                {t('demo.back')}
              </Button>
              <Button disabled={step === STEPS.length} onClick={() => setStep((s) => s + 1)}>
                {t('demo.next')}
              </Button>
            </div>
          </div>
        </Demo>

        <Demo id="menubar">
          <Menubar className="w-fit">
            <MenubarMenu>
              <MenubarTrigger>File</MenubarTrigger>
              <MenubarContent>
                <MenubarItem>
                  New dashboard <MenubarShortcut>Ctrl N</MenubarShortcut>
                </MenubarItem>
                <MenubarItem>Duplicate</MenubarItem>
                <MenubarSub>
                  <MenubarSubTrigger>Export as</MenubarSubTrigger>
                  <MenubarSubContent>
                    <MenubarItem>CSV</MenubarItem>
                    <MenubarItem>PDF</MenubarItem>
                    <MenubarItem>PNG</MenubarItem>
                  </MenubarSubContent>
                </MenubarSub>
                <MenubarSeparator />
                <MenubarItem variant="destructive">Delete</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger>View</MenubarTrigger>
              <MenubarContent>
                <MenubarCheckboxItem checked>Show grid</MenubarCheckboxItem>
                <MenubarCheckboxItem>Show legend</MenubarCheckboxItem>
                <MenubarSeparator />
                <MenubarRadioGroup value="comfortable">
                  <MenubarRadioItem value="compact">Compact</MenubarRadioItem>
                  <MenubarRadioItem value="comfortable">Comfortable</MenubarRadioItem>
                </MenubarRadioGroup>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger>Help</MenubarTrigger>
              <MenubarContent>
                <MenubarItem>Documentation</MenubarItem>
                <MenubarItem>Keyboard shortcuts</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </Demo>

        <Demo id="navigationMenu" contentClassName="min-h-24">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Product</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[420px] grid-cols-2 gap-1 p-2">
                    {[
                      ['Dashboards', 'Seven ready-made templates'],
                      ['Data tables', 'Sorting, filters, resizing'],
                      ['Charts', 'Area, bar, donut and more'],
                      ['Forms', 'Inputs and complex selects'],
                    ].map(([title, desc]) => (
                      <li key={title}>
                        <NavigationMenuLink asChild>
                          <a href="#navigationMenu" className="block rounded-md p-3">
                            <p className="text-sm font-medium">{title}</p>
                            <p className="text-xs text-muted-foreground">{desc}</p>
                          </a>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-56 gap-1 p-2">
                    {['Docs', 'Changelog', 'Community'].map((item) => (
                      <li key={item}>
                        <NavigationMenuLink asChild>
                          <a href="#navigationMenu" className="block rounded-md px-3 py-2 text-sm">
                            {item}
                          </a>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <a href="#navigationMenu" className="px-3 py-2 text-sm font-medium">
                    Pricing
                  </a>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </Demo>

        <Demo id="accordion">
          <Accordion type="single" collapsible defaultValue="0">
            {FAQ.map(([q, a], i) => (
              <AccordionItem key={q} value={String(i)}>
                <AccordionTrigger>{q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Demo>

        <Demo id="collapsible">
          <Collapsible open={moreOpen} onOpenChange={setMoreOpen} className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">3 integrations connected</p>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  {moreOpen ? t('demo.showLess') : t('demo.showMore')} <ChevronsUpDown />
                </Button>
              </CollapsibleTrigger>
            </div>
            <div className="rounded-md border px-3 py-2 font-mono text-sm">Stripe</div>
            <CollapsibleContent className="space-y-2">
              {['Slack', 'HubSpot', 'Postgres'].map((name) => (
                <div key={name} className="rounded-md border px-3 py-2 font-mono text-sm">
                  {name}
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </Demo>

        <Demo id="carousel" contentClassName="px-12">
          <Carousel opts={{ align: 'start' }}>
            <CarouselContent>
              {SLIDES.map((slide, i) => (
                <CarouselItem key={slide.title} className="sm:basis-1/2">
                  <div
                    className="flex h-36 flex-col justify-end rounded-xl p-4"
                    style={{
                      background: `color-mix(in srgb, var(--chart-${i + 1}) 12%, var(--card))`,
                    }}
                  >
                    <p className="font-semibold">{slide.title}</p>
                    <p className="text-sm text-muted-foreground">{slide.body}</p>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </Demo>

        <Demo id="resizable">
          <ResizablePanelGroup orientation="horizontal" className="min-h-48 rounded-lg border">
            <ResizablePanel defaultSize="28%" minSize="15%">
              <div className="flex h-full items-center justify-center p-4 text-sm text-muted-foreground">
                Sidebar
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize="72%">
              <ResizablePanelGroup orientation="vertical">
                <ResizablePanel defaultSize="60%">
                  <div className="flex h-full items-center justify-center p-4 text-sm text-muted-foreground">
                    Editor
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize="40%">
                  <div className="flex h-full items-center justify-center p-4 text-sm text-muted-foreground">
                    Console
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        </Demo>

        <Demo id="scrollArea">
          <ScrollArea className="h-48 rounded-lg border">
            <ul className="divide-y">
              {RELEASES.map((r) => (
                <li key={r.version} className="flex justify-between px-4 py-2 text-sm">
                  <span className="font-mono">{r.version}</span>
                  <span className="text-muted-foreground">{r.date}</span>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </Demo>

        <Demo id="toggles" contentClassName="flex flex-wrap items-center gap-4">
          <ToggleGroup type="multiple" variant="outline" defaultValue={['bold']}>
            <ToggleGroupItem value="bold" aria-label="Bold">
              <Bold />
            </ToggleGroupItem>
            <ToggleGroupItem value="italic" aria-label="Italic">
              <Italic />
            </ToggleGroupItem>
            <ToggleGroupItem value="underline" aria-label="Underline">
              <Underline />
            </ToggleGroupItem>
          </ToggleGroup>
          <ToggleGroup type="single" variant="outline" defaultValue="left">
            <ToggleGroupItem value="left" aria-label="Align left">
              <AlignLeft />
            </ToggleGroupItem>
            <ToggleGroupItem value="center" aria-label="Align center">
              <AlignCenter />
            </ToggleGroupItem>
            <ToggleGroupItem value="right" aria-label="Align right">
              <AlignRight />
            </ToggleGroupItem>
          </ToggleGroup>
          <ToggleGroup type="single" defaultValue="grid">
            <ToggleGroupItem value="grid" aria-label="Grid view">
              <LayoutGrid />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List view">
              <List />
            </ToggleGroupItem>
          </ToggleGroup>
          <ButtonGroup>
            <Button variant="outline">Day</Button>
            <Button variant="outline">Week</Button>
            <Button variant="outline">Month</Button>
          </ButtonGroup>
        </Demo>
      </ShowcaseGrid>
    </ElementsPage>
  );
}
