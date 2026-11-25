import { Blocks } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { StatStrip } from '@/shared/components/dashboard/stat-strip';
import { EmptyState } from '@/shared/components/display/empty-state';
import { ErrorState } from '@/shared/components/display/error-state';
import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { StatusBadge } from '@/shared/components/display/status-badge';
import { SearchInput } from '@/shared/components/forms/search-input';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

import { integrationsQuery, useIntegrations } from '../api/integrations-api';
import { ChipFilter } from '../components/chip-filter';
import { FilterSelect } from '../components/filter-select';
import { IntegrationSheet } from '../components/integration-sheet';
import { compact } from '../lib/format';
import { INTEGRATION_CATEGORIES, type Integration } from '../model/integrations';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(integrationsQuery());
    return null;
  };

const ALL = 'all' as const;
const STATES = [ALL, 'connected', 'available'] as const;

function IntegrationTile({
  integration,
  onOpen,
}: {
  integration: Integration;
  onOpen: () => void;
}) {
  const { t, i18n } = useTranslation('saas');
  const connected = !!integration.config;
  return (
    <article className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-xs">
      <header className="flex items-start gap-3">
        <InitialsAvatar name={integration.name} shape="square" size="md" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-medium">{integration.name}</h2>
          <p className="text-xs text-muted-foreground">
            {t(`integrations.category.${integration.category}`)}
          </p>
        </div>
        {connected && (
          <StatusBadge status="connected" tone="success" label={t('integrations.connected')} />
        )}
      </header>
      <p className="flex-1 text-sm text-muted-foreground">{integration.description}</p>
      <footer className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {t('integrations.installs', { value: compact(integration.installs, i18n.language) })}
        </span>
        <Button
          size="sm"
          variant={connected ? 'outline' : 'default'}
          aria-label={t(connected ? 'integrations.manageName' : 'integrations.connectName', {
            name: integration.name,
          })}
          onClick={onOpen}
        >
          {t(connected ? 'integrations.manage' : 'integrations.connect')}
        </Button>
      </footer>
    </article>
  );
}

/** Marketplace of third-party integrations with connect, configure and disconnect. */
export default function IntegrationsPage() {
  const { t, i18n } = useTranslation('saas');
  const integrations = useIntegrations();
  const [q, setQ] = useState('');
  const [category, setCategory] = useState<string>(ALL);
  const [state, setState] = useState<string>(ALL);
  const [openId, setOpenId] = useState<string | null>(null);
  const all = integrations.data ?? [];
  const connected = all.filter((i) => i.config);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (integrations.data ?? []).filter(
      (i) =>
        (category === ALL || i.category === category) &&
        (state === ALL || (state === 'connected') === !!i.config) &&
        (!needle || `${i.name} ${i.description}`.toLowerCase().includes(needle)),
    );
  }, [integrations.data, q, category, state]);

  return (
    <Page width="full" title={t('integrations.title')} description={t('integrations.description')}>
      {integrations.isError ? (
        <ErrorState title={t('common.error')} onRetry={() => void integrations.refetch()} />
      ) : (
        <>
          <section className="rounded-xl border bg-card px-6 py-3 shadow-xs">
            {integrations.isPending ? (
              <Skeleton className="my-2 h-14" />
            ) : (
              <StatStrip
                items={[
                  {
                    key: 'connected',
                    label: t('integrations.stats.connected'),
                    value: connected.length,
                  },
                  {
                    key: 'available',
                    label: t('integrations.stats.available'),
                    value: all.length - connected.length,
                  },
                  {
                    key: 'synced',
                    label: t('integrations.stats.synced'),
                    value: compact(
                      connected.reduce((sum, i) => sum + i.synced, 0),
                      i18n.language,
                    ),
                    hint: t('integrations.stats.syncedHint'),
                  },
                ]}
              />
            )}
          </section>

          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <SearchInput
              value={q}
              onChange={setQ}
              placeholder={t('integrations.search')}
              aria-label={t('integrations.search')}
              containerClassName="lg:w-72"
            />
            <ChipFilter
              label={t('integrations.categories')}
              value={category}
              onChange={setCategory}
              options={[ALL, ...INTEGRATION_CATEGORIES].map((c) => ({
                value: c,
                label: t(`integrations.category.${c}`),
              }))}
            />
            <FilterSelect
              label={t('integrations.state')}
              value={state}
              onChange={setState}
              options={STATES.map((s) => ({ value: s, label: t(`integrations.states.${s}`) }))}
            />
          </div>

          {integrations.isPending ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))}
            </div>
          ) : rows.length ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {rows.map((i) => (
                <IntegrationTile key={i.id} integration={i} onOpen={() => setOpenId(i.id)} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Blocks}
              title={t('integrations.empty')}
              description={t('integrations.emptyHint')}
            />
          )}
        </>
      )}

      <IntegrationSheet
        integration={all.find((i) => i.id === openId) ?? null}
        onClose={() => setOpenId(null)}
      />
    </Page>
  );
}
