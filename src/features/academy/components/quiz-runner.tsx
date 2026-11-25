import { ArrowLeft, ArrowRight, Send, Timer } from 'lucide-react';
import { useEffect, useEffectEvent, useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { RadioCards } from '@/shared/components/forms/choice-cards';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Progress } from '@/shared/ui/progress';
import { Spinner } from '@/shared/ui/spinner';

import { clock } from '../lib/format';
import type { Quiz } from '../model/academy';

type Answers = Record<string, string>;

/** Counts down from `seconds` and calls `onExpire` once at zero. */
function useCountdown(seconds: number, onExpire: () => void) {
  const [left, setLeft] = useState(seconds);
  const expire = useEffectEvent(onExpire);
  useEffect(() => {
    const end = Date.now() + seconds * 1000;
    const id = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setLeft(remaining);
      if (!remaining) {
        window.clearInterval(id);
        expire();
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [seconds]);
  return left;
}

/** One question at a time, with a timer, a question navigator and free back/forward. */
export function QuizRunner({
  quiz,
  submitting,
  onSubmit,
}: {
  quiz: Quiz;
  submitting: boolean;
  onSubmit: (answers: Answers) => void;
}) {
  const { t } = useTranslation('academy');
  const [answers, setAnswers] = useState<Answers>({});
  const [current, setCurrent] = useState(0);
  const left = useCountdown(quiz.timeLimitSec, () => onSubmit(answers));
  const { questions } = quiz;
  const question = questions[current]!;
  const answered = Object.keys(answers).length;
  const last = current === questions.length - 1;

  return (
    <div className="space-y-6">
      <div className="space-y-3 rounded-xl border bg-card p-4 shadow-xs">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-medium">
            {t('quiz.answered', { done: answered, total: questions.length })}
          </span>
          <span
            role="timer"
            aria-label={t('quiz.timeLeft')}
            className={cn(
              'flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 font-medium tabular-nums',
              left <= 60 && 'bg-destructive/10 text-destructive',
            )}
          >
            <Timer className="size-4" /> {clock(left)}
          </span>
        </div>
        <Progress value={(answered / questions.length) * 100} className="h-1.5" />
        <nav
          aria-label={t('quiz.navigator')}
          className="scrollbar-none flex gap-1.5 overflow-x-auto"
        >
          {questions.map((q, i) => (
            <button
              key={q.id}
              type="button"
              onClick={() => setCurrent(i)}
              aria-current={i === current ? 'step' : undefined}
              aria-label={t('quiz.goTo', { number: i + 1 })}
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-md border text-xs font-medium tabular-nums transition-colors hover:bg-muted',
                answers[q.id] && 'border-primary/40 bg-primary/10 text-primary',
                i === current && 'ring-2 ring-ring/50',
              )}
            >
              {i + 1}
            </button>
          ))}
        </nav>
      </div>

      <section className="space-y-5 rounded-xl border bg-card p-6 shadow-xs">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            {t('quiz.question', { current: current + 1, total: questions.length })}
          </p>
          <h2 className="text-lg leading-snug font-semibold text-balance">{question.prompt}</h2>
        </div>
        <RadioCards
          key={question.id}
          columns={1}
          aria-label={question.prompt}
          value={answers[question.id] ?? null}
          onChange={(value) => setAnswers((a) => ({ ...a, [question.id]: value }))}
          options={question.options.map((o, i) => ({
            value: o.id,
            title: o.text,
            icon: String.fromCharCode(65 + i),
          }))}
        />
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" disabled={current === 0} onClick={() => setCurrent((c) => c - 1)}>
          <ArrowLeft /> {t('quiz.previous')}
        </Button>
        {last ? (
          <div className="flex flex-wrap items-center justify-end gap-3">
            {answered < questions.length && (
              <span className="text-sm text-warning">
                {t('quiz.unanswered', { count: questions.length - answered })}
              </span>
            )}
            <Button disabled={submitting} onClick={() => onSubmit(answers)}>
              {submitting ? <Spinner /> : <Send />} {t('quiz.submit')}
            </Button>
          </div>
        ) : (
          <Button onClick={() => setCurrent((c) => c + 1)}>
            {t('quiz.next')} <ArrowRight />
          </Button>
        )}
      </div>
    </div>
  );
}
