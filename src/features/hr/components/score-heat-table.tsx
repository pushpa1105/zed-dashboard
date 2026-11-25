import { useTranslation } from '@/core/i18n/use-translation';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { cn } from '@/shared/lib/cn';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { average } from '../lib/format';
import { SURVEY_QUESTIONS, type DepartmentScores } from '../model/engagement';

const STEPS = [
  'bg-primary/10',
  'bg-primary/25',
  'bg-primary/45',
  'bg-primary/65 text-primary-foreground',
  'bg-primary/90 text-primary-foreground',
];
/** Scores cluster between 3 and 5, so the steps start at 3 to keep the contrast useful. */
const THRESHOLDS = [3.2, 3.6, 4, 4.4];
const stepOf = (score: number) => STEPS[THRESHOLDS.filter((limit) => score >= limit).length];

function ScoreCell({ score, className }: { score: number; className?: string }) {
  return (
    <TableCell className={cn('p-1', className)}>
      <span
        className={cn(
          'flex h-9 min-w-12 items-center justify-center rounded-md text-sm font-medium tabular-nums',
          stepOf(score),
        )}
      >
        {score.toFixed(1)}
      </span>
    </TableCell>
  );
}

export function ScoreHeatTable({ scores }: { scores: DepartmentScores[] }) {
  const { t } = useTranslation('hr');
  return (
    <SectionCard
      flush
      title={t('engagement.heatTitle')}
      description={t('engagement.heatHint')}
      action={
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground" aria-hidden>
          {t('engagement.low')}
          {STEPS.map((step) => (
            <span key={step} className={cn('size-3.5 rounded-sm', step)} />
          ))}
          {t('engagement.high')}
        </div>
      }
    >
      <Table className="min-w-[52rem] border-t">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-6">{t('engagement.question')}</TableHead>
            {scores.map(({ department }) => (
              <TableHead key={department} className="text-center">
                {department}
              </TableHead>
            ))}
            <TableHead className="pr-6 text-center">{t('engagement.company')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {SURVEY_QUESTIONS.map((question) => (
            <TableRow key={question} className="hover:bg-transparent">
              <TableCell className="max-w-64 pl-6 text-sm whitespace-normal">
                {t(`engagement.questions.${question}`)}
              </TableCell>
              {scores.map(({ department, values }) => (
                <ScoreCell key={department} score={values[question]} />
              ))}
              <ScoreCell score={average(scores.map((s) => s.values[question]))} className="pr-6" />
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  );
}
