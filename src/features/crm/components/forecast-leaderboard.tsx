import { Trophy } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { UserCell } from '@/shared/components/display/user-cell';
import { cn } from '@/shared/lib/cn';

import { money } from '../lib/format';
import type { Forecast } from '../model/crm';

/** Reps ranked by closed-won, with quota attainment and what is still in play. */
export function ForecastLeaderboard({ reps }: { reps: Forecast['reps'] }) {
  const { t } = useTranslation('crm');
  return (
    <div className="overflow-x-auto border-t">
      <table className="w-full min-w-[44rem] text-sm" aria-label={t('forecast.leaderboard')}>
        <thead className="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th className="w-14 px-6 py-3 text-left font-medium">#</th>
            <th className="px-3 py-3 text-left font-medium">{t('forecast.rep')}</th>
            <th className="w-64 px-3 py-3 text-left font-medium">{t('forecast.attainment')}</th>
            <th className="px-3 py-3 text-right font-medium">{t('forecast.categories.closed')}</th>
            <th className="px-3 py-3 text-right font-medium">{t('forecast.categories.commit')}</th>
            <th className="px-6 py-3 text-right font-medium">
              {t('forecast.categories.bestCase')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {reps.map((rep, index) => {
            const attainment = Math.round((rep.closed / rep.quota) * 100);
            return (
              <tr key={rep.owner}>
                <td className="px-6 py-3 font-semibold text-muted-foreground tabular-nums">
                  {index === 0 ? (
                    <Trophy className="size-4 text-warning" aria-label={t('forecast.top')} />
                  ) : (
                    index + 1
                  )}
                </td>
                <td className="px-3 py-3">
                  <UserCell
                    name={rep.owner}
                    secondary={t('overview.leaderboard.deals', { count: rep.wonDeals })}
                  />
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
                      role="meter"
                      aria-label={t('forecast.attainment')}
                      aria-valuenow={attainment}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className={cn(
                          'h-full rounded-full',
                          attainment >= 100 ? 'bg-success' : 'bg-primary',
                        )}
                        style={{ width: `${Math.min(100, attainment)}%` }}
                      />
                    </div>
                    <span className="w-11 text-right font-medium tabular-nums">{attainment}%</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('forecast.quotaOf', { quota: money(rep.quota, true) })}
                  </p>
                </td>
                <td className="px-3 py-3 text-right font-medium tabular-nums">
                  {money(rep.closed, true)}
                </td>
                <td className="px-3 py-3 text-right tabular-nums">{money(rep.commit, true)}</td>
                <td className="px-6 py-3 text-right tabular-nums">{money(rep.bestCase, true)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
