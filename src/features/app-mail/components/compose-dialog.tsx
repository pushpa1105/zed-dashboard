import { useTranslation } from '@/core/i18n/use-translation';
import { notify } from '@/core/notify/notify';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';

import { mailApi, useSendMail } from '../api/mail-api';

import { MailComposer } from './mail-composer';

/** New message dialog (send or save as draft). */
export function ComposeDialog({
  open,
  onOpenChange,
  onDraftSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDraftSaved: () => void;
}) {
  const { t } = useTranslation('app-mail');
  const send = useSendMail();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('compose.title')}</DialogTitle>
          <DialogDescription>{t('compose.description')}</DialogDescription>
        </DialogHeader>
        {open && (
          <MailComposer
            sending={send.isPending}
            onCancel={() => onOpenChange(false)}
            onSend={(mail) => send.mutate(mail, { onSuccess: () => onOpenChange(false) })}
            onSaveDraft={(mail) =>
              void mailApi.send({ ...mail, draft: true }).then(() => {
                notify.success(t('toast.draftSaved'));
                onDraftSaved();
                onOpenChange(false);
              })
            }
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
