import {
  Archive,
  ArrowLeft,
  Forward,
  Mail as MailIcon,
  MailOpen,
  Paperclip,
  Reply,
  Star,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { notify } from '@/core/notify/notify';
import { EmptyState } from '@/shared/components/display/empty-state';
import { FileItem } from '@/shared/components/display/file-item';
import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { cn } from '@/shared/lib/cn';
import { formatDate, formatRelative } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Separator } from '@/shared/ui/separator';
import { Skeleton } from '@/shared/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';

import { useSendMail, type MailPatch } from '../api/mail-api';
import { TONE_COLOR, type Mail, type MailSummary } from '../model/mail';

import { MailComposer, type ComposerDefaults } from './mail-composer';

type Mode = { kind: 'reply' | 'forward'; defaults: ComposerDefaults } | null;

function quote(mail: Mail, wrote: string) {
  return `\n\n${wrote}\n${mail.body
    .split('\n')
    .map((line) => `> ${line}`)
    .join('\n')}`;
}

/** Reading pane: actions, headers, body, attachments and an inline reply/forward composer. */
export function MailReader({
  mail,
  loading,
  labels,
  onBack,
  onPatch,
}: {
  mail?: Mail;
  loading: boolean;
  labels: MailSummary['labels'];
  onBack: () => void;
  onPatch: (patch: Omit<MailPatch, 'ids'>, ids?: string[]) => void;
}) {
  const { t } = useTranslation('app-mail');
  const send = useSendMail();
  const [mode, setMode] = useState<Mode>(null);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-6 w-2/3" />
        <div className="flex gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!mail) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState
          icon={MailIcon}
          title={t('reader.emptyTitle')}
          description={t('reader.emptyHint')}
          variant="plain"
        />
      </div>
    );
  }

  const wrote = t('reader.wrote', {
    date: formatDate(mail.date, 'MMM D, YYYY HH:mm'),
    name: mail.from.name,
  });
  const actions = [
    {
      label: t('actions.archive'),
      icon: Archive,
      run: () => onPatch({ folder: 'archive' }, [mail.id]),
    },
    {
      label: t('actions.delete'),
      icon: Trash2,
      run: () => onPatch({ folder: 'trash' }, [mail.id]),
    },
    {
      label: t('actions.markUnread'),
      icon: MailOpen,
      run: () => onPatch({ read: false }, [mail.id]),
    },
  ];

  return (
    <div className="flex h-full min-w-0 flex-col">
      <div className="flex h-14 shrink-0 items-center gap-1 border-b px-3 md:px-5">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onBack}
          aria-label={t('reader.back')}
        >
          <ArrowLeft />
        </Button>
        {actions.map(({ label, icon: Icon, run }) => (
          <Tooltip key={label}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" onClick={run} aria-label={label}>
                <Icon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        ))}
        <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-5" />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onPatch({ starred: !mail.starred }, [mail.id])}
              aria-pressed={mail.starred}
              aria-label={mail.starred ? t('actions.unstar') : t('actions.star')}
            >
              <Star className={cn(mail.starred && 'fill-warning text-warning')} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{mail.starred ? t('actions.unstar') : t('actions.star')}</TooltipContent>
        </Tooltip>
        <div className="ml-auto flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setMode({
                kind: 'reply',
                defaults: { to: [mail.from.email], body: quote(mail, wrote) },
              })
            }
          >
            <Reply /> <span className="hidden sm:inline">{t('reader.reply')}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMode({ kind: 'forward', defaults: { body: quote(mail, wrote) } })}
          >
            <Forward /> <span className="hidden sm:inline">{t('reader.forward')}</span>
          </Button>
        </div>
      </div>

      <article className="flex-1 overflow-y-auto px-5 py-6 md:px-8">
        <h2 className="text-xl leading-snug font-semibold tracking-tight">{mail.subject}</h2>
        {mail.labels.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {mail.labels.map((id) => {
              const label = labels.find((l) => l.id === id);
              return label ? (
                <span
                  key={id}
                  className="inline-flex h-6 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium"
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ background: TONE_COLOR[label.tone] }}
                  />
                  {label.name}
                </span>
              ) : null;
            })}
          </div>
        )}
        <div className="mt-6 flex items-start gap-3">
          <InitialsAvatar name={mail.from.name} size="md" />
          <div className="min-w-0 flex-1 text-sm">
            <p className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-semibold">{mail.from.name}</span>
              <span className="text-muted-foreground">&lt;{mail.from.email}&gt;</span>
            </p>
            <p className="text-muted-foreground">
              {t('reader.to')} {mail.to.map((p) => p.name).join(', ')}
              {mail.cc.length > 0 &&
                ` · ${t('compose.cc')} ${mail.cc.map((p) => p.name).join(', ')}`}
            </p>
          </div>
          <time
            className="shrink-0 text-right text-xs text-muted-foreground"
            dateTime={new Date(mail.date).toISOString()}
          >
            {formatDate(mail.date, 'MMM D, YYYY HH:mm')}
            <span className="block">{formatRelative(mail.date)}</span>
          </time>
        </div>

        <div className="mt-6 max-w-3xl text-sm leading-6 whitespace-pre-line">{mail.body}</div>

        {mail.attachments.length > 0 && (
          <section className="mt-8 max-w-3xl space-y-2">
            <h3 className="flex items-center gap-1.5 text-xs font-medium tracking-wider text-muted-foreground uppercase">
              <Paperclip className="size-3.5" />
              {t('reader.attachments', { count: mail.attachments.length })}
            </h3>
            <div className="grid gap-2 2xl:grid-cols-2">
              {mail.attachments.map((file) => (
                <FileItem
                  key={file.name}
                  name={file.name}
                  size={file.size}
                  action={
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => notify.info(t('reader.downloadDemo'))}
                    >
                      {t('reader.download')}
                    </Button>
                  }
                />
              ))}
            </div>
          </section>
        )}

        {mode && (
          <section className="mt-8 max-w-3xl rounded-xl border bg-card p-4 shadow-xs">
            <p className="mb-3 flex items-center gap-2 text-sm font-medium">
              {mode.kind === 'reply' ? (
                <Reply className="size-4" />
              ) : (
                <Forward className="size-4" />
              )}
              {mode.kind === 'reply'
                ? t('reader.replyTo', { name: mail.from.name })
                : t('reader.forward')}
            </p>
            <MailComposer
              key={mode.kind}
              compact
              defaults={mode.defaults}
              sending={send.isPending}
              onCancel={() => setMode(null)}
              onSend={(outgoing) =>
                send.mutate(
                  {
                    ...outgoing,
                    subject: `${mode.kind === 'reply' ? 'Re' : 'Fwd'}: ${mail.subject}`,
                  },
                  { onSuccess: () => setMode(null) },
                )
              }
            />
          </section>
        )}
      </article>
    </div>
  );
}
