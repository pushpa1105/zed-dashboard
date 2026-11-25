import { CheckCircle2, MessageSquare, MessagesSquare } from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { Link } from '@/core/router/router';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { EmptyState } from '@/shared/components/display/empty-state';
import { Tag } from '@/shared/components/display/tag';
import { SearchInput } from '@/shared/components/forms/search-input';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { formatRelative } from '@/shared/lib/format';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Skeleton } from '@/shared/ui/skeleton';

import { threadsQuery, useThreads, type ThreadFilters } from '../api/academy-api';
import { FilterTabs } from '../components/filter-tabs';
import { QueryState } from '../components/query-state';
import { THREAD_FILTERS, type Thread, type ThreadFilter } from '../model/academy';
import { academyRoutes } from '../routes';

const INITIAL: ThreadFilters = { filter: 'all', courseId: '', q: '' };

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(threadsQuery(INITIAL));
    return null;
  };

function ThreadRow({ thread }: { thread: Thread }) {
  const { t } = useTranslation('academy');
  return (
    <li className="flex gap-4 px-6 py-4">
      <div className="hidden w-14 shrink-0 flex-col items-center rounded-lg border py-2 sm:flex">
        <span className="text-lg leading-none font-semibold tabular-nums">{thread.votes}</span>
        <span className="text-[0.625rem] text-muted-foreground uppercase">
          {t('discussions.votes', { count: thread.votes })}
        </span>
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <Link
          to={academyRoutes.thread.href({ threadId: thread.id })}
          className="font-medium hover:underline"
        >
          {thread.title}
        </Link>
        <p className="line-clamp-2 text-sm text-muted-foreground">{thread.body}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
          {thread.answered ? (
            <Tag tone="success" size="sm" icon={CheckCircle2}>
              {t('discussions.answered')}
            </Tag>
          ) : (
            <Tag tone="warning" size="sm">
              {t('discussions.filters.unanswered')}
            </Tag>
          )}
          <Tag size="sm">{thread.courseTitle}</Tag>
          <span>
            {thread.mine ? t('discussions.you') : thread.author} ·{' '}
            {t('discussions.active', { when: formatRelative(thread.lastActivityAt) })}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="size-3.5" />
            {t('discussions.replies', { count: thread.replyCount })}
          </span>
        </div>
      </div>
    </li>
  );
}

/** Course forum: every question across courses, filterable by status, course and text. */
export default function DiscussionsPage() {
  const { t } = useTranslation('academy');
  const [filter, setFilter] = useState<ThreadFilter>(INITIAL.filter);
  const [courseId, setCourseId] = useState(INITIAL.courseId);
  const [search, setSearch] = useState(INITIAL.q);
  const q = useDebounce(search);
  const query = useThreads({ filter, courseId, q });

  return (
    <Page width="wide" title={t('discussions.title')} description={t('discussions.description')}>
      <QueryState query={query} skeleton={<Skeleton className="h-[32rem] rounded-xl" />}>
        {({ threads, counts, courses }) => (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <FilterTabs
                label={t('discussions.filterLabel')}
                value={filter}
                onChange={setFilter}
                tabs={THREAD_FILTERS.map((value) => ({
                  value,
                  label: t(`discussions.filters.${value}`),
                  count: counts[value],
                }))}
              />
              <div className="flex flex-col gap-2 sm:flex-row">
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder={t('discussions.search')}
                  aria-label={t('discussions.search')}
                  containerClassName="sm:w-60"
                />
                <Select
                  value={courseId || 'all'}
                  onValueChange={(v) => setCourseId(v === 'all' ? '' : v)}
                >
                  <SelectTrigger className="sm:w-56" aria-label={t('discussions.course')}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem value="all">{t('students.allCourses')}</SelectItem>
                    {courses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <SectionCard flush>
              {threads.length ? (
                <ul className="divide-y">
                  {threads.map((thread) => (
                    <ThreadRow key={thread.id} thread={thread} />
                  ))}
                </ul>
              ) : (
                <EmptyState
                  variant="plain"
                  icon={MessagesSquare}
                  title={t('discussions.empty.title')}
                  description={t('discussions.empty.description')}
                />
              )}
            </SectionCard>
          </div>
        )}
      </QueryState>
    </Page>
  );
}
