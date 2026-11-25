import { useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';

/** Internal note composer used on orders and customer profiles. */
export function NoteForm({
  onSubmit,
  pending,
}: {
  onSubmit: (text: string, reset: () => void) => void;
  pending: boolean;
}) {
  const { t } = useTranslation('ecommerce');
  const [note, setNote] = useState('');

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (note.trim()) onSubmit(note.trim(), () => setNote(''));
      }}
    >
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t('common.notePlaceholder')}
        aria-label={t('common.notePlaceholder')}
        rows={2}
      />
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={!note.trim() || pending}>
          {t('common.addNote')}
        </Button>
      </div>
    </form>
  );
}
