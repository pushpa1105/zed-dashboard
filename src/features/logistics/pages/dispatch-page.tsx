import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { StatStrip } from '@/shared/components/dashboard/stat-strip';
import { Skeleton } from '@/shared/ui/skeleton';

import { dispatchQuery, useDispatch } from '../api/logistics-api';
import { DispatchBoard } from '../components/dispatch-board';
import { QueryBoundary } from '../components/query-state';
import { fmtKg } from '../lib/format';
import { totalWeight, type DispatchBoard as Board } from '../model/dispatch';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(dispatchQuery());
    return null;
  };

function Summary({ board }: { board: Board }) {
  const { t, i18n } = useTranslation('logistics');
  const unassigned = board.orders.filter((o) => !o.driverId);
  const overloaded = board.drivers.filter(
    (d) => totalWeight(board.orders.filter((o) => o.driverId === d.id)) > d.capacityKg,
  ).length;
  return (
    <section className="rounded-xl border bg-card px-6 py-2 shadow-xs">
      <StatStrip
        items={[
          {
            key: 'unassigned',
            label: t('dispatch.kpi.unassigned'),
            value: unassigned.length,
            hint: t('dispatch.kpi.priority', {
              count: unassigned.filter((o) => o.priority).length,
            }),
          },
          {
            key: 'assigned',
            label: t('dispatch.kpi.assigned'),
            value: `${board.orders.length - unassigned.length}/${board.orders.length}`,
            hint: t('dispatch.kpi.assignedHint'),
          },
          {
            key: 'weight',
            label: t('dispatch.kpi.weight'),
            value: fmtKg(totalWeight(unassigned), i18n.language),
            hint: t('dispatch.kpi.weightHint'),
          },
          {
            key: 'overloaded',
            label: t('dispatch.kpi.overloaded'),
            value: overloaded,
            hint: t('dispatch.kpi.overloadedHint', { count: board.drivers.length }),
          },
        ]}
      />
    </section>
  );
}

export default function DispatchPage() {
  const { t } = useTranslation('logistics');
  const query = useDispatch();
  return (
    <Page title={t('dispatch.title')} description={t('dispatch.description')} width="full">
      <QueryBoundary
        query={query}
        skeleton={
          <>
            <Skeleton className="h-24 w-full rounded-xl" />
            <div className="flex gap-3 overflow-hidden">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-[28rem] w-72 shrink-0 rounded-xl" />
              ))}
            </div>
          </>
        }
      >
        {(board) => (
          <>
            <Summary board={board} />
            <DispatchBoard board={board} />
          </>
        )}
      </QueryBoundary>
    </Page>
  );
}
