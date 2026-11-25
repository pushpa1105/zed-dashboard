import { useTranslation } from '@/core/i18n/use-translation';
import { cn } from '@/shared/lib/cn';

import { integer, percent, shortDate } from '../lib/format';
import type { Retention } from '../model/analytics';

type Cohort = Retention['cohorts'][number];

/**
 * Weekly cohorts × weeks since signup. Cell intensity is the share retained,
 * mixed from the brand color so it follows the theme. Clicking a row selects it.
 */
export function CohortTable({
  cohorts,
  average,
  mode,
  selected,
  onSelect,
}: {
  cohorts: Cohort[];
  average: number[];
  mode: 'percent' | 'users';
  selected: string;
  onSelect: (week: string) => void;
}) {
  const { t } = useTranslation('analytics');
  const weeks = average.map((_, w) => w);

  const cell = (pct: number, label: string, key: number) => (
    <td key={key} className="p-0.5">
      <div
        className={cn(
          'flex h-9 min-w-14 items-center justify-center rounded-md text-xs tabular-nums',
          pct >= 55 ? 'text-primary-foreground' : 'text-foreground',
        )}
        style={{
          background: `color-mix(in oklab, var(--primary) ${Math.round(pct)}%, var(--muted))`,
        }}
      >
        {label}
      </div>
    </td>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-0 text-sm">
        <caption className="sr-only">{t('retention.table.caption')}</caption>
        <thead>
          <tr className="text-xs text-muted-foreground">
            <th scope="col" className="px-2 pb-2 text-left font-medium">
              {t('retention.table.cohort')}
            </th>
            <th scope="col" className="px-2 pb-2 text-right font-medium">
              {t('retention.table.users')}
            </th>
            {weeks.map((w) => (
              <th key={w} scope="col" className="px-1 pb-2 font-medium">
                {t('retention.week', { n: w })}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cohorts.map((cohort) => (
            <tr key={cohort.week}>
              <th scope="row" className="px-2 text-left font-normal whitespace-nowrap">
                <button
                  type="button"
                  aria-pressed={cohort.week === selected}
                  className={cn(
                    'rounded-sm font-medium hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                    cohort.week === selected && 'text-primary',
                  )}
                  onClick={() => onSelect(cohort.week)}
                >
                  {shortDate(cohort.week)}
                </button>
              </th>
              <td className="px-2 text-right text-muted-foreground tabular-nums">
                {integer(cohort.size)}
              </td>
              {weeks.map((w) => {
                const kept = cohort.retained[w];
                if (kept === undefined) return <td key={w} />;
                const pct = (kept / cohort.size) * 100;
                return cell(pct, mode === 'percent' ? percent(pct, 0) : integer(kept), w);
              })}
            </tr>
          ))}
          <tr className="font-medium">
            <th scope="row" colSpan={2} className="px-2 pt-2 text-left">
              {t('retention.table.average')}
            </th>
            {average.map((pct, w) => cell(pct, percent(pct, 0), w))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
