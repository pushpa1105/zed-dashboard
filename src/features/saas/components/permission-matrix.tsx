import { Copy } from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { Callout } from '@/shared/components/display/callout';
import { formatRelative } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { useSavePermissions } from '../api/roles-api';
import { PERMISSION_ACTIONS, PERMISSION_RESOURCES, permissionKey, type Role } from '../model/roles';

const TOTAL = PERMISSION_RESOURCES.length * PERMISSION_ACTIONS.length;

/** Resources × actions grid for one role. Remount it (key) to discard the draft. */
export function PermissionMatrix({ role, onDuplicate }: { role: Role; onDuplicate: () => void }) {
  const { t } = useTranslation('saas');
  const save = useSavePermissions();
  const [draft, setDraft] = useState(() => new Set(role.permissions));
  const dirty =
    draft.size !== role.permissions.length || role.permissions.some((p) => !draft.has(p));

  const toggle = (keys: string[], on: boolean) =>
    setDraft((prev) => {
      const next = new Set(prev);
      for (const key of keys) {
        if (on) next.add(key);
        else next.delete(key);
      }
      return next;
    });

  return (
    <SectionCard
      flush
      title={role.name}
      description={role.description}
      action={
        <Button variant="outline" size="sm" onClick={onDuplicate}>
          <Copy /> {t('roles.duplicate')}
        </Button>
      }
      footer={
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-auto">
            {t('roles.granted', { count: draft.size, total: TOTAL })} ·{' '}
            {t('roles.updated', { time: formatRelative(role.updatedAt) })}
          </span>
          {!role.system && (
            <>
              <Button
                variant="ghost"
                size="sm"
                disabled={!dirty}
                onClick={() => setDraft(new Set(role.permissions))}
              >
                {t('roles.reset')}
              </Button>
              <Button
                size="sm"
                disabled={!dirty || save.isPending}
                onClick={() => save.mutate({ id: role.id, permissions: [...draft] })}
              >
                {t('roles.save')}
              </Button>
            </>
          )}
        </div>
      }
    >
      {role.system && (
        <Callout kind="info" title={t('roles.systemTitle')} className="mx-6 mb-4">
          {t('roles.systemHint')}
        </Callout>
      )}
      <div className="overflow-x-auto">
        <Table aria-label={t('roles.matrix', { name: role.name })}>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">{t('roles.resource')}</TableHead>
              {PERMISSION_ACTIONS.map((action) => (
                <TableHead key={action} className="text-center">
                  {t(`roles.actions.${action}`)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {PERMISSION_RESOURCES.map((resource) => {
              const cells = PERMISSION_ACTIONS.map((action) => ({
                action,
                key: permissionKey(resource, action),
              }));
              const keys = cells.map((c) => c.key);
              const count = keys.filter((k) => draft.has(k)).length;
              return (
                <TableRow key={resource}>
                  <TableCell className="pl-6">
                    <label className="flex items-center gap-3 font-medium">
                      <Checkbox
                        checked={count === keys.length || (count > 0 && 'indeterminate')}
                        disabled={role.system}
                        onCheckedChange={() => toggle(keys, count < keys.length)}
                      />
                      {t(`roles.resources.${resource}`)}
                    </label>
                  </TableCell>
                  {cells.map(({ action, key }) => (
                    <TableCell key={key} className="text-center">
                      <Checkbox
                        aria-label={t('roles.permission', {
                          action: t(`roles.actions.${action}`),
                          resource: t(`roles.resources.${resource}`),
                        })}
                        checked={draft.has(key)}
                        disabled={role.system}
                        onCheckedChange={(on) => toggle([key], on === true)}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </SectionCard>
  );
}
