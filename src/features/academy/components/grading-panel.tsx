import { Download, FileText } from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { Tag } from '@/shared/components/display/tag';
import { UserCell } from '@/shared/components/display/user-cell';
import { NumberInput } from '@/shared/components/forms/number-input';
import { TextareaWithCounter } from '@/shared/components/forms/textarea-with-counter';
import { formatRelative } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import { Spinner } from '@/shared/ui/spinner';

import { useGradeSubmission } from '../api/academy-api';
import type { Submission } from '../model/academy';

/** Score + feedback form for one submission. Mount with `key={submission.id}` to reset. */
export function GradingPanel({
  submission,
  points,
  onNext,
}: {
  submission: Submission;
  points: number;
  /** Moves to the next ungraded submission; absent when this is the last one. */
  onNext?: () => void;
}) {
  const { t } = useTranslation('academy');
  const grade = useGradeSubmission();
  const [score, setScore] = useState(submission.score);
  const [feedback, setFeedback] = useState(submission.feedback);
  const valid = score !== null && score >= 0 && score <= points;

  const save = (advance: boolean) =>
    valid &&
    grade.mutate(
      { submissionId: submission.id, score, feedback },
      { onSuccess: () => advance && onNext?.() },
    );

  return (
    <SectionCard title={t('grading.panel.title')} className="xl:sticky xl:top-24">
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          save(false);
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <UserCell
            name={submission.studentName}
            secondary={t('grading.submitted', { when: formatRelative(submission.submittedAt) })}
          />
          {submission.late && (
            <Tag tone="warning" size="sm">
              {t('grading.late')}
            </Tag>
          )}
        </div>
        <div className="flex items-center gap-3 rounded-lg border p-3">
          <FileText className="size-5 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{submission.attachment.name}</p>
            <p className="text-xs text-muted-foreground">{submission.attachment.size}</p>
          </div>
          <Button type="button" variant="ghost" size="icon-sm" aria-label={t('grading.download')}>
            <Download />
          </Button>
        </div>
        <div className="space-y-2">
          <Label htmlFor="grade-score">{t('grading.panel.score')}</Label>
          <NumberInput
            id="grade-score"
            value={score}
            onChange={setScore}
            min={0}
            max={points}
            suffix={`/ ${points}`}
            invalid={!valid && score !== null}
          />
          <p className="text-xs text-muted-foreground">{t('grading.panel.range', { points })}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="grade-feedback">{t('grading.panel.feedback')}</Label>
          <TextareaWithCounter
            id="grade-feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder={t('grading.panel.feedbackPlaceholder')}
            maxLength={1000}
            rows={4}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={!valid || grade.isPending}>
            {grade.isPending && <Spinner />} {t('grading.panel.save')}
          </Button>
          {onNext && (
            <Button
              type="button"
              variant="outline"
              disabled={!valid || grade.isPending}
              onClick={() => save(true)}
            >
              {t('grading.panel.saveNext')}
            </Button>
          )}
        </div>
      </form>
    </SectionCard>
  );
}
