import { useTranslation } from '@/core/i18n/use-translation';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { Switch } from '@/shared/ui/switch';

import { useToggleIntegration } from '../api/overview-api';
import type { Integration } from '../model/overview';

export function IntegrationsCard({ items }: { items: Integration[] }) {
  const { t } = useTranslation('saas', { keyPrefix: 'overview' });
  const toggle = useToggleIntegration();

  return (
    <SectionCard title={t('integrations.title')} description={t('integrations.description')}>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/50 text-sm font-semibold">
              {item.name.charAt(0)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{item.name}</p>
              <p className="truncate text-xs text-muted-foreground">{item.description}</p>
            </div>
            <Switch
              checked={item.enabled}
              aria-label={t('integrations.toggle', { name: item.name })}
              onCheckedChange={(enabled) => toggle.mutate({ id: item.id, enabled })}
            />
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
