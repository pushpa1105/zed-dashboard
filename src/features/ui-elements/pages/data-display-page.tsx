import {
  BarChart3,
  Bell,
  CalendarCheck,
  CircleDollarSign,
  CreditCard,
  FileText,
  Folder,
  FolderOpen,
  GitBranch,
  Image,
  Layers,
  MessageSquare,
  MoreHorizontal,
  Package,
  Rocket,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { MeterList } from '@/shared/components/dashboard/meter-list';
import { StatCard } from '@/shared/components/dashboard/stat-card';
import { StatStrip } from '@/shared/components/dashboard/stat-strip';
import { ActivityFeed } from '@/shared/components/display/activity-feed';
import { AvatarStack } from '@/shared/components/display/avatar-stack';
import { CodeBlock } from '@/shared/components/display/code-block';
import { Countdown } from '@/shared/components/display/countdown';
import { DescriptionList } from '@/shared/components/display/description-list';
import { FeatureCard } from '@/shared/components/display/feature-card';
import { FileItem } from '@/shared/components/display/file-item';
import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { KanbanBoard, type KanbanColumn } from '@/shared/components/display/kanban-board';
import { KbdCombo } from '@/shared/components/display/kbd-combo';
import { KeyValueGrid } from '@/shared/components/display/key-value-grid';
import { ListCard } from '@/shared/components/display/list-card';
import { NumberTicker } from '@/shared/components/display/number-ticker';
import { PricingCard } from '@/shared/components/display/pricing-card';
import { ProfileCard } from '@/shared/components/display/profile-card';
import { RatingStars } from '@/shared/components/display/rating-stars';
import { StatusBadge } from '@/shared/components/display/status-badge';
import { Tag } from '@/shared/components/display/tag';
import { Timeline } from '@/shared/components/display/timeline';
import { TONES, type Tone } from '@/shared/components/display/tone';
import { TreeView, type TreeNode } from '@/shared/components/display/tree-view';
import { UserCell } from '@/shared/components/display/user-cell';
import { Button } from '@/shared/ui/button';

import { ElementsPage } from '../components/elements-page';
import { Demo, ShowcaseGrid } from '../components/showcase';
import { people } from '../data/samples';

type Task = {
  id: string;
  title: string;
  tag: string;
  tone: Tone;
  assignees: string[];
  due: string;
};

const INITIAL_BOARD: KanbanColumn<Task>[] = [
  {
    id: 'backlog',
    title: 'Backlog',
    color: 'var(--muted-foreground)',
    cards: [
      {
        id: 't1',
        title: 'Audit onboarding emails',
        tag: 'Marketing',
        tone: 'magenta',
        assignees: ['Priya Nair'],
        due: 'Dec 12',
      },
      {
        id: 't2',
        title: 'Usage-based billing spec',
        tag: 'Billing',
        tone: 'orange',
        assignees: ['Leo Park', 'Tom Becker'],
        due: 'Dec 18',
      },
    ],
  },
  {
    id: 'progress',
    title: 'In progress',
    color: 'var(--chart-4)',
    cards: [
      {
        id: 't3',
        title: 'Dashboard filters v2',
        tag: 'Product',
        tone: 'violet',
        assignees: ['Hannah Morgan', 'Kenji Watanabe', 'Amara Okafor'],
        due: 'Dec 4',
      },
      {
        id: 't4',
        title: 'Migrate exports to queue',
        tag: 'Platform',
        tone: 'blue',
        assignees: ['Diego Ramírez'],
        due: 'Dec 6',
      },
    ],
  },
  {
    id: 'review',
    title: 'In review',
    color: 'var(--chart-1)',
    cards: [
      {
        id: 't5',
        title: 'SSO for enterprise plans',
        tag: 'Security',
        tone: 'aqua',
        assignees: ['Sofia Lindqvist'],
        due: 'Nov 29',
      },
    ],
  },
  {
    id: 'done',
    title: 'Done',
    color: 'var(--success)',
    cards: [
      {
        id: 't6',
        title: 'Invoice PDF redesign',
        tag: 'Billing',
        tone: 'orange',
        assignees: ['Tom Becker', 'Leo Park'],
        due: 'Nov 21',
      },
    ],
  },
];

const TREE: TreeNode[] = [
  {
    id: 'src',
    label: 'src',
    icon: FolderOpen,
    children: [
      {
        id: 'features',
        label: 'features',
        icon: Folder,
        meta: '14',
        children: [
          { id: 'finance', label: 'dashboard-finance', icon: Folder, meta: '9' },
          { id: 'saas', label: 'dashboard-saas', icon: Folder, meta: '7' },
        ],
      },
      {
        id: 'shared',
        label: 'shared',
        icon: Folder,
        children: [
          { id: 'charts', label: 'charts', icon: Folder, meta: '11' },
          { id: 'display', label: 'display', icon: Folder, meta: '28' },
        ],
      },
      { id: 'main', label: 'main.tsx', icon: FileText, meta: '1.2 KB' },
    ],
  },
  { id: 'readme', label: 'README.md', icon: FileText, meta: '7.4 KB' },
];

const TONE_NAMES = Object.keys(TONES) as Tone[];
const STATUSES = [
  'active',
  'pending',
  'processing',
  'shipped',
  'review',
  'draft',
  'failed',
  'overdue',
];

const SNIPPET = `import { StatCard } from '@/shared/components/dashboard/stat-card';

export function Revenue() {
  return (
    <StatCard label="Revenue" value="$48,210" delta={12.4} sparkline={[4, 6, 5, 8, 9]} />
  );
}`;

export default function DataDisplayPage() {
  const { t } = useTranslation('ui-elements');
  const [board, setBoard] = useState(INITIAL_BOARD);
  const [selected, setSelected] = useState<string | null>('display');
  const [tags, setTags] = useState(['React', 'Dashboards', 'Analytics', 'Design system']);
  const [ticker, setTicker] = useState(48_210);
  const [launch] = useState(() => Date.now() + 3 * 86_400_000 + 5 * 3_600_000);

  return (
    <ElementsPage page="dataDisplay">
      <Demo id="statCards" contentClassName="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total balance"
            value="$143,624"
            icon={Wallet}
            delta={8.2}
            hint="vs last month"
          />
          <StatCard
            label="Active users"
            value="12,480"
            delta={4.1}
            hint="vs last week"
            sparkline={[30, 28, 31, 33, 32, 36, 35, 38]}
            color="var(--chart-2)"
          />
          <StatCard
            label="Monthly revenue"
            value="$48,210"
            icon={CircleDollarSign}
            delta={12.4}
            hint="vs October"
            variant="accent"
          />
          <StatCard
            label="Infra costs"
            value="$9,274"
            icon={Zap}
            delta={6.3}
            invert
            hint="higher is worse"
            color="var(--chart-3)"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard variant="tile" label="Projects" value="38" icon={Layers} delta={5} />
          <StatCard
            variant="tile"
            label="Requests"
            value="3,456"
            icon={Zap}
            color="var(--chart-4)"
          />
          <StatCard
            variant="tile"
            label="Shipments"
            value="8,472"
            icon={Truck}
            delta={-2.4}
            color="var(--chart-3)"
          />
          <StatCard
            variant="tile"
            label="Storage"
            value="128 / 500 GB"
            icon={Package}
            color="var(--chart-5)"
            loading
          />
        </div>
      </Demo>

      <ShowcaseGrid>
        <Demo id="statStrip">
          <StatStrip
            items={[
              { key: 'a', label: 'New candidates', value: '35', delta: 12, hint: 'in last 7 days' },
              { key: 'b', label: 'Applications', value: '49', delta: 6.5, hint: 'in last 7 days' },
              { key: 'c', label: 'Hired', value: '7', delta: -3, hint: 'this quarter' },
            ]}
          />
        </Demo>
        <Demo id="meters">
          <MeterList
            items={[
              { key: 'projects', label: 'Projects', value: 1, max: 3 },
              { key: 'users', label: 'Seats', value: 4, max: 5 },
              {
                key: 'req',
                label: 'Requests / day',
                value: 7_500,
                max: 10_000,
                display: '7.5k / 10k',
              },
            ]}
          />
        </Demo>

        <Demo id="tags" contentClassName="space-y-4">
          {(['soft', 'outline', 'solid'] as const).map((appearance) => (
            <div key={appearance} className="flex flex-wrap gap-1.5">
              {TONE_NAMES.map((tone) => (
                <Tag key={tone} tone={tone} appearance={appearance} dot={appearance !== 'solid'}>
                  {tone}
                </Tag>
              ))}
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-1.5 border-t pt-4">
            {tags.map((tag) => (
              <Tag
                key={tag}
                tone="primary"
                pill
                onRemove={() => setTags((all) => all.filter((x) => x !== tag))}
              >
                {tag}
              </Tag>
            ))}
            <Tag size="sm" icon={Sparkles} tone="violet">
              New
            </Tag>
            <Tag size="lg" icon={ShieldCheck} tone="success" appearance="outline">
              Verified
            </Tag>
          </div>
        </Demo>

        <Demo id="status" contentClassName="space-y-4">
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <StatusBadge key={s} status={s} />
            ))}
          </div>
          <div className="flex flex-wrap gap-4 border-t pt-4">
            {STATUSES.slice(0, 5).map((s) => (
              <StatusBadge key={s} status={s} variant="dot" />
            ))}
          </div>
        </Demo>

        <Demo id="avatars" contentClassName="space-y-5">
          <div className="flex flex-wrap items-end gap-3">
            {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size, i) => (
              <InitialsAvatar
                key={size}
                name={people[i]!}
                size={size}
                status={(['online', 'away', 'offline', undefined, 'online'] as const)[i]}
              />
            ))}
            <InitialsAvatar name="Northwind Labs" size="lg" shape="square" />
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <AvatarStack names={people} max={4} />
            <AvatarStack names={people.slice(0, 3)} size="md" />
            <AvatarStack names={people} max={2} size="xs" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <UserCell name="Hannah Morgan" secondary="hannah@northwind.io" status="online" />
            <UserCell name="Kenji Watanabe" secondary="Staff engineer" size="md" />
          </div>
        </Demo>

        <Demo id="profile">
          <ProfileCard
            name="Amara Okafor"
            role="Head of Product · Lagos"
            status="online"
            stats={[
              { label: 'Projects', value: 24 },
              { label: 'Reviews', value: 186 },
              { label: 'Rating', value: '4.9' },
            ]}
            actions={
              <>
                <Button variant="outline" size="sm">
                  <MessageSquare /> {t('demo.message')}
                </Button>
                <Button size="sm">{t('demo.follow')}</Button>
              </>
            }
          >
            <div className="flex flex-wrap gap-1.5">
              <Tag tone="violet">Strategy</Tag>
              <Tag tone="aqua">Research</Tag>
              <Tag tone="blue">Roadmaps</Tag>
            </div>
          </ProfileCard>
        </Demo>

        <Demo id="product">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                name: 'Aurora desk lamp',
                price: '$129',
                rating: 4.6,
                reviews: 1284,
                tone: 'violet' as Tone,
                badge: 'Bestseller',
              },
              {
                name: 'Nordic oak chair',
                price: '$349',
                rating: 4.2,
                reviews: 512,
                tone: 'aqua' as Tone,
                badge: 'New',
              },
            ].map((p) => (
              <div key={p.name} className="overflow-hidden rounded-xl border bg-card">
                <div
                  className="flex aspect-[4/3] items-center justify-center"
                  style={{ background: `color-mix(in srgb, ${TONES[p.tone]} 10%, var(--muted))` }}
                >
                  <Image className="size-8 text-muted-foreground/50" aria-hidden />
                </div>
                <div className="space-y-2 p-4">
                  <Tag size="sm" tone={p.tone}>
                    {p.badge}
                  </Tag>
                  <p className="font-medium">{p.name}</p>
                  <RatingStars value={p.rating} showValue count={p.reviews} />
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-lg font-semibold tabular-nums">{p.price}</span>
                    <Button size="sm" variant="outline">
                      <ShoppingBag /> {t('demo.addToCart')}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Demo>
      </ShowcaseGrid>

      <Demo id="pricing">
        <div className="grid gap-4 md:grid-cols-3">
          <PricingCard
            name="Starter"
            price="$0"
            period={t('demo.perMonth')}
            description="For side projects and trying things out."
            features={['1 dashboard', '3 data sources', 'Community support']}
            action={<Button variant="outline">{t('demo.currentPlan')}</Button>}
          />
          <PricingCard
            name="Team"
            price="$49"
            period={t('demo.perMonth')}
            description="For growing teams that live in their data."
            features={[
              'Unlimited dashboards',
              '25 data sources',
              'Scheduled reports',
              'Priority support',
            ]}
            action={<Button>{t('demo.choosePlan')}</Button>}
            highlighted
            badge={t('demo.mostPopular')}
          />
          <PricingCard
            name="Enterprise"
            price="$199"
            period={t('demo.perMonth')}
            description="Security, controls and support at scale."
            features={['SSO & SCIM', 'Audit log', 'Custom contracts', 'Dedicated manager']}
            action={<Button variant="outline">{t('demo.choosePlan')}</Button>}
          />
        </div>
      </Demo>

      <Demo id="features">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon={BarChart3}
            title="Live dashboards"
            description="Charts refresh as data lands, no reloads."
          />
          <FeatureCard
            icon={Bell}
            title="Smart alerts"
            description="Get notified when a metric drifts."
            color="var(--chart-3)"
          />
          <FeatureCard
            icon={Users}
            title="Shared workspaces"
            description="Roles and permissions per team."
            color="var(--chart-2)"
          />
          <FeatureCard
            icon={Rocket}
            title="Fast exports"
            description="CSV, PDF and scheduled email reports."
            color="var(--chart-4)"
            footer={
              <a className="font-medium text-primary hover:underline" href="#features">
                {t('demo.learnMore')}
              </a>
            }
          />
        </div>
      </Demo>

      <ShowcaseGrid>
        <Demo id="timeline">
          <Timeline
            items={[
              {
                key: '1',
                title: 'Order placed',
                description: '3 items · $482.00',
                time: '09:12',
                icon: ShoppingBag,
              },
              {
                key: '2',
                title: 'Payment captured',
                description: 'Visa ending 4242',
                time: '09:13',
                icon: CreditCard,
                tone: 'success',
              },
              {
                key: '3',
                title: 'Packed at Rotterdam hub',
                time: '14:40',
                icon: Package,
                tone: 'blue',
              },
              {
                key: '4',
                title: 'Out for delivery',
                description: 'Estimated arrival 16:00–18:00',
                time: 'Today',
                icon: Truck,
                tone: 'warning',
              },
            ]}
          />
        </Demo>

        <Demo id="activity">
          <ActivityFeed
            entries={[
              {
                key: '1',
                actor: 'Hannah Morgan',
                action: 'commented on',
                target: 'Q4 roadmap',
                time: '4 min ago',
                detail: 'Can we move the billing work ahead of SSO?',
                unread: true,
              },
              {
                key: '2',
                actor: 'Leo Park',
                action: 'merged',
                target: 'feat/export-queue',
                time: '1 h ago',
              },
              {
                key: '3',
                actor: 'Priya Nair',
                action: 'invited',
                target: 'Tom Becker',
                time: 'Yesterday',
              },
            ]}
          />
        </Demo>

        <Demo id="list">
          <ListCard
            rows={[
              {
                key: '1',
                media: <InitialsAvatar name="Northwind Labs" shape="square" />,
                title: 'Northwind Labs',
                subtitle: 'Enterprise · renewal Mar 2027',
                meta: <span className="font-medium tabular-nums">$24,000</span>,
                action: (
                  <Button variant="ghost" size="icon-sm" aria-label="More">
                    <MoreHorizontal />
                  </Button>
                ),
              },
              {
                key: '2',
                media: <InitialsAvatar name="Acme Retail" shape="square" />,
                title: 'Acme Retail',
                subtitle: 'Team · 18 seats',
                meta: <StatusBadge status="pending" />,
              },
              {
                key: '3',
                media: <InitialsAvatar name="Globex" shape="square" />,
                title: 'Globex',
                subtitle: 'Starter · trial ends in 3 days',
                meta: <StatusBadge status="review" label="Trial" />,
              },
            ]}
          />
        </Demo>

        <Demo id="descriptionList" contentClassName="space-y-6">
          <DescriptionList
            items={[
              {
                key: 'customer',
                term: 'Customer',
                detail: <UserCell name="Diego Ramírez" secondary="diego@globex.com" />,
              },
              { key: 'plan', term: 'Plan', detail: 'Team (annual)' },
              { key: 'status', term: 'Status', detail: <StatusBadge status="active" /> },
              {
                key: 'branch',
                term: 'Repository',
                detail: (
                  <span className="inline-flex items-center gap-1.5 font-mono text-xs">
                    <GitBranch className="size-3.5" />
                    main
                  </span>
                ),
              },
            ]}
          />
          <DescriptionList
            layout="vertical"
            className="grid grid-cols-2 gap-x-6 divide-y-0"
            items={[
              { key: 'a', term: 'Invoice', detail: 'INV-2041' },
              { key: 'b', term: 'Due', detail: 'Dec 1, 2026' },
            ]}
          />
        </Demo>

        <Demo id="keyValue">
          <KeyValueGrid
            items={[
              { key: 'mrr', label: 'MRR', value: '$84,210', hint: '+6.2% MoM' },
              { key: 'arpa', label: 'ARPA', value: '$412' },
              { key: 'ltv', label: 'LTV', value: '$9,860' },
              { key: 'cac', label: 'CAC', value: '$1,240' },
              { key: 'payback', label: 'Payback', value: '7.4 mo' },
              { key: 'nrr', label: 'NRR', value: '112%' },
            ]}
          />
        </Demo>

        <Demo id="tree" contentClassName="space-y-3">
          <TreeView
            nodes={TREE}
            defaultExpanded={['src', 'shared']}
            selectedId={selected}
            onSelect={(node) => setSelected(node.id)}
          />
          <p className="border-t pt-3 text-xs text-muted-foreground">
            {selected ? `${t('demo.selected')}: ${selected}` : t('demo.nothing')}
          </p>
        </Demo>
      </ShowcaseGrid>

      <Demo id="kanban">
        <KanbanBoard
          columns={board}
          onChange={setBoard}
          renderCard={(card) => (
            <div className="space-y-3 rounded-lg border bg-card p-3 shadow-xs">
              <Tag size="sm" tone={card.tone}>
                {card.tag}
              </Tag>
              <p className="text-sm font-medium">{card.title}</p>
              <div className="flex items-center justify-between">
                <AvatarStack names={card.assignees} size="xs" max={3} />
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarCheck className="size-3.5" /> {card.due}
                </span>
              </div>
            </div>
          )}
        />
      </Demo>

      <ShowcaseGrid>
        <Demo id="files" contentClassName="space-y-2">
          <FileItem name="q4-board-deck.pdf" size={4_812_000} />
          <FileItem
            name="customers-export.csv"
            size={918_000}
            progress={64}
            onRemove={() => undefined}
          />
          <FileItem
            name="hero-shot.png"
            size={2_300_000}
            error="File is larger than 2 MB"
            onRemove={() => undefined}
          />
          <FileItem name="assets.zip" size={58_000_000} progress={100} />
        </Demo>

        <Demo id="code">
          <CodeBlock code={SNIPPET} title="revenue.tsx" highlight={[5]} />
        </Demo>

        <Demo id="misc" className="lg:col-span-2" contentClassName="grid gap-6 md:grid-cols-3">
          <div className="space-y-3">
            <p className="text-3xl font-semibold tracking-tight">
              $<NumberTicker value={ticker} />
            </p>
            <Button variant="outline" size="sm" onClick={() => setTicker((v) => v + 1_250)}>
              {t('demo.increment')}
            </Button>
          </div>
          <Countdown to={launch} />
          <div className="space-y-3">
            <RatingStars value={4.5} size="md" showValue count={2_318} />
            <div className="flex flex-wrap gap-3">
              <KbdCombo keys={['Ctrl', 'K']} />
              <KbdCombo keys={['Ctrl', 'Shift', 'P']} />
              <KbdCombo keys={['G', 'D']} separator="then" />
            </div>
          </div>
        </Demo>
      </ShowcaseGrid>
    </ElementsPage>
  );
}
