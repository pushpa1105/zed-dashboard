import { Archive, Mail, MailOpen, Menu, Paperclip, RefreshCw, Star, Trash2 } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { EmptyState } from '@/shared/components/display/empty-state';
import { SearchInput } from '@/shared/components/forms/search-input';
import { cn } from '@/shared/lib/cn';
import { formatDate } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { Skeleton } from '@/shared/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';

import type { MailPatch } from '../api/mail-api';
import { TONE_COLOR, type MailPreview, type MailSummary } from '../model/mail';

const DAY = 86_400_000;
const shortDate = (ts: number) =>
  Date.now() - ts < DAY && new Date(ts).getDate() === new Date().getDate()
    ? formatDate(ts, 'HH:mm')
    : formatDate(ts, 'MMM D');

type MailListProps = {
  title: string;
  mails?: MailPreview[];
  loading: boolean;
  fetching: boolean;
  labels: MailSummary['labels'];
  selectedId: string | null;
  onOpen: (id: string) => void;
  checked: Set<string>;
  onChecked: (ids: Set<string>) => void;
  query: string;
  onQuery: (q: string) => void;
  onRefresh: () => void;
  onPatch: (patch: Omit<MailPatch, 'ids'>, ids?: string[]) => void;
  onMenu: () => void;
  inTrash: boolean;
};

function Action({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-sm" onClick={onClick} aria-label={label}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/** Message list with selection, bulk actions, stars and label chips. */
export function MailList({
  title,
  mails,
  loading,
  fetching,
  labels,
  selectedId,
  onOpen,
  checked,
  onChecked,
  query,
  onQuery,
  onRefresh,
  onPatch,
  onMenu,
  inTrash,
}: MailListProps) {
  const { t } = useTranslation('app-mail');
  const all = mails ?? [];
  const allChecked = all.length > 0 && all.every((m) => checked.has(m.id));
  const someChecked = checked.size > 0;
  const ids = [...checked];

  const toggle = (id: string) => {
    const next = new Set(checked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChecked(next);
  };

  return (
    <div className="flex h-full min-w-0 flex-col">
      <div className="space-y-3 border-b px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="-ml-2 lg:hidden"
            onClick={onMenu}
            aria-label={t('mailboxes.label')}
          >
            <Menu />
          </Button>
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          <span className="text-sm text-muted-foreground tabular-nums">{all.length}</span>
        </div>
        <SearchInput
          value={query}
          onChange={onQuery}
          placeholder={t('list.search')}
          loading={fetching && !loading}
        />
      </div>

      <div className="flex h-12 shrink-0 items-center gap-1 border-b px-4">
        <Checkbox
          checked={allChecked ? true : someChecked ? 'indeterminate' : false}
          onCheckedChange={(value) => onChecked(value ? new Set(all.map((m) => m.id)) : new Set())}
          aria-label={t('list.selectAll')}
          className="mr-2"
        />
        {someChecked ? (
          <>
            <span className="mr-2 text-sm font-medium">
              {t('list.selected', { count: checked.size })}
            </span>
            <Action
              label={t('actions.archive')}
              onClick={() => onPatch({ folder: 'archive' }, ids)}
            >
              <Archive />
            </Action>
            <Action
              label={inTrash ? t('actions.deleteForever') : t('actions.delete')}
              onClick={() => onPatch({ folder: 'trash' }, ids)}
            >
              <Trash2 />
            </Action>
            <Action label={t('actions.markRead')} onClick={() => onPatch({ read: true }, ids)}>
              <MailOpen />
            </Action>
            <Action label={t('actions.markUnread')} onClick={() => onPatch({ read: false }, ids)}>
              <Mail />
            </Action>
          </>
        ) : (
          <Action label={t('actions.refresh')} onClick={onRefresh}>
            <RefreshCw className={cn(fetching && 'animate-spin')} />
          </Action>
        )}
      </div>

      <ul className="flex-1 divide-y overflow-y-auto" aria-label={title}>
        {loading &&
          Array.from({ length: 7 }, (_, i) => (
            <li key={i} className="space-y-2 px-4 py-3.5">
              <Skeleton className="h-3.5 w-1/3" />
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-3 w-full" />
            </li>
          ))}
        {!loading && all.length === 0 && (
          <li>
            <EmptyState
              icon={Mail}
              title={t('list.emptyTitle')}
              description={t('list.emptyHint')}
              variant="plain"
              className="py-16"
            />
          </li>
        )}
        {all.map((mail) => {
          const active = mail.id === selectedId;
          const isChecked = checked.has(mail.id);
          return (
            <li
              key={mail.id}
              className={cn(
                'group/item relative flex gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50',
                active && 'bg-accent/70 hover:bg-accent/70',
                isChecked && 'bg-primary/5',
              )}
            >
              {!mail.read && (
                <span className="absolute top-0 bottom-0 left-0 w-0.5 bg-primary" aria-hidden />
              )}
              <div className="flex flex-col items-center gap-2 pt-0.5">
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => toggle(mail.id)}
                  aria-label={t('list.select', { subject: mail.subject })}
                />
                <button
                  type="button"
                  onClick={() => onPatch({ starred: !mail.starred }, [mail.id])}
                  aria-pressed={mail.starred}
                  aria-label={mail.starred ? t('actions.unstar') : t('actions.star')}
                  className="text-muted-foreground/60 hover:text-warning"
                >
                  <Star className={cn('size-4', mail.starred && 'fill-warning text-warning')} />
                </button>
              </div>
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => onOpen(mail.id)}
              >
                <span className="flex items-baseline gap-2">
                  <span
                    className={cn(
                      'truncate text-sm',
                      mail.read ? 'font-medium text-muted-foreground' : 'font-semibold',
                    )}
                  >
                    {mail.folder === 'sent' || mail.folder === 'drafts'
                      ? `${t('list.to')} ${mail.to.map((p) => p.name).join(', ')}`
                      : mail.from.name}
                  </span>
                  {mail.threadCount > 1 && (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {mail.threadCount}
                    </span>
                  )}
                  <span
                    className={cn(
                      'ml-auto shrink-0 text-xs tabular-nums',
                      mail.read ? 'text-muted-foreground' : 'font-medium text-primary',
                    )}
                  >
                    {shortDate(mail.date)}
                  </span>
                </span>
                <span
                  className={cn(
                    'mt-0.5 flex items-center gap-1.5 text-sm',
                    mail.read ? 'text-foreground/80' : 'font-medium',
                  )}
                >
                  <span className="truncate">{mail.subject}</span>
                  {mail.hasAttachments && (
                    <Paperclip
                      className="size-3.5 shrink-0 text-muted-foreground"
                      aria-label={t('list.attachment')}
                    />
                  )}
                </span>
                <span className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                  {mail.snippet}
                </span>
                {mail.labels.length > 0 && (
                  <span className="mt-2 flex flex-wrap gap-1.5">
                    {mail.labels.map((id) => {
                      const label = labels.find((l) => l.id === id);
                      if (!label) return null;
                      return (
                        <span
                          key={id}
                          className="inline-flex h-5 items-center gap-1 rounded-full border px-2 text-[0.6875rem] font-medium"
                        >
                          <span
                            className="size-1.5 rounded-full"
                            style={{ background: TONE_COLOR[label.tone] }}
                          />
                          {label.name}
                        </span>
                      );
                    })}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
