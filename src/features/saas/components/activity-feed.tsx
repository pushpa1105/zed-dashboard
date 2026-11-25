import { MoreVertical } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { formatRelative, getInitials } from '@/shared/lib/format';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';

import type { SaasOverview } from '../model/overview';

export function ActivityFeed({ items }: { items: SaasOverview['activity'] }) {
  const { t } = useTranslation('saas', { keyPrefix: 'overview' });

  return (
    <SectionCard
      title={t('activity.title')}
      action={
        <Button variant="ghost" size="icon-sm" aria-label={t('actions.more')}>
          <MoreVertical />
        </Button>
      }
      footer={
        <button type="button" className="font-medium text-primary hover:underline">
          {t('activity.viewAll')}
        </button>
      }
    >
      <ol className="divide-y">
        {items.map((item) => {
          const [first, last] = item.name.split(' ');
          return (
            <li key={item.id} className="flex gap-3 py-4 first:pt-1 last:pb-0">
              <Avatar className="size-9">
                <AvatarFallback className="bg-secondary text-xs font-medium text-secondary-foreground">
                  {getInitials(first, last)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <time className="shrink-0 text-xs text-muted-foreground">
                    {formatRelative(item.at)}
                  </time>
                </div>
                <p className="text-xs text-muted-foreground">
                  {item.action} <span className="font-medium text-foreground">{item.target}</span>
                </p>
                <p className="line-clamp-2 border-l-2 pl-2 text-xs text-muted-foreground italic">
                  {item.comment}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </SectionCard>
  );
}
