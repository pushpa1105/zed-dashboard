import {
  Box,
  CircleCheck,
  CreditCard,
  FileSignature,
  Flag,
  Home,
  Package,
  PackageCheck,
  Rocket,
  Truck,
  Users,
} from 'lucide-react';

import { Tag } from '@/shared/components/display/tag';
import { AlternatingTimeline } from '@/shared/components/timeline/alternating-timeline';
import { Changelog } from '@/shared/components/timeline/changelog';
import { HistoryList } from '@/shared/components/timeline/history-list';
import { HorizontalTimeline } from '@/shared/components/timeline/horizontal-timeline';
import { MediaActivity } from '@/shared/components/timeline/media-activity';
import { Roadmap } from '@/shared/components/timeline/roadmap';
import { TrackingStepper } from '@/shared/components/timeline/tracking-stepper';
import { VerticalTimeline } from '@/shared/components/timeline/vertical-timeline';
import { Button } from '@/shared/ui/button';

import { ElementsPage } from '../components/elements-page';
import { Demo, ShowcaseGrid } from '../components/showcase';

const trackingSteps = [
  {
    id: 'placed',
    label: 'Order placed',
    icon: FileSignature,
    time: 'Nov 21, 09:12',
    location: 'Online',
  },
  {
    id: 'paid',
    label: 'Payment confirmed',
    icon: CreditCard,
    time: 'Nov 21, 09:13',
    location: 'Stripe',
  },
  {
    id: 'packed',
    label: 'Packed',
    icon: Package,
    time: 'Nov 22, 14:40',
    location: 'Rotterdam hub',
  },
  {
    id: 'transit',
    label: 'In transit',
    icon: Truck,
    time: 'Nov 24, 06:05',
    location: 'Antwerp → Lisbon',
  },
  { id: 'delivered', label: 'Delivered', icon: Home, time: 'Est. Nov 26' },
];

export default function TimelinesPage() {
  return (
    <ElementsPage page="timelines">
      <Demo id="tlTracking">
        <TrackingStepper steps={trackingSteps} current={3} />
      </Demo>

      <ShowcaseGrid>
        <Demo id="tlVertical">
          <VerticalTimeline
            items={[
              {
                id: '1',
                title: 'Contract signed',
                time: 'Nov 24 · 10:42',
                icon: FileSignature,
                tone: 'success',
                description: 'Northwind Labs signed the annual Growth plan.',
                content: (
                  <div className="flex flex-wrap gap-2">
                    <Tag tone="success" size="sm">
                      $48,000 ARR
                    </Tag>
                    <Tag size="sm">12 seats</Tag>
                  </div>
                ),
              },
              {
                id: '2',
                title: 'Security review passed',
                time: 'Nov 20 · 16:05',
                icon: CircleCheck,
                tone: 'info',
                description: 'SOC 2 report and DPA accepted by their legal team.',
              },
              {
                id: '3',
                title: 'Pilot kicked off',
                time: 'Nov 4 · 09:30',
                icon: Rocket,
                tone: 'violet',
                description: 'Three teams onboarded; first dashboard shipped on day two.',
                content: (
                  <Button size="sm" variant="outline">
                    Open pilot notes
                  </Button>
                ),
              },
              {
                id: '4',
                title: 'Intro call',
                time: 'Oct 28 · 11:00',
                icon: Users,
                tone: 'neutral',
                description: 'Referred by Parcelpoint. Pain point: month-end reporting.',
              },
            ]}
          />
        </Demo>
        <Demo id="tlMedia">
          <MediaActivity
            items={[
              {
                id: '1',
                actor: 'Hannah Morgan',
                action: 'uploaded 3 designs to',
                target: 'Checkout redesign',
                time: '12 min ago',
                attachments: [
                  { name: 'cart-v3.png', kind: 'image' },
                  { name: 'payment.png', kind: 'image' },
                  { name: 'success.png', kind: 'image' },
                ],
              },
              {
                id: '2',
                actor: 'Ivan Serhin',
                action: 'commented on',
                target: 'Q4 pricing',
                time: '1 h ago',
                comment:
                  'Annual discount at 20% tested best. Can we ship it before the Dec 1 renewal batch?',
              },
              {
                id: '3',
                actor: 'Priya Raman',
                action: 'attached files to',
                target: 'Vendor audit',
                time: 'Yesterday',
                attachments: [
                  { name: 'soc2-report.pdf', kind: 'file', size: '2.4 MB' },
                  { name: 'vendors.csv', kind: 'file', size: '88 KB' },
                ],
              },
            ]}
          />
        </Demo>
      </ShowcaseGrid>

      <Demo id="tlHorizontal">
        <HorizontalTimeline
          items={[
            {
              id: '1',
              date: 'Jan 2026',
              title: 'Seed round',
              description: '$4M led by Northlight',
              status: 'done',
            },
            {
              id: '2',
              date: 'Mar 2026',
              title: 'Public beta',
              description: '1,200 teams on the waitlist',
              status: 'done',
            },
            {
              id: '3',
              date: 'Jun 2026',
              title: 'v1.0 launch',
              description: 'Billing and SSO',
              status: 'done',
            },
            {
              id: '4',
              date: 'Nov 2026',
              title: 'Embedded analytics',
              description: 'In private preview',
              status: 'current',
            },
            { id: '5', date: 'Feb 2027', title: 'EU data region', status: 'upcoming' },
            { id: '6', date: 'May 2027', title: 'Series A', status: 'upcoming' },
          ]}
        />
      </Demo>

      <Demo id="tlRoadmap">
        <Roadmap
          periods={['Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026', 'Q1 2027']}
          currentPeriod={3}
          lanes={[
            {
              id: 'core',
              label: 'Core platform',
              items: [
                {
                  id: 'a',
                  title: 'Metric definitions v2',
                  start: 0,
                  end: 1,
                  status: 'shipped',
                  owner: 'Priya Natarajan',
                },
                {
                  id: 'b',
                  title: 'Query cache',
                  start: 1,
                  end: 2,
                  status: 'shipped',
                  owner: 'Jonas Becker',
                },
                {
                  id: 'c',
                  title: 'EU data region',
                  start: 3,
                  end: 4,
                  status: 'in_progress',
                  owner: 'Priya Natarajan',
                },
              ],
            },
            {
              id: 'apps',
              label: 'Product',
              items: [
                { id: 'd', title: 'Dashboards redesign', start: 0, end: 0, status: 'shipped' },
                {
                  id: 'e',
                  title: 'Embedded analytics',
                  start: 2,
                  end: 3,
                  status: 'in_progress',
                  owner: 'Grace Liu',
                },
                {
                  id: 'f',
                  title: 'Mobile brief',
                  start: 3,
                  end: 4,
                  status: 'at_risk',
                  owner: 'Tomás Reyes',
                },
                { id: 'g', title: 'Alerts on Slack', start: 1, end: 1, status: 'shipped' },
              ],
            },
            {
              id: 'gtm',
              label: 'Go-to-market',
              items: [
                {
                  id: 'h',
                  title: 'Partner program',
                  start: 2,
                  end: 4,
                  status: 'planned',
                  owner: 'Hannah Morgan',
                },
                { id: 'i', title: 'Self-serve checkout', start: 0, end: 1, status: 'shipped' },
              ],
            },
          ]}
        />
      </Demo>

      <ShowcaseGrid>
        <Demo id="tlAlternating">
          <AlternatingTimeline
            items={[
              {
                id: '1',
                date: '2019',
                title: 'Founded in Lisbon',
                description: 'Two engineers and a spreadsheet problem.',
                icon: Flag,
              },
              {
                id: '2',
                date: '2021',
                title: 'First 100 customers',
                description: 'Mostly finance teams at logistics companies.',
                icon: Users,
                tone: 'info',
              },
              {
                id: '3',
                date: '2023',
                title: 'Toronto office',
                description: 'Support across time zones.',
                icon: Box,
                tone: 'aqua',
              },
              {
                id: '4',
                date: '2026',
                title: '1,200 teams',
                description: 'And still one definition per metric.',
                icon: Rocket,
                tone: 'success',
              },
            ]}
          />
        </Demo>
        <Demo id="tlTrackingVertical">
          <TrackingStepper
            orientation="vertical"
            current={3}
            steps={[
              ...trackingSteps.slice(0, 4),
              { id: 'out', label: 'Out for delivery', icon: PackageCheck },
              trackingSteps[4]!,
            ]}
          />
        </Demo>
      </ShowcaseGrid>

      <ShowcaseGrid>
        <Demo id="tlChangelog">
          <Changelog
            releases={[
              {
                version: '4.2.0',
                date: 'Nov 18, 2026',
                title: 'Cohort retention reports',
                entries: [
                  { type: 'new', text: 'Cohort tables with weekly and monthly grain.' },
                  { type: 'improved', text: 'Dashboards load 38% faster on large workspaces.' },
                  { type: 'fixed', text: 'CSV exports keep column order after reordering.' },
                ],
              },
              {
                version: '4.1.3',
                date: 'Oct 30, 2026',
                entries: [
                  {
                    type: 'security',
                    text: 'SSO sessions now expire after 12 hours of inactivity.',
                  },
                  {
                    type: 'deprecated',
                    text: 'The v1 embed endpoint stops working on Mar 1, 2027.',
                  },
                ],
              },
            ]}
          />
        </Demo>
        <Demo id="tlHistory">
          <HistoryList
            groups={[
              {
                day: 'Today',
                entries: [
                  {
                    id: '1',
                    time: '14:32',
                    actor: 'Megan Clark',
                    text: 'changed plan to Growth',
                    tone: 'success',
                  },
                  {
                    id: '2',
                    time: '13:05',
                    actor: 'System',
                    text: 'rotated API key ••••a91f',
                    tone: 'warning',
                  },
                  {
                    id: '3',
                    time: '09:48',
                    actor: 'Ivan Serhin',
                    text: 'invited 3 members',
                    tone: 'info',
                  },
                ],
              },
              {
                day: 'Yesterday',
                entries: [
                  {
                    id: '4',
                    time: '18:20',
                    actor: 'Priya Raman',
                    text: 'deleted dashboard "Old KPIs"',
                    tone: 'danger',
                  },
                  {
                    id: '5',
                    time: '11:02',
                    actor: 'Megan Clark',
                    text: 'updated billing email',
                    tone: 'neutral',
                  },
                ],
              },
            ]}
          />
        </Demo>
      </ShowcaseGrid>
    </ElementsPage>
  );
}
