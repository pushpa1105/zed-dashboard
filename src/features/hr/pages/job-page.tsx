import { ArrowLeft, MapPin } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { Link, useParams } from '@/core/router/router';
import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { KanbanBoard, type KanbanColumn } from '@/shared/components/display/kanban-board';
import { RatingStars } from '@/shared/components/display/rating-stars';
import { Tag } from '@/shared/components/display/tag';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

import { jobBoardQuery, useJobBoard, useMoveCandidate } from '../api/hr-api';
import { WidgetError } from '../components/widget-error';
import { shortDate } from '../lib/format';
import { CANDIDATE_STAGES, STAGE_COLOR, type Candidate, type CandidateStage } from '../model/hr';
import { hrRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ params }) => {
    await queryClient.prefetchQuery(jobBoardQuery(params.jobId!));
    return null;
  };

type Card = Candidate & { [key: string]: unknown };

const build = (candidates: Candidate[]): Array<KanbanColumn<Card>> =>
  CANDIDATE_STAGES.map((stage) => ({
    id: stage,
    title: stage,
    color: STAGE_COLOR[stage],
    cards: candidates.filter((c) => c.stage === stage) as Card[],
  }));

function CandidateCard({ candidate }: { candidate: Card }) {
  const { t } = useTranslation('hr');
  return (
    <article className="space-y-3 rounded-lg border bg-card p-3 shadow-xs">
      <div className="flex items-center gap-2.5">
        <InitialsAvatar name={candidate.name} size="sm" />
        <div className="min-w-0">
          <Link
            to={hrRoutes.candidate.href({ candidateId: candidate.id })}
            className="block truncate text-sm font-medium hover:underline"
          >
            {candidate.name}
          </Link>
          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
            <MapPin className="size-3" aria-hidden /> {candidate.location}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <RatingStars value={candidate.rating} size="sm" />
        <Tag size="sm">{candidate.source}</Tag>
      </div>
      <p className="text-xs text-muted-foreground">
        {t('recruitment.appliedOn', { date: shortDate(candidate.appliedAt) })}
      </p>
    </article>
  );
}

export default function JobPage() {
  const { t } = useTranslation('hr');
  const { jobId = '' } = useParams();
  const board = useJobBoard(jobId);
  const move = useMoveCandidate(jobId);

  const [state, setState] = useState<{ source?: Candidate[]; columns: Array<KanbanColumn<Card>> }>({
    columns: [],
  });
  if (board.data && state.source !== board.data.candidates) {
    setState({ source: board.data.candidates, columns: build(board.data.candidates) });
  }

  // Save stage changes when the card is dropped.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  const commit = useCallback(() => {
    const { source, columns } = stateRef.current;
    if (!source) return;
    for (const column of columns) {
      for (const card of column.cards) {
        const before = source.find((c) => c.id === card.id);
        if (before && before.stage !== column.id) {
          move.mutate({ id: card.id, stage: column.id as CandidateStage });
        }
      }
    }
  }, [move]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') commit();
    };
    window.addEventListener('pointerup', commit);
    window.addEventListener('keyup', onKey);
    return () => {
      window.removeEventListener('pointerup', commit);
      window.removeEventListener('keyup', onKey);
    };
  }, [commit]);

  const job = board.data?.job;

  return (
    <Page
      width="full"
      title={job?.title ?? '…'}
      description={
        job
          ? t('recruitment.boardDescription', {
              department: job.department,
              location: job.location,
            })
          : undefined
      }
      actions={
        <Button variant="outline" asChild>
          <Link to={hrRoutes.recruitment.href()}>
            <ArrowLeft /> {t('recruitment.back')}
          </Link>
        </Button>
      }
    >
      {board.isError ? (
        <WidgetError onRetry={() => void board.refetch()} />
      ) : !board.data ? (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-96 w-72 shrink-0" />
          ))}
        </div>
      ) : (
        <div className="-mx-4 overflow-x-auto px-4 md:-mx-8 md:px-8">
          <KanbanBoard
            className="min-w-max pb-2"
            columns={state.columns.map((col) => ({
              ...col,
              title: t(`recruitment.stages.${col.id as CandidateStage}`),
            }))}
            onChange={(next) =>
              setState((s) => ({ ...s, columns: next.map((c) => ({ ...c, title: c.id })) }))
            }
            renderCard={(card) => <CandidateCard candidate={card} />}
          />
        </div>
      )}
    </Page>
  );
}
