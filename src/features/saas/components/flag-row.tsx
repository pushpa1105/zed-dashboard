import { useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Tag } from '@/shared/components/display/tag';
import { formatRelative } from '@/shared/lib/format';
import { Label } from '@/shared/ui/label';
import { Slider } from '@/shared/ui/slider';
import { Switch } from '@/shared/ui/switch';

import { useUpdateFlag } from '../api/admin-api';
import { FLAG_ENVS, type Flag } from '../model/admin';

/** One flag: per-environment switches, production rollout slider and targeting summary. */
export function FlagRow({ flag }: { flag: Flag }) {
  const { t } = useTranslation('saas');
  const update = useUpdateFlag();
  // Local while dragging; the API is only called when the thumb is released.
  const [rollout, setRollout] = useState(flag.rollout);
  const id = (suffix: string) => `${flag.id}-${suffix}`;

  return (
    <li className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)] lg:items-center">
      <div className="min-w-0 space-y-1">
        <p className="truncate font-mono text-sm font-medium">{flag.key}</p>
        <p className="text-sm text-muted-foreground">{flag.description}</p>
        <p className="text-xs text-muted-foreground">
          {t('flags.updated', { name: flag.owner, when: formatRelative(flag.updatedAt) })}
        </p>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {flag.rules.length === 0 ? (
            <Tag size="sm">{t('flags.everyone')}</Tag>
          ) : (
            flag.rules.map((rule) => (
              <Tag key={rule.attribute} size="sm" tone="info" className="font-mono">
                {rule.attribute} {t(`flags.operators.${rule.operator}`)} {rule.value}
              </Tag>
            ))
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-3 lg:flex-col">
        {FLAG_ENVS.map((env) => (
          <div key={env} className="flex items-center gap-2">
            <Switch
              id={id(env)}
              checked={flag.environments[env]}
              disabled={update.isPending}
              onCheckedChange={(on) => update.mutate({ id: flag.id, environments: { [env]: on } })}
            />
            <Label htmlFor={id(env)} className="font-normal">
              {t(`flags.envs.${env}`)}
            </Label>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{t('flags.rollout')}</span>
          <span className="font-medium tabular-nums">{rollout}%</span>
        </div>
        <Slider
          thumbLabel={t('flags.rolloutFor', { key: flag.key })}
          value={[rollout]}
          step={5}
          max={100}
          disabled={!flag.environments.production}
          onValueChange={([value]) => setRollout(value!)}
          onValueCommit={([value]) => update.mutate({ id: flag.id, rollout: value! })}
        />
        <p className="text-xs text-muted-foreground">
          {flag.environments.production ? t('flags.rolloutHint') : t('flags.rolloutOff')}
        </p>
      </div>
    </li>
  );
}
