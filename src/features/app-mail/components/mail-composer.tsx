import { Paperclip, X } from 'lucide-react';
import { useRef, useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { TagInput } from '@/shared/components/forms/tag-input';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Spinner } from '@/shared/ui/spinner';

import type { OutgoingMail } from '../api/mail-api';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ComposerDefaults = Partial<Pick<OutgoingMail, 'to' | 'cc' | 'subject' | 'body'>>;

/**
 * Message form shared by the compose dialog and inline reply/forward:
 * To/Cc chips (validated emails), subject, body, attachments.
 */
export function MailComposer({
  defaults,
  sending,
  compact,
  onSend,
  onSaveDraft,
  onCancel,
}: {
  defaults?: ComposerDefaults;
  sending: boolean;
  /** Inline mode: no subject field, smaller body. */
  compact?: boolean;
  onSend: (mail: OutgoingMail) => void;
  onSaveDraft?: (mail: OutgoingMail) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation('app-mail');
  const [to, setTo] = useState<string[]>(defaults?.to ?? []);
  const [cc, setCc] = useState<string[]>(defaults?.cc ?? []);
  const [showCc, setShowCc] = useState((defaults?.cc?.length ?? 0) > 0);
  const [subject, setSubject] = useState(defaults?.subject ?? '');
  const [body, setBody] = useState(defaults?.body ?? '');
  const [files, setFiles] = useState<Array<{ name: string; size: number }>>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const validate = (value: string) => (EMAIL.test(value) ? undefined : t('compose.invalidEmail'));
  const mail = (): OutgoingMail => ({ to, cc, subject, body, attachments: files });

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!to.length) return setError(t('compose.needRecipient'));
        setError(null);
        onSend(mail());
      }}
    >
      <div className="grid gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="mail-to">{t('compose.to')}</Label>
          {!showCc && (
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={() => setShowCc(true)}
            >
              {t('compose.addCc')}
            </button>
          )}
        </div>
        <TagInput
          id="mail-to"
          value={to}
          onChange={setTo}
          validate={validate}
          lowercase
          invalid={!!error}
          placeholder={t('compose.toPlaceholder')}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
      {showCc && (
        <div className="grid gap-1.5">
          <Label htmlFor="mail-cc">{t('compose.cc')}</Label>
          <TagInput
            id="mail-cc"
            value={cc}
            onChange={setCc}
            validate={validate}
            lowercase
            placeholder={t('compose.toPlaceholder')}
          />
        </div>
      )}
      {!compact && (
        <div className="grid gap-1.5">
          <Label htmlFor="mail-subject">{t('compose.subject')}</Label>
          <Input id="mail-subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
      )}
      <div className="grid gap-1.5">
        <Label htmlFor="mail-body" className={compact ? 'sr-only' : undefined}>
          {t('compose.body')}
        </Label>
        <textarea
          id="mail-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t('compose.bodyPlaceholder')}
          className={
            'w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm leading-relaxed outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 ' +
            (compact ? 'min-h-28' : 'min-h-56')
          }
        />
      </div>
      {files.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {files.map((file) => (
            <li
              key={file.name}
              className="flex items-center gap-1.5 rounded-md border bg-muted/50 py-1 pr-1 pl-2 text-xs"
            >
              <Paperclip className="size-3" />
              <span className="max-w-48 truncate">{file.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="size-5"
                onClick={() => setFiles((all) => all.filter((f) => f.name !== file.name))}
                aria-label={t('compose.removeFile', { name: file.name })}
              >
                <X />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <input
        ref={fileInput}
        type="file"
        multiple
        hidden
        onChange={(e) => {
          const picked = Array.from(e.target.files ?? []).map((f) => ({
            name: f.name,
            size: f.size,
          }));
          setFiles((all) => [...all, ...picked.filter((p) => !all.some((a) => a.name === p.name))]);
          e.target.value = '';
        }}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={sending}>
          {sending && <Spinner />} {t('compose.send')}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInput.current?.click()}
          aria-label={t('compose.attach')}
        >
          <Paperclip />
        </Button>
        <div className="ml-auto flex gap-2">
          {onSaveDraft && (
            <Button type="button" variant="outline" onClick={() => onSaveDraft(mail())}>
              {t('compose.saveDraft')}
            </Button>
          )}
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t('compose.discard')}
          </Button>
        </div>
      </div>
    </form>
  );
}
