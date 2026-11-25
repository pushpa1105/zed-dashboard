import { Lock, Plus } from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { DonutChart } from '@/shared/components/charts/donut-chart';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { ErrorState } from '@/shared/components/display/error-state';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

import { rolesQuery, useRoles } from '../api/roles-api';
import { PermissionMatrix } from '../components/permission-matrix';
import { RoleDialog } from '../components/role-dialog';
import { BLANK_ROLE, type Role, type RoleForm } from '../model/roles';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(rolesQuery());
    return null;
  };

function RoleList({
  roles,
  selectedId,
  onSelect,
}: {
  roles: Role[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const { t } = useTranslation('saas');
  return (
    <ul className="space-y-1 px-3 pb-3">
      {roles.map((role) => (
        <li key={role.id}>
          <button
            type="button"
            aria-pressed={role.id === selectedId}
            onClick={() => onSelect(role.id)}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent',
              role.id === selectedId && 'bg-primary/10 text-primary hover:bg-primary/15',
            )}
          >
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 text-sm font-medium">
                {role.name}
                {role.system && (
                  <Lock className="size-3.5 text-muted-foreground" aria-label={t('roles.system')} />
                )}
              </span>
              <span className="block text-xs text-muted-foreground">
                {t('roles.members', { count: role.members })}
              </span>
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {role.permissions.length}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Roles with member counts, a permission matrix per role, and role creation. */
export default function RolesPage() {
  const { t } = useTranslation('saas');
  const roles = useRoles();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<RoleForm | null>(null);
  const all = roles.data ?? [];
  const role = all.find((r) => r.id === selectedId) ?? all[0];

  return (
    <Page
      width="full"
      title={t('roles.title')}
      description={t('roles.description')}
      actions={
        <Button
          disabled={!roles.data}
          onClick={() => setDraft({ name: '', description: '', from: BLANK_ROLE })}
        >
          <Plus /> {t('roles.new')}
        </Button>
      }
    >
      {roles.isError ? (
        <ErrorState title={t('common.error')} onRetry={() => void roles.refetch()} />
      ) : !role ? (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[320px_1fr]">
          <div className="space-y-4">
            <SectionCard flush title={t('roles.list')} description={t('roles.listHint')}>
              <RoleList roles={all} selectedId={role.id} onSelect={setSelectedId} />
            </SectionCard>
            <SectionCard title={t('roles.distribution')}>
              <DonutChart
                legend="bottom"
                centerLabel={t('roles.people')}
                data={all
                  .filter((r) => r.members)
                  .map((r) => ({ key: r.id, label: r.name, value: r.members }))}
              />
            </SectionCard>
          </div>
          <PermissionMatrix
            key={role.id}
            role={role}
            onDuplicate={() =>
              setDraft({
                name: t('roles.copyName', { name: role.name }),
                description: role.description,
                from: role.id,
              })
            }
          />
        </div>
      )}

      <RoleDialog
        initial={draft}
        roles={all}
        onClose={() => setDraft(null)}
        onCreated={(created) => {
          setDraft(null);
          setSelectedId(created.id);
        }}
      />
    </Page>
  );
}
