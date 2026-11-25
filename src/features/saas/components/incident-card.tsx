import { useTranslation } from '@/core/i18n/use-translation';
import { StatusBadge } from '@/shared/components/display/status-badge';
import { Tag } from '@/shared/components/display/tag';
import { Timeline } from '@/shared/components/display/timeline';
import type { Tone } from '@/shared/components/display/tone';
import { formatDate, formatRelative } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';

import { useResolveIncident } from '../api/admin-api';
import type { Incident } from '../model/admin';

const IMPACT_TONE: Record<Incident['impact'], Tone> = {
  minor: 'warning',
  major: 'orange',
  critical: 'danger',
};
const STEP_TONE: Record<Incident['status'], Tone> = {
  investigating: 'danger',
  identified: 'orange',
  monitoring: 'info',
  resolved: 'success',
};

/** Incident summary with its chronological updates (newest first). */
export function IncidentCard({
  incident,
  names,
}: {
  incident: Incident;
  names: Map<string, string>;
}) {
  const { t } = useTranslation('saas');
  const resolve = useResolveIncident();
  const open = incident.status !== 'resolved';

  return (
    <article className="space-y-4 rounded-xl border bg-card p-5 shadow-xs">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <h3 className="font-semibold">{incident.title}</h3>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Tag size="sm" tone={IMPACT_TONE[incident.impact]}>
              {t(`status.impact.${incident.impact}`)}
            </Tag>
            {incident.componentIds.map((id) => (
              <Tag key={id} size="sm">
                {names.get(id) ?? id}
              </Tag>
            ))}
            <span>
              {formatDate(incident.startedAt, 'MMM D, HH:mm')} ·{' '}
              {incident.resolvedAt
                ? t('status.duration', {
                    count: Math.round((incident.resolvedAt - incident.startedAt) / 60_000),
                  })
                : formatRelative(incident.startedAt)}
            </span>
          </div>
        </div>
        {open && (
          <Button
            size="sm"
            variant="outline"
            disabled={resolve.isPending}
            onClick={() => resolve.mutate(incident.id)}
          >
            {t('status.resolve')}
          </Button>
        )}
      </header>
      <Timeline
        items={incident.updates.map((u) => ({
          key: u.id,
          tone: STEP_TONE[u.status],
          title: (
            <StatusBadge
              status={u.status}
              tone={STEP_TONE[u.status]}
              label={t(`status.step.${u.status}`)}
              variant="dot"
            />
          ),
          time: formatDate(u.at, 'MMM D, HH:mm'),
          description: u.message,
        }))}
      />
    </article>
  );
}
