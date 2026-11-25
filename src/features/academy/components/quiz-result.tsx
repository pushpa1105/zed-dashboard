import { CheckCircle2, CircleSlash, RotateCcw, XCircle } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Link } from '@/core/router/router';
import { ProgressRing } from '@/shared/components/charts/progress-ring';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { Tag } from '@/shared/components/display/tag';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';

import type { Quiz, QuizResult as Result } from '../model/academy';
import { academyRoutes } from '../routes';

const VERDICT = {
  correct: { icon: CheckCircle2, tone: 'success' },
  incorrect: { icon: XCircle, tone: 'danger' },
  skipped: { icon: CircleSlash, tone: 'neutral' },
} as const;

/** Score summary and a per-question review with the right answer and why. */
export function QuizResult({
  quiz,
  result,
  onRetake,
}: {
  quiz: Quiz;
  result: Result;
  onRetake: () => void;
}) {
  const { t } = useTranslation('academy');

  return (
    <div className="space-y-6">
      <section className="flex flex-col items-center gap-6 rounded-xl border bg-card p-6 text-center shadow-xs sm:flex-row sm:text-left">
        <ProgressRing
          value={result.score}
          size={104}
          strokeWidth={10}
          color={result.passed ? 'var(--success)' : 'var(--warning)'}
        >
          <span className="text-2xl font-semibold tabular-nums">{result.score}%</span>
        </ProgressRing>
        <div className="flex-1 space-y-2">
          <Tag tone={result.passed ? 'success' : 'warning'} dot>
            {t(result.passed ? 'quiz.result.passed' : 'quiz.result.failed')}
          </Tag>
          <p className="text-sm text-muted-foreground">
            {t('quiz.result.summary', {
              correct: result.correct,
              total: result.total,
              pass: quiz.passingScore,
            })}
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2 sm:justify-start">
            <Button onClick={onRetake}>
              <RotateCcw /> {t('quiz.result.retake')}
            </Button>
            <Button variant="outline" asChild>
              <Link to={academyRoutes.course.href({ courseId: quiz.courseId })}>
                {t('quiz.result.backToCourse')}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <SectionCard title={t('quiz.result.review')}>
        <ol className="space-y-6">
          {quiz.questions.map((q, i) => {
            const review = result.review.find((r) => r.questionId === q.id)!;
            const verdict = !review.selectedId
              ? 'skipped'
              : review.selectedId === review.correctId
                ? 'correct'
                : 'incorrect';
            const { icon: Icon, tone } = VERDICT[verdict];
            return (
              <li key={q.id} className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">
                    {i + 1}. {q.prompt}
                  </p>
                  <Tag tone={tone} size="sm" icon={Icon}>
                    {t(`quiz.result.${verdict}`)}
                  </Tag>
                </div>
                <ul className="space-y-1.5">
                  {q.options.map((o) => {
                    const correct = o.id === review.correctId;
                    const chosen = o.id === review.selectedId;
                    return (
                      <li
                        key={o.id}
                        className={cn(
                          'flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm',
                          correct && 'border-success/40 bg-success/10',
                          chosen && !correct && 'border-destructive/40 bg-destructive/10',
                        )}
                      >
                        {o.text}
                        {(chosen || correct) && (
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {t(chosen ? 'quiz.result.yourAnswer' : 'quiz.result.correctAnswer')}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
                <p className="text-sm text-muted-foreground">{review.explanation}</p>
              </li>
            );
          })}
        </ol>
      </SectionCard>
    </div>
  );
}
