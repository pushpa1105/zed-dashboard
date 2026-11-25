import {
  Check,
  CheckCheck,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  Reply,
  SmilePlus,
  type LucideIcon,
} from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { cn } from '@/shared/lib/cn';
import { formatDate } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';

import { formatSize } from '../lib/format';
import { QUICK_REACTIONS, type Attachment, type Message } from '../model/chat';

const KIND_ICON: Record<Attachment['kind'], LucideIcon> = {
  image: FileImage,
  pdf: FileText,
  doc: FileText,
  sheet: FileSpreadsheet,
  zip: FileArchive,
};

export function AttachmentCard({ file, mine }: { file: Attachment; mine?: boolean }) {
  const Icon = KIND_ICON[file.kind];
  return (
    <div
      className={cn(
        'flex w-64 max-w-full items-center gap-3 rounded-lg border p-2.5',
        mine ? 'border-primary-foreground/20 bg-primary-foreground/10' : 'bg-card',
      )}
    >
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-md',
          mine ? 'bg-primary-foreground/15' : 'bg-primary/10 text-primary',
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{file.name}</span>
        <span className={cn('text-xs', mine ? 'opacity-75' : 'text-muted-foreground')}>
          {formatSize(file.size)} · {file.kind.toUpperCase()}
        </span>
      </span>
    </div>
  );
}

const REACTION_KEYS = {
  '+1': 'plusOne',
  thanks: 'thanks',
  nice: 'nice',
  agreed: 'agreed',
} as const;
/** Translation key of a reaction label (unknown labels fall back to +1). */
const reactionKey = (label: string) =>
  REACTION_KEYS[label as keyof typeof REACTION_KEYS] ?? REACTION_KEYS['+1'];

type BubbleProps = {
  message: Message;
  mine: boolean;
  authorName: string;
  /** Hides the name line when the previous message has the same author. */
  continued: boolean;
  quoted?: { authorName: string; body: string } | null;
  showReceipt: boolean;
  onReply: () => void;
  onReact: (label: string) => void;
};

/** One chat message: optional quote, text, attachments, reactions and receipt. */
export function MessageBubble({
  message,
  mine,
  authorName,
  continued,
  quoted,
  showReceipt,
  onReply,
  onReact,
}: BubbleProps) {
  const { t } = useTranslation('app-chat');

  return (
    <div
      className={cn(
        'group/msg flex flex-col',
        mine ? 'items-end' : 'items-start',
        !continued && 'mt-3',
      )}
    >
      {!continued && (
        <p className="mb-1 px-1 text-xs text-muted-foreground">
          {!mine && <span className="mr-1.5 font-medium text-foreground">{authorName}</span>}
          {formatDate(message.createdAt, 'HH:mm')}
        </p>
      )}
      <div
        className={cn('flex max-w-[min(36rem,85%)] items-center gap-1', mine && 'flex-row-reverse')}
      >
        <div
          className={cn(
            'space-y-2 rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
            mine
              ? 'rounded-br-md bg-primary text-primary-foreground'
              : 'rounded-bl-md bg-muted text-foreground',
          )}
        >
          {quoted && (
            <div
              className={cn(
                'rounded-md border-l-2 px-2.5 py-1.5 text-xs',
                mine
                  ? 'border-primary-foreground/60 bg-primary-foreground/10'
                  : 'border-primary bg-background/70',
              )}
            >
              <p className="font-medium">{quoted.authorName}</p>
              <p className="line-clamp-2 opacity-80">{quoted.body}</p>
            </div>
          )}
          {message.body && <p className="break-words whitespace-pre-wrap">{message.body}</p>}
          {message.attachments.map((file) => (
            <AttachmentCard key={file.name} file={file} mine={mine} />
          ))}
        </div>
        <div className="flex shrink-0 opacity-0 transition-opacity group-hover/msg:opacity-100 focus-within:opacity-100">
          <Button variant="ghost" size="icon-sm" onClick={onReply} aria-label={t('thread.reply')}>
            <Reply />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={t('thread.react')}>
                <SmilePlus />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={mine ? 'end' : 'start'}>
              {QUICK_REACTIONS.map((label) => (
                <DropdownMenuItem key={label} onSelect={() => onReact(label)}>
                  {t(`reactions.${reactionKey(label)}`)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {message.reactions.length > 0 && (
        <div className={cn('mt-1 flex flex-wrap gap-1', mine && 'justify-end')}>
          {message.reactions.map((r) => (
            <button
              key={r.label}
              type="button"
              onClick={() => onReact(r.label)}
              aria-pressed={r.mine}
              className={cn(
                'inline-flex h-6 items-center gap-1 rounded-full border px-2 text-xs transition-colors',
                r.mine
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'bg-card text-muted-foreground hover:text-foreground',
              )}
            >
              {t(`reactions.${reactionKey(r.label)}`)}
              <span className="font-medium tabular-nums">{r.count}</span>
            </button>
          ))}
        </div>
      )}
      {showReceipt && (
        <p className="mt-1 flex items-center gap-1 px-1 text-[0.6875rem] text-muted-foreground">
          {message.read ? (
            <CheckCheck className="size-3.5 text-primary" />
          ) : (
            <Check className="size-3.5" />
          )}
          {message.read ? t('thread.read') : t('thread.sent')}
        </p>
      )}
    </div>
  );
}
