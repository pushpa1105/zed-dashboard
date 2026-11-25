import { useQueryClient } from '@tanstack/react-query';
import { useState, useSyncExternalStore } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Head } from '@/core/layout/head';
import { notify } from '@/core/notify/notify';
import { useSearchParams } from '@/core/router/router';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { cn } from '@/shared/lib/cn';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/shared/ui/resizable';
import { Sheet, SheetContent, SheetTitle } from '@/shared/ui/sheet';

import {
  listQuery,
  mailKeys,
  summaryQuery,
  useMail,
  useMailList,
  useMailPatch,
  useMailSummary,
  type MailPatch,
} from '../api/mail-api';
import { ComposeDialog } from '../components/compose-dialog';
import { MailList } from '../components/mail-list';
import { MailNav } from '../components/mail-nav';
import { MailReader } from '../components/mail-reader';
import { FOLDER_IDS, type FolderId, type MailView } from '../model/mail';

const INBOX: MailView = { kind: 'folder', id: 'inbox' };

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await Promise.all([
      queryClient.prefetchQuery(summaryQuery()),
      queryClient.prefetchQuery(listQuery(INBOX, '')),
    ]);
    return null;
  };

function useMedia(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', cb);
      return () => mql.removeEventListener('change', cb);
    },
    () => window.matchMedia(query).matches,
    () => true,
  );
}

/** Three-pane mail client. `?folder=` / `?label=` pick the mailbox, `?m=` the open message. */
export default function MailPage() {
  const { t } = useTranslation('app-mail');
  const queryClient = useQueryClient();
  const wide = useMedia('(min-width: 1024px)');
  const tablet = useMedia('(min-width: 768px)');
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 300);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [composeOpen, setComposeOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  const label = params.get('label');
  const view: MailView = label
    ? { kind: 'label', id: label }
    : { kind: 'folder', id: params.get('folder') ?? 'inbox' };
  const openId = params.get('m');

  const summary = useMailSummary();
  const list = useMailList(view, debounced);
  const message = useMail(openId);
  const patch = useMailPatch();

  const setView = (next: MailView) => {
    setChecked(new Set());
    setNavOpen(false);
    setParams(next.kind === 'label' ? { label: next.id } : { folder: next.id });
  };
  const open = (id: string | null) =>
    setParams((p) => {
      if (id) p.set('m', id);
      else p.delete('m');
      return p;
    });

  const onPatch = (changes: Omit<MailPatch, 'ids'>, ids = [...checked]) => {
    if (!ids.length) return;
    const from = view.kind === 'folder' ? view.id : null;
    patch.mutate(
      { ids, ...changes },
      {
        onSuccess: () => {
          setChecked(new Set());
          if (changes.folder && ids.includes(openId ?? '')) open(null);
          if (changes.folder && from && !['starred', 'trash'].includes(from)) {
            notify.undoable(
              t(changes.folder === 'trash' ? 'toast.deleted' : 'toast.archived', {
                count: ids.length,
              }),
              () => patch.mutate({ ids, folder: from }),
              { undoLabel: t('toast.undo') },
            );
          }
        },
      },
    );
  };

  const title =
    view.kind === 'label'
      ? (summary.data?.labels.find((l) => l.id === view.id)?.name ?? '')
      : FOLDER_IDS.includes(view.id as FolderId)
        ? t(`folders.${view.id as FolderId}`)
        : view.id;

  const labels = summary.data?.labels ?? [];
  const nav = (
    <MailNav
      summary={summary.data}
      view={view}
      onView={setView}
      onCompose={() => setComposeOpen(true)}
    />
  );
  const listPane = (
    <MailList
      title={title}
      mails={list.data}
      loading={list.isPending}
      fetching={list.isFetching}
      labels={labels}
      selectedId={openId}
      onOpen={open}
      checked={checked}
      onChecked={setChecked}
      query={query}
      onQuery={setQuery}
      onRefresh={() => void queryClient.invalidateQueries({ queryKey: mailKeys.all })}
      onPatch={onPatch}
      onMenu={() => setNavOpen(true)}
      inTrash={view.kind === 'folder' && view.id === 'trash'}
    />
  );
  const reader = (
    <MailReader
      key={openId}
      mail={message.data}
      loading={!!openId && message.isPending}
      labels={labels}
      onBack={() => open(null)}
      onPatch={onPatch}
    />
  );

  return (
    <>
      <Head title={t('title')} />
      <div className="h-[calc(100svh-4rem)] min-h-[32rem] overflow-hidden bg-background">
        {tablet ? (
          <ResizablePanelGroup orientation="horizontal">
            {wide && (
              <>
                <ResizablePanel defaultSize="17%" minSize="13%" maxSize="24%">
                  {nav}
                </ResizablePanel>
                <ResizableHandle />
              </>
            )}
            <ResizablePanel defaultSize={wide ? '35%' : '45%'} minSize="26%">
              {listPane}
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={wide ? '48%' : '55%'} minSize="30%">
              {reader}
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <div className={cn('h-full')}>{openId ? reader : listPane}</div>
        )}
      </div>
      <Sheet open={navOpen && !wide} onOpenChange={setNavOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">{t('mailboxes.label')}</SheetTitle>
          {nav}
        </SheetContent>
      </Sheet>
      <ComposeDialog
        open={composeOpen}
        onOpenChange={setComposeOpen}
        onDraftSaved={() => void queryClient.invalidateQueries({ queryKey: mailKeys.all })}
      />
    </>
  );
}
