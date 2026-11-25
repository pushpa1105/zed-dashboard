import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Head } from '@/core/layout/head';
import { useSearchParams } from '@/core/router/router';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { cn } from '@/shared/lib/cn';

import { conversationsQuery, useConversations, useThread } from '../api/chat-api';
import { ConversationList } from '../components/conversation-list';
import { DetailsPanel } from '../components/details-panel';
import { ThreadView } from '../components/thread-view';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(conversationsQuery());
    return null;
  };

/**
 * Three-pane messenger: conversations, thread, details. On phones only one
 * pane shows at a time (`?c=` selects the conversation, Back clears it).
 */
export default function ChatPage() {
  const { t } = useTranslation('app-chat');
  const isMobile = useIsMobile();
  const [params, setParams] = useSearchParams();
  const conversations = useConversations();
  const [detailsOpen, setDetailsOpen] = useState(false);

  const requested = params.get('c');
  const selectedId = requested ?? (isMobile ? null : (conversations.data?.[0]?.id ?? null));
  const thread = useThread(selectedId);

  const select = (id: string | null) =>
    setParams((p) => {
      if (id) p.set('c', id);
      else p.delete('c');
      return p;
    });

  return (
    <>
      <Head title={t('title')} />
      <div className="flex h-[calc(100svh-4rem)] min-h-[32rem] overflow-hidden bg-background">
        <aside
          className={cn(
            'w-full shrink-0 border-r md:w-80 lg:w-[22rem]',
            selectedId && 'hidden md:block',
          )}
        >
          <ConversationList
            conversations={conversations.data}
            loading={conversations.isPending}
            selectedId={selectedId}
            onSelect={(id) => {
              select(id);
              setDetailsOpen(false);
            }}
          />
        </aside>
        <section className={cn('min-w-0 flex-1', !selectedId && 'hidden md:block')}>
          {selectedId ? (
            <ThreadView
              thread={thread.data}
              loading={thread.isPending}
              onBack={() => select(null)}
              detailsOpen={detailsOpen}
              onToggleDetails={() => setDetailsOpen((open) => !open)}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              {t('thread.pick')}
            </div>
          )}
        </section>
        {detailsOpen && thread.data && (
          <aside className="fixed inset-y-0 right-0 z-40 w-full max-w-sm border-l bg-background shadow-xl xl:static xl:z-auto xl:w-80 xl:shadow-none">
            <DetailsPanel
              conversation={thread.data.conversation}
              messages={thread.data.messages}
              onClose={() => setDetailsOpen(false)}
            />
          </aside>
        )}
      </div>
    </>
  );
}
