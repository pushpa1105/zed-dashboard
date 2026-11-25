import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronUp,
  Circle,
  FileDown,
  MessageSquarePlus,
  StickyNote,
} from 'lucide-react';
import { useCallback, useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Head } from '@/core/layout/head';
import { Link, useParams } from '@/core/router/router';
import { EmptyState } from '@/shared/components/display/empty-state';
import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Progress } from '@/shared/ui/progress';
import { Skeleton } from '@/shared/ui/skeleton';
import { Spinner } from '@/shared/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Textarea } from '@/shared/ui/textarea';

import { lessonQuery, useAddNote, useAsk, useCompleteLesson, useLesson } from '../api/academy-api';
import { LessonPlayer } from '../components/lesson-player';
import { LessonTypeIcon } from '../components/lesson-type-icon';
import { QueryError } from '../components/query-error';
import { clock, minutes } from '../lib/format';
import type { LessonPage as LessonData } from '../model/academy';
import { academyRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ params }) => {
    await queryClient.prefetchQuery(lessonQuery(params.courseId!, params.lessonId!));
    return null;
  };

function LessonList({ data, courseId }: { data: LessonData; courseId: string }) {
  const { t } = useTranslation('academy');
  const lessons = data.modules.flatMap((m) => m.lessons);
  const done = lessons.filter((l) => l.completed).length;
  const pct = Math.round((done / lessons.length) * 100);

  return (
    <aside className="overflow-hidden rounded-xl border bg-card shadow-xs xl:sticky xl:top-24">
      <div className="space-y-2 border-b p-5">
        <p className="text-sm font-semibold">{data.course.title}</p>
        <div className="flex items-center gap-3">
          <Progress value={pct} className="h-1.5 flex-1" />
          <span className="text-xs text-muted-foreground tabular-nums">
            {t('lesson.progress', { done, total: lessons.length })}
          </span>
        </div>
      </div>
      <div className="max-h-[calc(100svh-16rem)] overflow-y-auto p-2">
        {data.modules.map((module, m) => (
          <div key={module.id} className="py-2">
            <p className="px-3 pb-1.5 text-xs font-medium text-muted-foreground">
              {m + 1}. {module.title}
            </p>
            <ul>
              {module.lessons.map((lesson) => {
                const current = lesson.id === data.lesson.id;
                return (
                  <li key={lesson.id}>
                    <Link
                      to={academyRoutes.lesson.href({ courseId, lessonId: lesson.id })}
                      aria-current={current ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-muted',
                        current && 'bg-primary/10 font-medium text-primary hover:bg-primary/10',
                      )}
                    >
                      {lesson.completed ? (
                        <CheckCircle2 className="size-4 shrink-0 text-success" />
                      ) : (
                        <Circle className="size-4 shrink-0 text-muted-foreground/50" />
                      )}
                      <span className="flex-1 truncate">{lesson.title}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {minutes(lesson.durationMin)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  );
}

function NotesTab({
  data,
  courseId,
  position,
}: {
  data: LessonData;
  courseId: string;
  position: number;
}) {
  const { t } = useTranslation('academy');
  const add = useAddNote(courseId, data.lesson.id);
  const [body, setBody] = useState('');
  return (
    <div className="space-y-5">
      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!body.trim()) return;
          add.mutate(
            { lessonId: data.lesson.id, atSec: Math.round(position), body: body.trim() },
            { onSuccess: () => setBody('') },
          );
        }}
      >
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t('lesson.notes.placeholder', { time: clock(position) })}
          rows={3}
        />
        <Button type="submit" size="sm" disabled={!body.trim() || add.isPending}>
          {add.isPending ? <Spinner /> : <StickyNote />}{' '}
          {t('lesson.notes.add', { time: clock(position) })}
        </Button>
      </form>
      {data.notes.length === 0 ? (
        <EmptyState variant="inline" icon={StickyNote} title={t('lesson.notes.empty')} />
      ) : (
        <ul className="space-y-3">
          {data.notes.map((note) => (
            <li key={note.id} className="flex gap-3 rounded-lg border p-3">
              <span className="h-fit rounded bg-primary/10 px-1.5 py-0.5 font-mono text-xs text-primary">
                {clock(note.atSec)}
              </span>
              <p className="text-sm">{note.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function QaTab({ data, courseId }: { data: LessonData; courseId: string }) {
  const { t } = useTranslation('academy');
  const ask = useAsk(courseId, data.lesson.id);
  const [body, setBody] = useState('');
  return (
    <div className="space-y-5">
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          if (body.trim().length < 10) return;
          ask.mutate(
            { lessonId: data.lesson.id, body: body.trim() },
            { onSuccess: () => setBody('') },
          );
        }}
      >
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t('lesson.qa.placeholder')}
          rows={2}
          className="flex-1"
        />
        <Button
          type="submit"
          disabled={body.trim().length < 10 || ask.isPending}
          className="sm:self-end"
        >
          {ask.isPending ? <Spinner /> : <MessageSquarePlus />} {t('lesson.qa.ask')}
        </Button>
      </form>
      <ul className="divide-y">
        {data.questions.map((q) => (
          <li key={q.id} className="flex gap-4 py-4 first:pt-0">
            <div className="flex w-10 shrink-0 flex-col items-center rounded-lg border py-1 text-xs">
              <ChevronUp className="size-4" />
              <span className="font-medium tabular-nums">{q.votes}</span>
            </div>
            <div className="min-w-0 space-y-1.5">
              <p className="text-sm leading-relaxed">{q.body}</p>
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <InitialsAvatar name={q.author} size="xs" />
                {q.author} · {t('lesson.qa.answers', { count: q.answers })}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Lesson player with notes pinned to the timeline, a synced transcript and Q&A. */
export default function LessonPage() {
  const { t } = useTranslation('academy');
  const { courseId, lessonId } = useParams();
  const query = useLesson(courseId!, lessonId!);
  const complete = useCompleteLesson();
  const [position, setPosition] = useState(0);
  const [lastLesson, setLastLesson] = useState(lessonId);
  const onPositionChange = useCallback((sec: number) => setPosition(sec), []);
  const data = query.data;

  // Restart the timeline when moving to another lesson.
  if (lastLesson !== lessonId) {
    setLastLesson(lessonId);
    setPosition(0);
  }

  if (query.isError && !data) {
    return (
      <div className="mx-auto max-w-[1440px] p-4 md:p-8">
        <QueryError onRetry={() => void query.refetch()} />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="mx-auto grid max-w-[1440px] gap-6 p-4 md:p-8 xl:grid-cols-[1fr_22rem]">
        <Skeleton className="aspect-video rounded-xl" />
        <Skeleton className="h-[32rem] rounded-xl" />
      </div>
    );
  }

  const lessons = data.modules.flatMap((m) => m.lessons);
  const index = lessons.findIndex((l) => l.id === data.lesson.id);
  const prev = lessons[index - 1];
  const next = lessons[index + 1];
  const durationSec = data.lesson.durationMin * 60;
  const currentLine = [...data.lesson.transcript].reverse().find((line) => line.atSec <= position);

  return (
    <>
      <Head title={`${data.lesson.title} · ${data.course.title}`} />
      <div className="mx-auto grid w-full max-w-[1440px] items-start gap-6 p-4 md:p-8 xl:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-6">
          <LessonPlayer
            title={data.lesson.title}
            color="var(--primary)"
            durationSec={durationSec}
            position={position}
            onPositionChange={onPositionChange}
            caption={currentLine?.text}
          />
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <LessonTypeIcon type={data.lesson.type} />
                {t(`lessonTypes.${data.lesson.type}`)} · {minutes(data.lesson.durationMin)} ·{' '}
                {data.course.instructor}
              </p>
              <h1 className="text-2xl font-semibold tracking-tight">{data.lesson.title}</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              {prev && (
                <Button variant="outline" asChild>
                  <Link to={academyRoutes.lesson.href({ courseId: courseId!, lessonId: prev.id })}>
                    <ArrowLeft /> {t('lesson.previous')}
                  </Link>
                </Button>
              )}
              {data.lesson.completed ? (
                <Button variant="outline" disabled>
                  <CheckCircle2 className="text-success" /> {t('lesson.completed')}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  disabled={complete.isPending}
                  onClick={() => complete.mutate(data.lesson.id)}
                >
                  {complete.isPending ? <Spinner /> : <CheckCircle2 />} {t('lesson.markComplete')}
                </Button>
              )}
              {next && (
                <Button asChild>
                  <Link to={academyRoutes.lesson.href({ courseId: courseId!, lessonId: next.id })}>
                    {t('lesson.next')} <ArrowRight />
                  </Link>
                </Button>
              )}
            </div>
          </div>
          <Tabs defaultValue="transcript" className="gap-4">
            <TabsList>
              <TabsTrigger value="transcript">{t('lesson.tabs.transcript')}</TabsTrigger>
              <TabsTrigger value="notes">
                {t('lesson.tabs.notes')}
                {data.notes.length > 0 && (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {data.notes.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="qa">{t('lesson.tabs.qa')}</TabsTrigger>
              <TabsTrigger value="resources">{t('lesson.tabs.resources')}</TabsTrigger>
            </TabsList>
            <div className="rounded-xl border bg-card p-6 shadow-xs">
              <TabsContent value="transcript">
                <ol className="space-y-1">
                  {data.lesson.transcript.map((line) => {
                    const active = line === currentLine;
                    return (
                      <li key={line.atSec}>
                        <button
                          type="button"
                          onClick={() => setPosition(line.atSec)}
                          className={cn(
                            'flex w-full gap-4 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-muted',
                            active && 'bg-primary/8 text-foreground',
                            !active && 'text-muted-foreground',
                          )}
                        >
                          <span className="w-10 shrink-0 font-mono text-xs leading-5 text-primary">
                            {clock(line.atSec)}
                          </span>
                          <span className="leading-5">{line.text}</span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </TabsContent>
              <TabsContent value="notes">
                <NotesTab data={data} courseId={courseId!} position={position} />
              </TabsContent>
              <TabsContent value="qa">
                <QaTab data={data} courseId={courseId!} />
              </TabsContent>
              <TabsContent value="resources">
                <ul className="grid gap-3 sm:grid-cols-2">
                  {data.lesson.resources.map((r) => (
                    <li key={r.name} className="flex items-center gap-3 rounded-lg border p-3">
                      <span className="flex size-9 items-center justify-center rounded-md bg-muted">
                        <FileDown className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{r.size}</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        {t('lesson.download')}
                      </Button>
                    </li>
                  ))}
                </ul>
              </TabsContent>
            </div>
          </Tabs>
        </div>
        <LessonList data={data} courseId={courseId!} />
      </div>
    </>
  );
}
