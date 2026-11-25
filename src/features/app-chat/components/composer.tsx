import { Paperclip, SendHorizontal, X } from 'lucide-react';
import { useRef, useState, type KeyboardEvent } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';

import { formatSize, kindFromName } from '../lib/format';
import type { Attachment } from '../model/chat';

type ComposerProps = {
  replyTo: { authorName: string; body: string } | null;
  onCancelReply: () => void;
  onSend: (input: { body: string; attachments: Attachment[] }) => void;
  sending: boolean;
  placeholder: string;
};

/** Message input: Enter sends, Shift+Enter adds a line, files attach as cards. */
export function Composer({ replyTo, onCancelReply, onSend, sending, placeholder }: ComposerProps) {
  const { t } = useTranslation('app-chat');
  const [body, setBody] = useState('');
  const [files, setFiles] = useState<Attachment[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);
  const canSend = (body.trim().length > 0 || files.length > 0) && !sending;

  const submit = () => {
    if (!canSend) return;
    onSend({ body: body.trim(), attachments: files });
    setBody('');
    setFiles([]);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div className="border-t bg-background p-3 md:p-4">
      <div className="rounded-xl border bg-card shadow-xs focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30">
        {replyTo && (
          <div className="flex items-start gap-2 border-b px-3 py-2 text-xs">
            <div className="min-w-0 flex-1 border-l-2 border-primary pl-2">
              <p className="font-medium">
                {t('composer.replyingTo', { name: replyTo.authorName })}
              </p>
              <p className="truncate text-muted-foreground">{replyTo.body}</p>
            </div>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onCancelReply}
              aria-label={t('composer.cancelReply')}
            >
              <X />
            </Button>
          </div>
        )}
        {files.length > 0 && (
          <ul className="flex flex-wrap gap-2 border-b px-3 py-2">
            {files.map((file) => (
              <li
                key={file.name}
                className="flex items-center gap-1.5 rounded-md bg-muted py-1 pr-1 pl-2 text-xs"
              >
                <Paperclip className="size-3" />
                <span className="max-w-40 truncate">{file.name}</span>
                <span className="text-muted-foreground">{formatSize(file.size)}</span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="size-5"
                  onClick={() => setFiles((all) => all.filter((f) => f.name !== file.name))}
                  aria-label={t('composer.removeFile', { name: file.name })}
                >
                  <X />
                </Button>
              </li>
            ))}
          </ul>
        )}
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder={placeholder}
          aria-label={t('composer.label')}
          className="block field-sizing-content max-h-40 min-h-11 w-full resize-none bg-transparent px-3.5 py-3 text-sm outline-none placeholder:text-muted-foreground"
        />
        <div className="flex items-center gap-1 px-2 pb-2">
          <input
            ref={fileInput}
            type="file"
            multiple
            hidden
            onChange={(e) => {
              const picked = Array.from(e.target.files ?? []).map((f) => ({
                name: f.name,
                size: f.size,
                kind: kindFromName(f.name),
              }));
              setFiles((all) => [
                ...all,
                ...picked.filter((p) => !all.some((a) => a.name === p.name)),
              ]);
              e.target.value = '';
            }}
          />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => fileInput.current?.click()}
            aria-label={t('composer.attach')}
          >
            <Paperclip />
          </Button>
          <span className="ml-1 hidden text-xs text-muted-foreground sm:inline">
            {t('composer.hint')}
          </span>
          <Button size="sm" className={cn('ml-auto')} onClick={submit} disabled={!canSend}>
            {t('composer.send')} <SendHorizontal />
          </Button>
        </div>
      </div>
    </div>
  );
}
