import { ArrowLeft, CheckCircle2, ThumbsUp } from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { Link, useParams } from '@/core/router/router';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { Tag } from '@/shared/components/display/tag';
import { UserCell } from '@/shared/components/display/user-cell';
import { TextareaWithCounter } from '@/shared/components/forms/textarea-with-counter';
import { cn } from '@/shared/lib/cn';
import { formatRelative } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import { Skeleton } from '@/shared/ui/skeleton';
import { Spinner } from '@/shared/ui/spinner';

import { threadQuery, useReply, useThread } from '../api/academy-api';
import { QueryState } from '../components/query-state';
import type { Reply, ThreadDetail } from '../model/academy';
import { academyRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ params }) => {
    await queryClient.prefetchQuery(threadQuery(params.threadId!));
    return null;
  };

function ReplyItem({ reply }: { reply: Reply }) {
  const { t } = useTranslation('academy');
  return (
    <li
      className={cn(
        'space-y-3 rounded-xl border p-4',
        reply.accepted && 'border-success/40 bg-success/5',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <UserCell name={reply.author} secondary={formatRelative(reply.createdAt)} />
        {reply.accepted ? (
          <Tag tone="success" size="sm" icon={CheckCircle2}>
            {t('discussions.thread.accepted')}
          </Tag>
        ) : (
          reply.role === 'instructor' && (
            <Tag tone="primary" size="sm">
              {t('discussions.thread.instructor')}
            </Tag>
          )
        )}
      </div>
      <p className="text-sm leading-relaxed">{reply.body}</p>
    </li>
  );
}

function ReplyForm({ threadId }: { threadId: string }) {
  const { t } = useTranslation('academy');
  const reply = useReply();
  const [body, setBody] = useState('');
  const valid = body.trim().length >= 10;

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        reply.mutate({ threadId, body: body.trim() }, { onSuccess: () => setBody('') });
      }}
    >
      <Label htmlFor="thread-reply">{t('discussions.thread.yourReply')}</Label>
      <TextareaWithCounter
        id="thread-reply"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={t('discussions.thread.placeholder')}
        maxLength={2000}
        rows={4}
      />
      <Button type="submit" disabled={!valid || reply.isPending}>
        {reply.isPending && <Spinner />} {t('discussions.thread.post')}
      </Button>
    </form>
  );
}

function ThreadView({ thread }: { thread: ThreadDetail }) {
  const { t } = useTranslation('academy');
  return (
    <div className="space-y-6">
      <SectionCard>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Tag size="sm">{thread.courseTitle}</Tag>
            {!thread.answered && (
              <Tag tone="warning" size="sm">
                {t('discussions.filters.unanswered')}
              </Tag>
            )}
          </div>
          <p className="leading-relaxed">{thread.body}</p>
          <div className="flex items-center justify-between gap-3">
            <UserCell
              name={thread.author}
              secondary={t('discussions.thread.asked', { when: formatRelative(thread.createdAt) })}
            />
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground tabular-nums">
              <ThumbsUp className="size-4" /> {t('discussions.votes', { count: thread.votes })}
            </span>
          </div>
        </div>
      </SectionCard>
      <SectionCard title={t('discussions.replies', { count: thread.replies.length })}>
        {thread.replies.length ? (
          <ul className="space-y-3">
            {thread.replies.map((reply) => (
              <ReplyItem key={reply.id} reply={reply} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">{t('discussions.thread.noReplies')}</p>
        )}
        <div className="mt-6 border-t pt-6">
          <ReplyForm threadId={thread.id} />
        </div>
      </SectionCard>
    </div>
  );
}

/** One discussion thread with its replies and a reply form. */
export default function ThreadPage() {
  const { t } = useTranslation('academy');
  const { threadId } = useParams();
  const query = useThread(threadId!);

  return (
    <Page
      width="narrow"
      title={query.data?.title ?? t('discussions.title')}
      actions={
        <Button variant="outline" asChild>
          <Link to={academyRoutes.discussions.href()}>
            <ArrowLeft /> {t('discussions.thread.back')}
          </Link>
        </Button>
      }
    >
      <QueryState query={query} skeleton={<Skeleton className="h-96 rounded-xl" />}>
        {(thread) => <ThreadView thread={thread} />}
      </QueryState>
    </Page>
  );
}
