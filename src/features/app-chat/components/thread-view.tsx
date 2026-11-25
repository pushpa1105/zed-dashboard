import { ArrowLeft, BellOff, Info, MessagesSquare, Phone, Pin, Video } from 'lucide-react';
import { Fragment, useEffect, useRef, useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { notify } from '@/core/notify/notify';
import { EmptyState } from '@/shared/components/display/empty-state';
import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';

import { useReact, useSendMessage } from '../api/chat-api';
import { dayKey, dayLabel } from '../lib/format';
import { ME, type Message, type Thread } from '../model/chat';

import { Composer } from './composer';
import { MessageBubble } from './message-bubble';

const GROUP_GAP = 5 * 60_000;

function TypingBubble({ name }: { name: string }) {
  const { t } = useTranslation('app-chat');
  return (
    <div className="mt-3 flex items-center gap-2" aria-live="polite">
      <span className="flex h-9 items-center gap-1 rounded-2xl rounded-bl-md bg-muted px-3.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 animate-bounce rounded-full bg-muted-foreground/70"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </span>
      <span className="text-xs text-muted-foreground">{t('thread.typing', { name })}</span>
    </div>
  );
}

type ThreadViewProps = {
  thread?: Thread;
  loading: boolean;
  onBack: () => void;
  detailsOpen: boolean;
  onToggleDetails: () => void;
};

/** Header, day-grouped message list with typing indicator, and the composer. */
export function ThreadView({
  thread,
  loading,
  onBack,
  detailsOpen,
  onToggleDetails,
}: ThreadViewProps) {
  const { t } = useTranslation('app-chat');
  const send = useSendMessage();
  const react = useReact(thread?.conversation.id ?? '');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const count = thread?.messages.length ?? 0;
  const typing = thread?.conversation.typing;

  // Stick to the bottom when messages arrive or someone starts typing.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    if (typeof el.scrollTo === 'function')
      el.scrollTo({ top: el.scrollHeight, behavior: count ? 'smooth' : 'auto' });
    else el.scrollTop = el.scrollHeight;
  }, [count, typing, thread?.conversation.id]);

  if (loading || !thread) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center gap-3 border-b px-4">
          <Skeleton className="size-10 rounded-full" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex-1 space-y-4 p-6">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className={cn('h-12 w-2/3 rounded-2xl', i % 2 && 'ml-auto')} />
          ))}
        </div>
      </div>
    );
  }

  const { conversation, messages } = thread;
  const memberName = (id: string) =>
    id === ME ? t('list.you') : (conversation.members.find((m) => m.id === id)?.name ?? '');
  const others = conversation.members.filter((m) => m.id !== ME);
  const lastMine = [...messages].reverse().find((m) => m.authorId === ME);
  const subtitle =
    conversation.kind === 'group'
      ? t('thread.members', {
          count: conversation.members.length,
          online: others.filter((m) => m.online).length,
        })
      : others[0]?.online
        ? t('thread.online')
        : t('thread.offline');

  return (
    <div className="flex h-full min-w-0 flex-col">
      <header className="flex h-16 shrink-0 items-center gap-3 border-b px-3 md:px-5">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onBack}
          aria-label={t('thread.back')}
        >
          <ArrowLeft />
        </Button>
        <InitialsAvatar
          name={conversation.name}
          size="md"
          shape={conversation.kind === 'group' ? 'square' : 'circle'}
          status={
            conversation.kind === 'direct'
              ? conversation.online
                ? 'online'
                : 'offline'
              : undefined
          }
        />
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 truncate text-sm font-semibold">
            {conversation.name}
            {conversation.pinned && <Pin className="size-3 text-muted-foreground" />}
            {conversation.muted && <BellOff className="size-3 text-muted-foreground" />}
          </p>
          <p className={cn('truncate text-xs', typing ? 'text-primary' : 'text-muted-foreground')}>
            {typing ? t('thread.typing', { name: typing.split(' ')[0] }) : subtitle}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1">
          {[
            { icon: Phone, label: t('thread.call') },
            { icon: Video, label: t('thread.video') },
          ].map(({ icon: Icon, label }) => (
            <Tooltip key={label}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden sm:inline-flex"
                  aria-label={label}
                  onClick={() => notify.info(t('thread.callUnavailable'))}
                >
                  <Icon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{label}</TooltipContent>
            </Tooltip>
          ))}
          <Button
            variant={detailsOpen ? 'secondary' : 'ghost'}
            size="icon"
            onClick={onToggleDetails}
            aria-pressed={detailsOpen}
            aria-label={t('details.title')}
          >
            <Info />
          </Button>
        </div>
      </header>

      <div ref={scroller} className="flex-1 overflow-y-auto px-4 py-4 md:px-6" aria-live="polite">
        {messages.length === 0 && (
          <EmptyState
            icon={MessagesSquare}
            title={t('thread.emptyTitle')}
            description={t('thread.emptyHint')}
            variant="plain"
          />
        )}
        {messages.map((message, i) => {
          const prev = messages[i - 1];
          const newDay = !prev || dayKey(prev.createdAt) !== dayKey(message.createdAt);
          const continued =
            !newDay &&
            !!prev &&
            prev.authorId === message.authorId &&
            message.createdAt - prev.createdAt < GROUP_GAP;
          const quotedMessage = message.replyToId
            ? messages.find((m) => m.id === message.replyToId)
            : null;
          return (
            <Fragment key={message.id}>
              {newDay && (
                <div
                  className="my-5 flex items-center gap-3 text-xs text-muted-foreground"
                  role="separator"
                >
                  <span className="h-px flex-1 bg-border" />
                  {dayLabel(message.createdAt, {
                    today: t('thread.today'),
                    yesterday: t('thread.yesterday'),
                  })}
                  <span className="h-px flex-1 bg-border" />
                </div>
              )}
              <MessageBubble
                message={message}
                mine={message.authorId === ME}
                authorName={memberName(message.authorId)}
                continued={continued}
                quoted={
                  quotedMessage
                    ? { authorName: memberName(quotedMessage.authorId), body: quotedMessage.body }
                    : null
                }
                showReceipt={message.id === lastMine?.id}
                onReply={() => setReplyTo(message)}
                onReact={(label) => react.mutate({ messageId: message.id, label })}
              />
            </Fragment>
          );
        })}
        {typing && <TypingBubble name={typing.split(' ')[0]!} />}
      </div>

      <Composer
        key={conversation.id}
        replyTo={replyTo ? { authorName: memberName(replyTo.authorId), body: replyTo.body } : null}
        onCancelReply={() => setReplyTo(null)}
        sending={send.isPending}
        placeholder={t('composer.placeholder', { name: conversation.name })}
        onSend={({ body, attachments }) => {
          send.mutate({
            conversationId: conversation.id,
            body,
            attachments,
            replyToId: replyTo?.id ?? null,
          });
          setReplyTo(null);
        }}
      />
    </div>
  );
}
