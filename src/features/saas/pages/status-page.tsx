import { Siren } from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { Callout } from '@/shared/components/display/callout';
import { EmptyState } from '@/shared/components/display/empty-state';
import { ErrorState } from '@/shared/components/display/error-state';
import { StatusBadge } from '@/shared/components/display/status-badge';
import type { Tone } from '@/shared/components/display/tone';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

import { statusQuery, useStatus } from '../api/admin-api';
import { DeclareIncidentDialog } from '../components/declare-incident-dialog';
import { IncidentCard } from '../components/incident-card';
import { UptimeBars } from '../components/uptime-bars';
import { uptimeOf } from '../lib/uptime';
import type { ComponentStatus, Incident } from '../model/admin';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(statusQuery());
    return null;
  };

const STATUS_TONE: Record<ComponentStatus, Tone> = {
  operational: 'success',
  degraded: 'warning',
  partial_outage: 'orange',
  major_outage: 'danger',
};

function IncidentList({
  title,
  incidents,
  names,
}: {
  title: string;
  incidents: Incident[];
  names: Map<string, string>;
}) {
  if (!incidents.length) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      {incidents.map((incident) => (
        <IncidentCard key={incident.id} incident={incident} names={names} />
      ))}
    </section>
  );
}

/** Component health, 90-day uptime, incident history and incident declaration. */
export default function StatusPage() {
  const { t } = useTranslation('saas');
  const status = useStatus();
  const [declaring, setDeclaring] = useState(false);
  const components = status.data?.components ?? [];
  const incidents = status.data?.incidents ?? [];
  const names = new Map(components.map((c) => [c.id, c.name]));
  const active = incidents.filter((i) => i.status !== 'resolved');
  const affected = components.filter((c) => c.status !== 'operational').length;

  return (
    <Page
      width="full"
      title={t('status.title')}
      description={t('status.description')}
      actions={
        <Button variant="destructive" disabled={!status.data} onClick={() => setDeclaring(true)}>
          <Siren /> {t('status.declareButton')}
        </Button>
      }
    >
      {status.isError ? (
        <ErrorState title={t('common.error')} onRetry={() => void status.refetch()} />
      ) : !status.data ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {affected ? (
            <Callout kind="warning" title={t('status.degradedTitle', { count: affected })}>
              {t('status.degradedHint')}
            </Callout>
          ) : (
            <Callout kind="success" title={t('status.allGood')} />
          )}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {components.map((c) => (
              <SectionCard
                key={c.id}
                title={c.name}
                description={t('status.uptime', { value: uptimeOf(c.days).toFixed(2) })}
                action={
                  <StatusBadge
                    status={c.status}
                    tone={STATUS_TONE[c.status]}
                    label={t(`status.component.${c.status}`)}
                  />
                }
              >
                <UptimeBars days={c.days} />
              </SectionCard>
            ))}
          </div>

          {incidents.length === 0 ? (
            <EmptyState icon={Siren} title={t('status.noIncidents')} />
          ) : (
            <>
              <IncidentList title={t('status.active')} incidents={active} names={names} />
              <IncidentList
                title={t('status.past')}
                incidents={incidents.filter((i) => i.status === 'resolved')}
                names={names}
              />
            </>
          )}
        </>
      )}

      <DeclareIncidentDialog open={declaring} onOpenChange={setDeclaring} components={components} />
    </Page>
  );
}
