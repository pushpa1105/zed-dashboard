import { X } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import { Separator } from '@/shared/ui/separator';
import { Switch } from '@/shared/ui/switch';

import { useUpdateConversation } from '../api/chat-api';
import { ME, type Conversation, type Message } from '../model/chat';

import { AttachmentCard } from './message-bubble';

/** Conversation info: members, shared files, pin and mute settings. */
export function DetailsPanel({
  conversation,
  messages,
  onClose,
}: {
  conversation: Conversation;
  messages: Message[];
  onClose: () => void;
}) {
  const { t } = useTranslation('app-chat');
  const update = useUpdateConversation();
  const files = messages.flatMap((m) => m.attachments).reverse();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center justify-between border-b px-4">
        <p className="text-sm font-semibold">{t('details.title')}</p>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label={t('details.close')}>
          <X />
        </Button>
      </div>
      <div className="flex-1 space-y-6 overflow-y-auto p-5">
        <div className="flex flex-col items-center gap-2 text-center">
          <InitialsAvatar
            name={conversation.name}
            size="xl"
            shape={conversation.kind === 'group' ? 'square' : 'circle'}
          />
          <p className="font-semibold">{conversation.name}</p>
          <p className="text-sm text-muted-foreground">{conversation.topic}</p>
        </div>

        <div className="space-y-3 rounded-lg border p-3">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="chat-pin" className="font-normal">
              {t('details.pin')}
            </Label>
            <Switch
              id="chat-pin"
              checked={conversation.pinned}
              onCheckedChange={(pinned) => update.mutate({ id: conversation.id, pinned })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="chat-mute" className="font-normal">
              {t('details.mute')}
            </Label>
            <Switch
              id="chat-mute"
              checked={conversation.muted}
              onCheckedChange={(muted) => update.mutate({ id: conversation.id, muted })}
            />
          </div>
        </div>

        <section className="space-y-3">
          <h3 className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            {t('details.members', { count: conversation.members.length })}
          </h3>
          <ul className="space-y-3">
            {conversation.members.map((member) => (
              <li key={member.id} className="flex items-center gap-3">
                <InitialsAvatar
                  name={member.id === ME ? t('list.you') : member.name}
                  status={member.online ? 'online' : 'offline'}
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">
                    {member.id === ME ? t('list.you') : member.name}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {member.role}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            {t('details.files', { count: files.length })}
          </h3>
          {files.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('details.noFiles')}</p>
          ) : (
            <div className="space-y-2">
              {files.map((file) => (
                <AttachmentCard key={file.name} file={file} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
