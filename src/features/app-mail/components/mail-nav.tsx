import { PenSquare } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

import { FOLDERS, TONE_COLOR, type FolderId, type MailSummary, type MailView } from '../model/mail';

const row =
  'flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground aria-[current=true]:bg-accent aria-[current=true]:font-medium aria-[current=true]:text-accent-foreground [&>svg]:size-4';

/** Compose button, folders with unread counts and colored labels. */
export function MailNav({
  summary,
  view,
  onView,
  onCompose,
}: {
  summary?: MailSummary;
  view: MailView;
  onView: (view: MailView) => void;
  onCompose: () => void;
}) {
  const { t } = useTranslation('app-mail');
  const count = (id: string) => {
    if (id === 'starred') return summary?.starred;
    const folder = summary?.folders.find((f) => f.id === id);
    if (!folder) return undefined;
    return id === 'inbox' || id === 'spam'
      ? folder.unread
      : id === 'drafts'
        ? folder.total
        : undefined;
  };

  return (
    <nav
      className="flex h-full flex-col gap-5 overflow-y-auto p-3"
      aria-label={t('mailboxes.label')}
    >
      <Button onClick={onCompose} className="w-full">
        <PenSquare /> {t('compose.open')}
      </Button>
      <ul className="space-y-0.5">
        {FOLDERS.map(({ id, icon: Icon }) => {
          const n = count(id);
          const active = view.kind === 'folder' && view.id === id;
          return (
            <li key={id}>
              <button
                type="button"
                className={row}
                aria-current={active}
                onClick={() => onView({ kind: 'folder', id })}
              >
                <Icon />
                {t(`folders.${id as FolderId}`)}
                {n ? (
                  <span
                    className={cn(
                      'ml-auto text-xs tabular-nums',
                      id === 'inbox' && 'font-semibold text-foreground',
                    )}
                  >
                    {n}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="space-y-1">
        <p className="px-2.5 text-[0.6875rem] font-medium tracking-wider text-muted-foreground/80 uppercase">
          {t('mailboxes.labels')}
        </p>
        <ul className="space-y-0.5">
          {!summary &&
            Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="mx-2.5 my-2 h-4" />)}
          {summary?.labels.map((label) => (
            <li key={label.id}>
              <button
                type="button"
                className={row}
                aria-current={view.kind === 'label' && view.id === label.id}
                onClick={() => onView({ kind: 'label', id: label.id })}
              >
                <span
                  className="size-2.5 rounded-full"
                  style={{ background: TONE_COLOR[label.tone] }}
                  aria-hidden
                />
                {label.name}
                <span className="ml-auto text-xs tabular-nums">{label.count}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
