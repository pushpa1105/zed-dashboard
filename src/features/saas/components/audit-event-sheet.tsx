import { useTranslation } from '@/core/i18n/use-translation';
import { CodeBlock } from '@/shared/components/display/code-block';
import { DescriptionList } from '@/shared/components/display/description-list';
import { formatDate } from '@/shared/lib/format';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/sheet';

import type { AuditEvent } from '../model/admin';

import { SeverityTag } from './severity-tag';

export function AuditEventSheet({
  event,
  onClose,
}: {
  event: AuditEvent | null;
  onClose: () => void;
}) {
  const { t } = useTranslation('saas');
  return (
    <Sheet open={!!event} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {event && (
          <>
            <SheetHeader>
              <SheetTitle className="font-mono">{event.action}</SheetTitle>
              <SheetDescription>{formatDate(event.at, 'MMM D, YYYY HH:mm:ss')}</SheetDescription>
            </SheetHeader>
            <div className="space-y-6 px-4 pb-6">
              <DescriptionList
                items={[
                  { key: 'id', term: t('audit.detail.id'), detail: event.id },
                  {
                    key: 'actor',
                    term: t('audit.col.actor'),
                    detail: `${event.actor.name} (${event.actor.email})`,
                  },
                  { key: 'target', term: t('audit.col.target'), detail: event.target },
                  { key: 'ip', term: t('audit.col.ip'), detail: `${event.ip} · ${event.location}` },
                  {
                    key: 'severity',
                    term: t('audit.col.severity'),
                    detail: <SeverityTag severity={event.severity} />,
                  },
                ]}
              />
              <CodeBlock code={event.payload} title="event.json" />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
