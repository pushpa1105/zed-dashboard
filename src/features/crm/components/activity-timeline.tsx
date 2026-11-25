import {
  ArrowRight,
  Mail,
  PhoneCall,
  StickyNote,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Link } from '@/core/router/router';
import { Timeline } from '@/shared/components/display/timeline';

import { daysFromToday, relativeDays, time } from '../lib/format';
import { ACTIVITY_TONE, type ActivityType, type FeedItem } from '../model/activity';
import { crmRoutes } from '../routes';

import { StageBadge } from './crm-parts';

const ACTIVITY_ICON: Record<ActivityType, LucideIcon> = {
  call: PhoneCall,
  email: Mail,
  meeting: Users,
  note: StickyNote,
  stage: TrendingUp,
};

const dayKey = (iso: string) => new Date(iso).toDateString();

function ItemContent({ item }: { item: FeedItem }) {
  if (item.stage) {
    return (
      <span className="flex items-center gap-2">
        <StageBadge stage={item.stage.from} />
        <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden />
        <StageBadge stage={item.stage.to} />
      </span>
    );
  }
  return item.detail && <p className="text-sm text-muted-foreground">{item.detail}</p>;
}

function DayHeading({ iso }: { iso: string }) {
  const { i18n } = useTranslation('crm');
  return (
    <h3 className="mb-4 text-xs font-medium tracking-wide text-muted-foreground uppercase">
      {daysFromToday(iso) > -2
        ? relativeDays(iso, i18n.language)
        : new Date(iso).toLocaleDateString(i18n.language, {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          })}
    </h3>
  );
}

/** Splits a newest-first feed into runs of items from the same day. */
const groupByDay = (items: FeedItem[]) =>
  items.reduce<FeedItem[][]>((groups, item) => {
    const last = groups.at(-1);
    if (last && dayKey(last[0]!.at) === dayKey(item.at)) last.push(item);
    else groups.push([item]);
    return groups;
  }, []);

/** Feed items grouped under one heading per day, newest first. */
export function ActivityTimeline({ items }: { items: FeedItem[] }) {
  const { t } = useTranslation('crm');
  return (
    <div className="space-y-8">
      {groupByDay(items).map((group) => (
        <section key={dayKey(group[0]!.at)}>
          <DayHeading iso={group[0]!.at} />
          <Timeline
            items={group.map((item) => ({
              key: item.id,
              icon: ACTIVITY_ICON[item.type],
              tone: ACTIVITY_TONE[item.type],
              title:
                item.type === 'stage'
                  ? t('activity.stageMoved', { deal: item.dealName })
                  : item.title,
              time: time(item.at),
              description: (
                <>
                  {item.owner} ·{' '}
                  <Link
                    to={crmRoutes.deal.href({ dealId: item.dealId })}
                    className="hover:text-foreground hover:underline"
                  >
                    {item.company}
                  </Link>
                </>
              ),
              content: <ItemContent item={item} />,
            }))}
          />
        </section>
      ))}
    </div>
  );
}
