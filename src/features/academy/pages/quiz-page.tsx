import { ArrowLeft, ListChecks, Play } from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { Link, useParams } from '@/core/router/router';
import { StatStrip } from '@/shared/components/dashboard/stat-strip';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

import { quizQuery, useQuiz, useSubmitQuiz } from '../api/academy-api';
import { QueryState } from '../components/query-state';
import { QuizResult } from '../components/quiz-result';
import { QuizRunner } from '../components/quiz-runner';
import { minutes, percent } from '../lib/format';
import type { Quiz } from '../model/academy';
import { academyRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ params }) => {
    await queryClient.prefetchQuery(quizQuery(params.courseId!));
    return null;
  };

function QuizIntro({ quiz, onStart }: { quiz: Quiz; onStart: () => void }) {
  const { t } = useTranslation('academy');
  return (
    <section className="space-y-6 rounded-xl border bg-card p-6 shadow-xs">
      <div className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ListChecks className="size-5" />
        </span>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{t('quiz.intro.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('quiz.intro.rules')}</p>
        </div>
      </div>
      <StatStrip
        items={[
          { key: 'questions', label: t('quiz.intro.questions'), value: quiz.questions.length },
          {
            key: 'time',
            label: t('quiz.intro.time'),
            value: minutes(quiz.timeLimitSec / 60),
          },
          { key: 'pass', label: t('quiz.intro.pass'), value: `${quiz.passingScore}%` },
          {
            key: 'best',
            label: t('quiz.intro.best'),
            value: percent(quiz.bestScore),
            hint: t('quiz.intro.attempts', { count: quiz.attempts }),
          },
        ]}
      />
      <Button size="lg" onClick={onStart}>
        <Play /> {t('quiz.intro.start')}
      </Button>
    </section>
  );
}

function QuizFlow({ quiz }: { quiz: Quiz }) {
  const submit = useSubmitQuiz(quiz.courseId);
  const [attempt, setAttempt] = useState(0);

  if (submit.data)
    return (
      <QuizResult
        quiz={quiz}
        result={submit.data}
        onRetake={() => {
          submit.reset();
          setAttempt((a) => a + 1);
        }}
      />
    );
  if (!attempt) return <QuizIntro quiz={quiz} onStart={() => setAttempt(1)} />;
  return (
    <QuizRunner
      key={attempt}
      quiz={quiz}
      submitting={submit.isPending}
      onSubmit={(answers) => !submit.isPending && submit.mutate(answers)}
    />
  );
}

/** Timed multiple-choice quiz for a course, with a scored review at the end. */
export default function QuizPage() {
  const { t } = useTranslation('academy');
  const { courseId } = useParams();
  const query = useQuiz(courseId!);

  return (
    <Page
      width="narrow"
      title={t('quiz.title')}
      description={query.data?.courseTitle}
      actions={
        <Button variant="outline" asChild>
          <Link to={academyRoutes.course.href({ courseId: courseId! })}>
            <ArrowLeft /> {t('quiz.result.backToCourse')}
          </Link>
        </Button>
      }
    >
      <QueryState query={query} skeleton={<Skeleton className="h-80 rounded-xl" />}>
        {(quiz) => <QuizFlow quiz={quiz} />}
      </QueryState>
    </Page>
  );
}
