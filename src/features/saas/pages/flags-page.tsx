import { Flag as FlagIcon } from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { StatStrip } from '@/shared/components/dashboard/stat-strip';
import { EmptyState } from '@/shared/components/display/empty-state';
import { ErrorState } from '@/shared/components/display/error-state';
import { SearchInput } from '@/shared/components/forms/search-input';
import { Skeleton } from '@/shared/ui/skeleton';

import { flagsQuery, useFlags } from '../api/admin-api';
import { FlagRow } from '../components/flag-row';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(flagsQuery());
    return null;
  };

/** Feature flags: environment toggles, percentage rollouts and targeting rules. */
export default function FlagsPage() {
  const { t } = useTranslation('saas');
  const flags = useFlags();
  const [q, setQ] = useState('');
  const all = flags.data ?? [];
  const needle = q.trim().toLowerCase();
  const rows = all.filter((f) => `${f.key} ${f.description}`.toLowerCase().includes(needle));
  const live = all.filter((f) => f.environments.production);

  return (
    <Page width="full" title={t('flags.title')} description={t('flags.description')}>
      {flags.isError ? (
        <ErrorState title={t('common.error')} onRetry={() => void flags.refetch()} />
      ) : (
        <>
          <section className="rounded-xl border bg-card px-6 py-3 shadow-xs">
            {flags.isPending ? (
              <Skeleton className="my-2 h-14" />
            ) : (
              <StatStrip
                items={[
                  { key: 'total', label: t('flags.stats.total'), value: all.length },
                  { key: 'live', label: t('flags.stats.live'), value: live.length },
                  {
                    key: 'partial',
                    label: t('flags.stats.partial'),
                    value: live.filter((f) => f.rollout < 100).length,
                  },
                ]}
              />
            )}
          </section>

          <SearchInput
            value={q}
            onChange={setQ}
            placeholder={t('flags.search')}
            aria-label={t('flags.search')}
            containerClassName="sm:w-80"
          />

          <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
            {flags.isPending ? (
              <div className="space-y-3 p-5">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <EmptyState
                variant="plain"
                icon={FlagIcon}
                title={t('flags.empty')}
                className="py-12"
              />
            ) : (
              <ul className="divide-y" aria-label={t('flags.title')}>
                {rows.map((flag) => (
                  <FlagRow key={flag.id} flag={flag} />
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </Page>
  );
}
