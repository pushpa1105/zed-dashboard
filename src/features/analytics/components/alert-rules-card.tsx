import { BellPlus, Plus, Trash2 } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { EmptyState } from '@/shared/components/display/empty-state';
import { Button } from '@/shared/ui/button';
import { Switch } from '@/shared/ui/switch';

import { useRemoveRule, useToggleRule } from '../api/insights-api';
import type { AlertRule } from '../model/insights';

import { SeverityTag } from './alert-parts';

function RuleRow({ rule }: { rule: AlertRule }) {
  const { t } = useTranslation('analytics');
  const toggle = useToggleRule();
  const remove = useRemoveRule();

  return (
    <li className="flex items-start gap-3 px-4 py-4 sm:px-6">
      <div className="min-w-0 flex-1 space-y-1">
        <p className="flex flex-wrap items-center gap-2 font-medium">
          {rule.name}
          <SeverityTag severity={rule.severity} />
        </p>
        <p className="text-sm text-muted-foreground">
          {t('alerts.rules.summary', {
            metric: t(`alerts.metrics.${rule.metric}`),
            condition: t(`alerts.conditions.${rule.condition}`),
            threshold: rule.threshold,
            window: t(`alerts.windows.${rule.window}`),
          })}
        </p>
        <p className="text-xs text-muted-foreground">
          {t(`alerts.notify.${rule.notify}`)} ·{' '}
          {t('alerts.rules.triggered', { count: rule.triggered })}
        </p>
      </div>
      <Switch
        checked={rule.enabled}
        disabled={toggle.isPending}
        onCheckedChange={(enabled) => toggle.mutate({ id: rule.id, enabled })}
        aria-label={t('alerts.rules.toggle', { name: rule.name })}
      />
      <ConfirmDialog
        trigger={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t('alerts.rules.delete', { name: rule.name })}
          >
            <Trash2 />
          </Button>
        }
        title={t('alerts.rules.deleteTitle', { name: rule.name })}
        description={t('alerts.rules.deleteDescription')}
        confirmLabel={t('alerts.rules.deleteConfirm')}
        cancelLabel={t('alerts.form.cancel')}
        destructive
        pending={remove.isPending}
        onConfirm={() => remove.mutateAsync(rule.id)}
      />
    </li>
  );
}

/** Alert rules with an on/off switch each; new rules open the create dialog. */
export function AlertRulesCard({ rules, onCreate }: { rules: AlertRule[]; onCreate: () => void }) {
  const { t } = useTranslation('analytics');
  return (
    <SectionCard flush title={t('alerts.rules.title')} description={t('alerts.rules.description')}>
      {rules.length === 0 ? (
        <EmptyState
          variant="plain"
          icon={BellPlus}
          title={t('alerts.rules.empty.title')}
          description={t('alerts.rules.empty.description')}
          actions={
            <Button size="sm" onClick={onCreate}>
              <Plus /> {t('alerts.create')}
            </Button>
          }
        />
      ) : (
        <ul className="divide-y">
          {rules.map((rule) => (
            <RuleRow key={rule.id} rule={rule} />
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
