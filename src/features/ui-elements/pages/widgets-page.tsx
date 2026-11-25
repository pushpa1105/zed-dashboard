import { CalendarPlus, FileUp, Mail, MessageSquare, Receipt, UserPlus } from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import {
  ActivityCalendar,
  MilestoneCountdown,
  MiniCalendar,
} from '@/shared/components/widgets/calendar-widgets';
import { AnnouncementCard, BalanceCard } from '@/shared/components/widgets/card-widgets';
import {
  ComparisonBars,
  FunnelMini,
  GoalProgress,
  KpiTarget,
  NpsGauge,
} from '@/shared/components/widgets/kpi-widgets';
import {
  NotificationList,
  QuickActions,
  RecentFiles,
  TodoList,
  UpcomingPayments,
} from '@/shared/components/widgets/list-widgets';
import {
  Leaderboard,
  TeamOnline,
  TestimonialCard,
  UserProfileWidget,
} from '@/shared/components/widgets/people-widgets';
import {
  DeviceSplit,
  RatingsBreakdown,
  SocialStats,
  StorageUsage,
  SystemStatus,
  TopLocations,
} from '@/shared/components/widgets/status-widgets';
import { Button } from '@/shared/ui/button';

import { ElementsPage } from '../components/elements-page';
import { Demo } from '../components/showcase';

const DAY = 86_400_000;
const usd = (n: number) =>
  n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

/** Deterministic pseudo-random activity so the calendar looks the same on every load. */
function seededActivity(days: number) {
  let s = 7;
  return Array.from({ length: days }, (_, i) => {
    s = (s * 9301 + 49297) % 233280;
    const r = s / 233280;
    const weekday = i % 7;
    return weekday >= 5 ? (r > 0.7 ? 1 : 0) : Math.floor(r * 9 * (0.6 + (i / days) * 0.6));
  });
}

const uptime = (bad: number[], degraded: number[] = []) =>
  Array.from({ length: 30 }, (_, i) =>
    bad.includes(i)
      ? ('outage' as const)
      : degraded.includes(i)
        ? ('degraded' as const)
        : ('operational' as const),
  );

export default function WidgetsPage() {
  const { t } = useTranslation('ui-elements');
  const [now] = useState(() => Date.now());
  const today = new Date(now);
  const at = (days: number) => new Date(now + days * DAY);

  return (
    <ElementsPage page="widgets">
      <div className="grid gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-[1fr_1.35fr_1fr_1fr]">
        <Demo id="wKpiTarget">
          <KpiTarget
            label="Q4 new ARR"
            value={812_400}
            target={1_000_000}
            delta={12.4}
            format={usd}
            remainingLabel={t('widgetUi.toTarget')}
            reachedLabel={t('widgetUi.reached')}
          />
        </Demo>
        <Demo id="wBalance" className="xl:row-span-2">
          <BalanceCard
            balance="$143,624.18"
            holder="Northwind Labs"
            last4="4821"
            expiry="09/28"
            income="$38,210"
            spending="$12,940"
          />
        </Demo>
        <Demo id="wNps">
          <NpsGauge promoters={612} passives={204} detractors={96} />
        </Demo>
        <Demo id="wGoals">
          <GoalProgress
            goals={[
              { id: '1', label: 'Emergency fund', value: 18_400, target: 25_000, hint: 'by March' },
              { id: '2', label: 'Hire 4 engineers', value: 3, target: 4 },
              { id: '3', label: 'Close 40 deals', value: 27, target: 40, hint: 'this quarter' },
            ]}
          />
        </Demo>
        <Demo id="wFunnel">
          <FunnelMini
            stages={[
              { id: 'v', label: 'Visitors', value: 48_210 },
              { id: 's', label: 'Sign-ups', value: 6_420 },
              { id: 'a', label: 'Activated', value: 2_980 },
              { id: 'p', label: 'Paid', value: 712 },
            ]}
          />
        </Demo>
        <Demo id="wDevices" className="md:col-span-2">
          <DeviceSplit
            devices={[
              { id: 'desktop', label: 'Desktop', share: 58, delta: -2.1 },
              { id: 'mobile', label: 'Mobile', share: 36, delta: 4.8 },
              { id: 'tablet', label: 'Tablet', share: 6, delta: -0.4 },
            ]}
          />
        </Demo>
      </div>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
        <Demo id="wHeatCalendar" className="lg:col-span-2">
          <ActivityCalendar values={seededActivity(46 * 7)} weeks={46} unit="commits" />
        </Demo>
        <Demo id="wCountdown">
          <MilestoneCountdown
            title="Embedded analytics GA"
            start={at(-40)}
            target={at(19.4)}
            labels={{ days: 'days', hours: 'hrs', minutes: 'min', elapsed: t('widgetUi.elapsed') }}
          />
        </Demo>
      </div>

      <div className="grid gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
        <Demo id="wComparison">
          <ComparisonBars
            currentLabel={t('widgetUi.thisPeriod')}
            previousLabel={t('widgetUi.lastPeriod')}
            format={usd}
            rows={[
              { id: 'o', label: 'Online store', current: 48_200, previous: 41_900 },
              { id: 'm', label: 'Marketplace', current: 26_900, previous: 29_400 },
              { id: 'r', label: 'Retail', current: 17_500, previous: 15_100 },
            ]}
          />
        </Demo>
        <Demo id="wLeaderboard">
          <Leaderboard
            format={usd}
            rows={[
              { id: '1', name: 'Grace Liu', value: 184_200 },
              { id: '2', name: 'Diego Haddad', value: 151_900 },
              { id: '3', name: 'Noah Morgan', value: 122_400 },
              { id: '4', name: 'Freya Silva', value: 96_300 },
            ]}
          />
        </Demo>
        <Demo id="wMiniCalendar" className="md:row-span-2">
          <MiniCalendar
            emptyLabel={t('widgetUi.nothing')}
            events={[
              { id: '1', date: today, title: 'Design review', time: '10:00' },
              { id: '2', date: today, title: 'Board prep', time: '15:30', color: 'var(--chart-3)' },
              { id: '3', date: at(2), title: 'Payroll run', color: 'var(--chart-2)' },
              { id: '4', date: at(5), title: 'Quarterly planning', color: 'var(--chart-4)' },
              { id: '5', date: at(-3), title: 'Vendor audit' },
            ]}
          />
        </Demo>
        <Demo id="wStatus">
          <SystemStatus
            services={[
              {
                id: 'api',
                name: 'API',
                state: 'operational',
                uptime: 99.98,
                days: uptime([], [12]),
              },
              {
                id: 'dash',
                name: 'Dashboards',
                state: 'operational',
                uptime: 99.95,
                days: uptime([], [4, 21]),
              },
              {
                id: 'exp',
                name: 'Exports',
                state: 'degraded',
                uptime: 99.41,
                days: uptime([18], [28, 29]),
              },
            ]}
            incidents={[
              {
                id: '1',
                title: 'Slow CSV exports for large workspaces',
                time: '2 h ago',
                state: 'degraded',
              },
              { id: '2', title: 'Export queue outage (resolved)', time: 'Nov 12', state: 'outage' },
            ]}
          />
        </Demo>
        <Demo id="wRatings">
          <RatingsBreakdown counts={[812, 264, 61, 18, 23]} reviewsLabel={t('widgetUi.reviews')} />
        </Demo>
      </div>

      <div className="grid gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
        <Demo id="wNotifications">
          <NotificationList
            items={[
              {
                id: '1',
                actor: 'Grace Liu',
                text: 'requested access to “Revenue bridge”',
                time: '4 min ago',
                unread: true,
                actions: (
                  <>
                    <Button size="xs">Approve</Button>
                    <Button size="xs" variant="outline">
                      Decline
                    </Button>
                  </>
                ),
              },
              {
                id: '2',
                actor: 'Jonas Becker',
                text: 'mentioned you in Q4 planning',
                time: '1 h ago',
                unread: true,
              },
              { id: '3', actor: 'Ines Duarte', text: 'closed invoice INV-2039', time: 'Yesterday' },
            ]}
          />
        </Demo>
        <Demo id="wTodo">
          <TodoList
            placeholder={t('widgetUi.addTask')}
            remainingLabel={t('widgetUi.remaining')}
            initial={[
              {
                id: '1',
                text: 'Review November payroll',
                done: false,
                due: 'Today',
                priority: 'high',
              },
              {
                id: '2',
                text: 'Send renewal quote to Parcelpoint',
                done: false,
                due: 'Fri',
                priority: 'medium',
              },
              { id: '3', text: 'Update board deck numbers', done: true, priority: 'medium' },
              { id: '4', text: 'Archive Q2 experiments', done: false, priority: 'low' },
            ]}
          />
        </Demo>
        <Demo id="wTeam">
          <TeamOnline
            onlineLabel={t('widgetUi.online')}
            members={[
              {
                id: '1',
                name: 'Amara Okafor',
                role: 'CEO',
                status: 'online',
                activity: 'Editing Board deck',
              },
              {
                id: '2',
                name: 'Tomás Reyes',
                role: 'CTO',
                status: 'online',
                activity: 'In a call · 24 min',
              },
              { id: '3', name: 'Priya Natarajan', role: 'Head of Platform', status: 'away' },
              { id: '4', name: 'Samuel Adeyemi', role: 'CFO', status: 'offline' },
            ]}
          />
        </Demo>
        <Demo id="wFiles">
          <RecentFiles
            files={[
              {
                id: '1',
                name: 'board-deck-q4.pdf',
                owner: 'Amara Okafor',
                size: '4.2 MB',
                edited: '12 min ago',
              },
              {
                id: '2',
                name: 'revenue-bridge.xlsx',
                owner: 'Samuel Adeyemi',
                size: '820 KB',
                edited: '1 h ago',
              },
              {
                id: '3',
                name: 'pricing-v3.png',
                owner: 'Hannah Morgan',
                size: '1.1 MB',
                edited: 'Yesterday',
              },
              { id: '4', name: 'metrics.json', owner: 'Tomás Reyes', size: '14 KB', edited: 'Mon' },
            ]}
          />
        </Demo>
        <Demo id="wPayments">
          <UpcomingPayments
            totalLabel={t('widgetUi.dueSoon')}
            payments={[
              { id: '1', payee: 'AWS', due: 'Due tomorrow', amount: '$4,812.40', daysLeft: 1 },
              {
                id: '2',
                payee: 'Office lease · Lisbon',
                due: 'Dec 1',
                amount: '$9,600.00',
                daysLeft: 6,
              },
              { id: '3', payee: 'Figma', due: 'Dec 4', amount: '$540.00', daysLeft: 9 },
              { id: '4', payee: 'Payroll', due: 'Dec 15', amount: '$212,380.00', daysLeft: 20 },
            ]}
          />
        </Demo>
        <Demo id="wQuickActions">
          <QuickActions
            actions={[
              { id: '1', label: 'New invoice', icon: Receipt },
              { id: '2', label: 'Invite', icon: UserPlus, color: 'var(--chart-2)' },
              { id: '3', label: 'Schedule', icon: CalendarPlus, color: 'var(--chart-4)' },
              { id: '4', label: 'Upload', icon: FileUp, color: 'var(--chart-3)' },
              { id: '5', label: 'Email', icon: Mail, color: 'var(--chart-5)' },
              { id: '6', label: 'Chat', icon: MessageSquare },
            ]}
          />
        </Demo>
      </div>

      <div className="grid gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
        <Demo id="wSocial">
          <SocialStats
            channels={[
              {
                id: 'li',
                name: 'LinkedIn',
                handle: '@orbitly',
                followers: '48.2K',
                delta: 6.1,
                color: 'var(--chart-4)',
                monogram: 'in',
              },
              {
                id: 'yt',
                name: 'YouTube',
                handle: 'Orbitly Academy',
                followers: '12.9K',
                delta: 14.3,
                color: 'var(--destructive)',
                monogram: 'YT',
              },
              {
                id: 'nl',
                name: 'Newsletter',
                handle: 'The Ledger',
                followers: '31.4K',
                delta: 2.2,
                color: 'var(--chart-1)',
                monogram: 'NL',
              },
            ]}
          />
        </Demo>
        <Demo id="wStorage">
          <StorageUsage
            used={128}
            total={500}
            ofLabel={t('widgetUi.of')}
            segments={[
              { id: 'd', label: 'Documents', value: 54 },
              { id: 'i', label: 'Images', value: 38 },
              { id: 'v', label: 'Video', value: 24 },
              { id: 'o', label: 'Other', value: 12 },
            ]}
          />
        </Demo>
        <Demo id="wLocations">
          <TopLocations
            rows={[
              { code: 'US', name: 'United States', value: 18_420, share: 38 },
              { code: 'DE', name: 'Germany', value: 7_210, share: 15 },
              { code: 'PT', name: 'Portugal', value: 5_980, share: 12 },
              { code: 'BR', name: 'Brazil', value: 4_320, share: 9 },
            ]}
          />
        </Demo>
      </div>

      <Demo id="wProfiles">
        <div className="grid gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
          <UserProfileWidget
            person={{
              name: 'Amara Okafor',
              title: 'Head of Product · Lagos',
              stats: [
                { label: 'Projects', value: 24 },
                { label: 'Reviews', value: 186 },
                { label: 'Rating', value: '4.9' },
              ],
            }}
            actions={
              <>
                <Button size="sm" variant="outline">
                  Message
                </Button>
                <Button size="sm">Follow</Button>
              </>
            }
          />
          <div className="space-y-4">
            <UserProfileWidget
              variant="horizontal"
              person={{
                name: 'Tomás Reyes',
                title: 'Chief Technology Officer',
                location: 'Lisbon, Portugal',
                email: 'tomas@orbitly.io',
              }}
              actions={
                <Button size="sm" variant="outline">
                  View profile
                </Button>
              }
            />
            <UserProfileWidget
              variant="compact"
              person={{ name: 'Priya Natarajan', title: 'Head of Platform' }}
              actions={
                <Button size="sm" variant="ghost">
                  Follow
                </Button>
              }
            />
          </div>
          <TestimonialCard
            quote="We cut month-end close from four days to one. The revenue bridge used to be a spreadsheet only I understood."
            name="Marta Lindqvist"
            role="VP Finance, Fieldwork"
            rating={5}
          />
        </div>
      </Demo>

      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        <AnnouncementCard
          eyebrow="New in v4.2"
          title="Cohort retention reports are live"
          body="See which signups stick, by week or month, and drill into any cohort in one click."
          dismissLabel={t('widgetUi.dismiss')}
          action={<Button size="sm">Try it</Button>}
        />
        <TestimonialCard
          quote="The alert told us the churn spike was one payment provider in Brazil. We fixed it before anyone opened a ticket."
          name="Daniel Okafor"
          role="Head of Growth, Parcelpoint"
          rating={4.5}
        />
      </div>
    </ElementsPage>
  );
}
