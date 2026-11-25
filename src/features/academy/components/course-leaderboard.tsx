import { Star } from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Link } from '@/core/router/router';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { cn } from '@/shared/lib/cn';
import { Progress } from '@/shared/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { compact, money, rate } from '../lib/format';
import type { CourseReport } from '../model/teaching';
import { academyRoutes } from '../routes';

import { FilterTabs } from './filter-tabs';

const RANKINGS = {
  enrolments: (c: CourseReport) => c.enrolments,
  completion: (c: CourseReport) => rate(c.completions, c.enrolments),
  revenue: (c: CourseReport) => c.revenue,
} as const;
type Ranking = keyof typeof RANKINGS;

/** Courses ranked by enrolments, completion rate or revenue for the selected period. */
export function CourseLeaderboard({ courses }: { courses: CourseReport[] }) {
  const { t } = useTranslation('academy');
  const [ranking, setRanking] = useState<Ranking>('enrolments');
  const score = RANKINGS[ranking];
  const rows = [...courses].sort((a, b) => score(b) - score(a));

  return (
    <SectionCard
      flush
      title={t('reports.leaderboard.title')}
      description={t('reports.leaderboard.description')}
      action={
        <FilterTabs
          label={t('reports.leaderboard.rankBy')}
          value={ranking}
          onChange={setRanking}
          tabs={(Object.keys(RANKINGS) as Ranking[]).map((value) => ({
            value,
            label: t(`reports.leaderboard.rankings.${value}`),
          }))}
        />
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 pl-6">#</TableHead>
            <TableHead>{t('reports.leaderboard.course')}</TableHead>
            <TableHead className="text-right">{t('reports.metrics.enrolments')}</TableHead>
            <TableHead className="hidden w-44 md:table-cell">
              {t('reports.metrics.completionRate')}
            </TableHead>
            <TableHead className="hidden text-right sm:table-cell">
              {t('reports.metrics.revenue')}
            </TableHead>
            <TableHead className="hidden pr-6 text-right lg:table-cell">
              {t('reports.leaderboard.rating')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((c, i) => (
            <TableRow key={c.id}>
              <TableCell
                className={cn('pl-6 font-semibold tabular-nums', i === 0 && 'text-primary')}
              >
                {i + 1}
              </TableCell>
              <TableCell className="max-w-72">
                <Link
                  to={academyRoutes.course.href({ courseId: c.id })}
                  className="flex items-center gap-2 font-medium hover:underline"
                >
                  <span className="size-2 shrink-0 rounded-full" style={{ background: c.color }} />
                  <span className="truncate">{c.title}</span>
                </Link>
              </TableCell>
              <TableCell className="text-right tabular-nums">{compact(c.enrolments)}</TableCell>
              <TableCell className="hidden md:table-cell">
                <span className="flex items-center gap-2">
                  <Progress value={RANKINGS.completion(c)} className="h-1.5 flex-1" />
                  <span className="w-9 text-right text-xs text-muted-foreground tabular-nums">
                    {RANKINGS.completion(c)}%
                  </span>
                </span>
              </TableCell>
              <TableCell className="hidden text-right tabular-nums sm:table-cell">
                {money(c.revenue)}
              </TableCell>
              <TableCell className="hidden pr-6 text-right tabular-nums lg:table-cell">
                <span className="inline-flex items-center gap-1">
                  <Star className="size-3.5 fill-warning text-warning" />
                  {c.rating.toFixed(1)}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  );
}
