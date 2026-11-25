import { BellOff, Pin, SquarePen } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { SearchInput } from '@/shared/components/forms/search-input';
import { SegmentedControl } from '@/shared/components/forms/segmented-control';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

import { listTime } from '../lib/format';
import type { Conversation } from '../model/chat';

type Filter = 'all' | 'unread' | 'groups';

export function ConversationList({
  conversations,
  loading,
  selectedId,
  onSelect,
}: {
  conversations?: Conversation[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { t } = useTranslation('app-chat');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (conversations ?? [])
      .filter((c) => filter !== 'unread' || c.unread > 0)
      .filter((c) => filter !== 'groups' || c.kind === 'group')
      .filter(
        (c) =>
          !q ||
          c.name.toLowerCase().includes(q) ||
          c.topic.toLowerCase().includes(q) ||
          c.lastMessage?.body.toLowerCase().includes(q),
      );
  }, [conversations, query, filter]);

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-3 border-b p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold tracking-tight">{t('title')}</h1>
          <Button variant="ghost" size="icon" aria-label={t('list.new')}>
            <SquarePen />
          </Button>
        </div>
        <SearchInput value={query} onChange={setQuery} placeholder={t('list.search')} />
        <SegmentedControl<Filter>
          value={filter}
          onChange={setFilter}
          block
          size="sm"
          aria-label={t('list.filter')}
          options={[
            { value: 'all', label: t('list.all') },
            { value: 'unread', label: t('list.unread') },
            { value: 'groups', label: t('list.groups') },
          ]}
        />
      </div>

      <ul className="flex-1 space-y-0.5 overflow-y-auto p-2" aria-label={t('list.label')}>
        {loading &&
          Array.from({ length: 6 }, (_, i) => (
            <li key={i} className="flex gap-3 p-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-2/3" />
                <Skeleton className="h-3 w-full" />
              </div>
            </li>
          ))}
        {!loading && visible.length === 0 && (
          <li className="px-3 py-10 text-center text-sm text-muted-foreground">
            {t('list.empty')}
          </li>
        )}
        {visible.map((c) => {
          const active = c.id === selectedId;
          const unread = c.unread > 0;
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onSelect(c.id)}
                aria-current={active || undefined}
                className={cn(
                  'flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted/70',
                  active && 'bg-accent hover:bg-accent',
                )}
              >
                <InitialsAvatar
                  name={c.name}
                  size="md"
                  shape={c.kind === 'group' ? 'square' : 'circle'}
                  status={c.kind === 'direct' ? (c.online ? 'online' : 'offline') : undefined}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span
                      className={cn('truncate text-sm', unread ? 'font-semibold' : 'font-medium')}
                    >
                      {c.name}
                    </span>
                    {c.pinned && (
                      <Pin
                        className="size-3 shrink-0 text-muted-foreground"
                        aria-label={t('list.pinned')}
                      />
                    )}
                    {c.muted && (
                      <BellOff
                        className="size-3 shrink-0 text-muted-foreground"
                        aria-label={t('list.muted')}
                      />
                    )}
                    {c.lastMessage && (
                      <span
                        className={cn(
                          'ml-auto shrink-0 text-xs tabular-nums',
                          unread ? 'font-medium text-primary' : 'text-muted-foreground',
                        )}
                      >
                        {listTime(c.lastMessage.createdAt)}
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 flex items-center gap-2">
                    {c.typing ? (
                      <span className="truncate text-sm text-primary">
                        {t('thread.typing', { name: c.typing.split(' ')[0] })}
                      </span>
                    ) : (
                      <span
                        className={cn(
                          'truncate text-sm',
                          unread ? 'text-foreground' : 'text-muted-foreground',
                        )}
                      >
                        {c.lastMessage &&
                          (c.lastMessage.authorName === 'You'
                            ? `${t('list.you')}: `
                            : c.kind === 'group'
                              ? `${c.lastMessage.authorName.split(' ')[0]}: `
                              : '')}
                        {c.lastMessage?.body}
                      </span>
                    )}
                    {unread && (
                      <span
                        className={cn(
                          'ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[0.6875rem] font-semibold tabular-nums',
                          c.muted
                            ? 'bg-muted text-muted-foreground'
                            : 'bg-primary text-primary-foreground',
                        )}
                        aria-label={t('list.unreadCount', { count: c.unread })}
                      >
                        {c.unread}
                      </span>
                    )}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
