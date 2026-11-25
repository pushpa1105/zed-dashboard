import { Bell, BellOff, Check, CheckCheck, Settings } from 'lucide-react';
import { useMemo, useState } from 'react';
import { create } from 'zustand';

import {
  translateLabel,
  type NavBadgeTone,
  type WorkspaceNotification,
  type WorkspaceNotifications,
} from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Link, useNavigate } from '@/core/router/router';
import { cn } from '@/shared/lib/cn';
import { getInitials } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';

import { DEFAULT_NOTIFICATIONS } from './default-shell-content';
import { useShell } from './nav/use-shell';

/**
 * Header notification center. Each workspace declares its own sample feed in
 * its manifest (`workspace.notifications`); swap it for a query against your
 * notifications endpoint returning the same shape.
 */

const TONE_TILE: Record<NavBadgeTone, string> = {
  default: 'bg-muted text-muted-foreground',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/20 text-warning-foreground dark:text-warning',
  danger: 'bg-destructive/10 text-destructive',
};

const DAY = 24 * 60;

/** Ids marked as read, per workspace. Kept for the session, across layouts and popover closes. */
const useReadStore = create<{
  read: Record<string, readonly string[]>;
  markRead: (workspace: string, ids: string[]) => void;
}>((set) => ({
  read: {},
  markRead: (workspace, ids) =>
    set((s) => ({ read: { ...s.read, [workspace]: [...(s.read[workspace] ?? []), ...ids] } })),
}));

const EMPTY: readonly string[] = [];

/** The ids of a feed that are still unread, and how to mark some read. */
function useUnread(workspace: string, feed: WorkspaceNotifications) {
  const read = useReadStore((s) => s.read[workspace] ?? EMPTY);
  const markReadIn = useReadStore((s) => s.markRead);
  const unread = useMemo(
    () => new Set(feed.items.filter((i) => i.unread && !read.includes(i.id)).map((i) => i.id)),
    [feed, read],
  );
  return { unread, markRead: (...ids: string[]) => markReadIn(workspace, ids) };
}

/** "5 min ago", "hace 2 h"… in the current language. */
function useRelativeMinutes() {
  const { i18n } = useTranslation();
  return useMemo(() => {
    const rtf = new Intl.RelativeTimeFormat(i18n.language, { numeric: 'auto', style: 'short' });
    return (minutes: number) => {
      if (minutes < 1) return rtf.format(0, 'second');
      if (minutes < 60) return rtf.format(-minutes, 'minute');
      if (minutes < DAY) return rtf.format(-Math.round(minutes / 60), 'hour');
      if (minutes < 7 * DAY) return rtf.format(-Math.round(minutes / DAY), 'day');
      return rtf.format(-Math.round(minutes / (7 * DAY)), 'week');
    };
  }, [i18n.language]);
}

function NotificationRow({
  item,
  unread,
  categoryLabel,
  onOpen,
  onMarkRead,
}: {
  item: WorkspaceNotification;
  unread: boolean;
  categoryLabel?: string;
  onOpen: () => void;
  onMarkRead: () => void;
}) {
  const { t } = useTranslation();
  const relative = useRelativeMinutes();
  const Icon = item.icon;

  return (
    <li className="group relative">
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          'flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/60 focus-visible:bg-accent/60 focus-visible:outline-none',
          unread && 'bg-primary/[0.03]',
        )}
      >
        <span className="relative shrink-0">
          {item.actor ? (
            <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
              {getInitials(...item.actor.split(' '))}
            </span>
          ) : (
            <span
              className={cn(
                'flex size-9 items-center justify-center rounded-lg',
                TONE_TILE[item.tone ?? 'default'],
              )}
            >
              <Icon className="size-4" />
            </span>
          )}
          {item.actor && (
            <span className="absolute -right-1 -bottom-1 rounded-full bg-popover ring-2 ring-popover">
              <span
                className={cn(
                  'flex size-4.5 items-center justify-center rounded-full',
                  TONE_TILE[item.tone ?? 'default'],
                )}
              >
                <Icon className="size-2.5" />
              </span>
            </span>
          )}
        </span>
        <span className="min-w-0 flex-1 space-y-0.5 pr-5">
          <span
            className={cn(
              'block text-sm leading-snug',
              unread ? 'font-medium text-foreground' : 'text-foreground/80',
            )}
          >
            {translateLabel(item.title, t)}
          </span>
          {item.body && (
            <span className="line-clamp-2 block text-xs text-muted-foreground">
              {translateLabel(item.body, t)}
            </span>
          )}
          <span className="block text-[0.6875rem] text-muted-foreground/80">
            {categoryLabel && <>{categoryLabel} · </>}
            {relative(item.minutesAgo)}
          </span>
        </span>
      </button>
      {unread && (
        <>
          <span
            aria-hidden
            className="pointer-events-none absolute top-4 right-4 size-2 rounded-full bg-primary group-focus-within:opacity-0 group-hover:opacity-0"
          />
          <Button
            variant="ghost"
            size="icon-sm"
            className="absolute top-2 right-2 size-7 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
            aria-label={t('shell.markRead')}
            onClick={onMarkRead}
          >
            <Check className="size-3.5" />
          </Button>
        </>
      )}
    </li>
  );
}

function NotificationCenter({
  workspace,
  feed,
  onClose,
}: {
  workspace: string;
  feed: WorkspaceNotifications;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tab, setTab] = useState<string>('all');
  const { unread, markRead } = useUnread(workspace, feed);

  const categories = new Map(feed.categories.map((c) => [c.id, translateLabel(c.label, t)]));
  const tabs = [
    { id: 'all', label: t('shell.notificationsAll'), count: unread.size },
    { id: 'unread', label: t('shell.notificationsUnread'), count: 0 },
    ...feed.categories.map((c) => ({
      id: c.id,
      label: categories.get(c.id)!,
      count: feed.items.filter((i) => i.category === c.id && unread.has(i.id)).length,
    })),
  ];

  const visible = feed.items
    .filter((item) =>
      tab === 'all' ? true : tab === 'unread' ? unread.has(item.id) : item.category === tab,
    )
    .sort((a, b) => a.minutesAgo - b.minutesAgo);
  const groups = [
    { id: 'today', label: t('shell.today'), items: visible.filter((i) => i.minutesAgo < DAY) },
    { id: 'earlier', label: t('shell.earlier'), items: visible.filter((i) => i.minutesAgo >= DAY) },
  ].filter((g) => g.items.length > 0);

  const open = (item: WorkspaceNotification) => {
    markRead(item.id);
    if (item.to) {
      onClose();
      void navigate(item.to);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">{t('shell.notifications')}</p>
          {unread.size > 0 && (
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[0.6875rem] leading-none font-medium text-primary tabular-nums">
              {t('shell.newCount', { count: unread.size })}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 px-2 text-xs"
          disabled={unread.size === 0}
          onClick={() => markRead(...unread)}
        >
          <CheckCheck className="size-3.5" />
          {t('shell.markAllRead')}
        </Button>
      </div>

      <div
        role="tablist"
        aria-label={t('shell.notifications')}
        className="flex [scrollbar-width:none] gap-1 overflow-x-auto border-b px-3 pb-2"
      >
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors',
              tab === item.id
                ? 'bg-secondary text-secondary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            {item.label}
            {item.count > 0 && (
              <span className="rounded-full bg-primary px-1 text-[0.625rem] leading-4 text-primary-foreground tabular-nums">
                {item.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="max-h-[min(26rem,60vh)] overflow-y-auto overscroll-contain">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <BellOff className="size-4.5" />
            </span>
            <p className="text-sm font-medium">{t('shell.noNotifications')}</p>
            <p className="text-xs text-muted-foreground">{t('shell.noNotificationsHint')}</p>
          </div>
        ) : (
          groups.map((group) => (
            <section key={group.id} aria-label={group.label}>
              <p className="sticky top-0 z-10 bg-popover/95 px-4 pt-2.5 pb-1 text-[0.6875rem] font-medium tracking-wide text-muted-foreground uppercase backdrop-blur">
                {group.label}
              </p>
              <ul className="divide-y divide-border/60">
                {group.items.map((item) => (
                  <NotificationRow
                    key={item.id}
                    item={item}
                    unread={unread.has(item.id)}
                    categoryLabel={
                      tab === item.category ? undefined : categories.get(item.category)
                    }
                    onOpen={() => open(item)}
                    onMarkRead={() => markRead(item.id)}
                  />
                ))}
              </ul>
            </section>
          ))
        )}
      </div>

      {(feed.viewAllTo || feed.settingsTo) && (
        <div className="flex items-center justify-between gap-2 border-t px-2 py-1.5">
          {feed.settingsTo ? (
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" asChild>
              <Link to={feed.settingsTo} onClick={onClose}>
                <Settings className="size-3.5" />
                {t('shell.notificationSettings')}
              </Link>
            </Button>
          ) : (
            <span />
          )}
          {feed.viewAllTo && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" asChild>
              <Link to={feed.viewAllTo} onClick={onClose}>
                {t('shell.viewAll')}
              </Link>
            </Button>
          )}
        </div>
      )}
    </>
  );
}

export function NotificationsMenu() {
  const { t } = useTranslation();
  const { workspace } = useShell();
  const feed = workspace.notifications ?? DEFAULT_NOTIFICATIONS;
  const [open, setOpen] = useState(false);
  const count = useUnread(workspace.id, feed).unread.size;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={
            count > 0
              ? `${t('shell.notifications')} (${t('shell.newCount', { count })})`
              : t('shell.notifications')
          }
        >
          <Bell />
          {count > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[0.625rem] leading-none font-semibold text-destructive-foreground tabular-nums ring-2 ring-background">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[min(24rem,calc(100vw-1.5rem))] p-0">
        <NotificationCenter workspace={workspace.id} feed={feed} onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}
