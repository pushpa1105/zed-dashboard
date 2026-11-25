import { StatCard, type StatCardProps } from '@/shared/components/dashboard/stat-card';

/** A responsive row of KPI tiles that share one loading state. */
export function StatCards({
  items,
  loading,
}: {
  items: Array<StatCardProps & { key: string }>;
  loading: boolean;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map(({ key, ...item }) => (
        <StatCard key={key} variant="tile" loading={loading} {...item} />
      ))}
    </div>
  );
}
