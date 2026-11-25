import type { ReactNode } from 'react';

import { Skeleton } from '@/shared/ui/skeleton';

/** The four-up KPI row at the top of a dashboard page. */
export function StatGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-4">{children}</div>;
}

/** KPI row plus a chart-sized block, while a page's first query loads. */
export function DashboardSkeleton() {
  return (
    <>
      <StatGrid>
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </StatGrid>
      <Skeleton className="h-80 rounded-xl" />
      <Skeleton className="h-96 rounded-xl" />
    </>
  );
}
