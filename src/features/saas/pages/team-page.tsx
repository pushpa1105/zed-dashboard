import { MailPlus, ShieldCheck, ShieldOff, UserMinus, X } from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { ErrorState } from '@/shared/components/display/error-state';
import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { Tag } from '@/shared/components/display/tag';
import { TagInput } from '@/shared/components/forms/tag-input';
import { formatRelative } from '@/shared/lib/format';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '@/shared/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import {
  teamQuery,
  useInvite,
  useRemoveMember,
  useRevokeInvite,
  useSetRole,
  useTeam,
} from '../api/platform-api';
import { ROLES, type Member, type Role } from '../model/platform';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(teamQuery());
    return null;
  };

const ASSIGNABLE = ROLES.filter((r) => r !== 'owner');
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function InviteDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { t } = useTranslation('saas');
  const invite = useInvite();
  const [emails, setEmails] = useState<string[]>([]);
  const [role, setRole] = useState<Role>('developer');

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setEmails([]);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('team.invite.title')}</DialogTitle>
          <DialogDescription>{t('team.invite.description')}</DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="invite-emails">{t('team.invite.emails')}</FieldLabel>
            <TagInput
              id="invite-emails"
              value={emails}
              onChange={setEmails}
              lowercase
              max={10}
              placeholder="name@company.com"
              validate={(tag) => (EMAIL.test(tag) ? undefined : t('team.invite.invalid'))}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="invite-role">{t('team.invite.role')}</FieldLabel>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger id="invite-role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNABLE.map((r) => (
                  <SelectItem key={r} value={r}>
                    {t(`team.roles.${r}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            disabled={!emails.length || invite.isPending}
            onClick={() =>
              invite.mutate(
                { emails, role },
                { onSuccess: () => (onOpenChange(false), setEmails([])) },
              )
            }
          >
            {t('team.invite.submit', { count: emails.length })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Members with roles and MFA status, pending invitations, and what each role can do. */
export default function TeamPage() {
  const { t } = useTranslation('saas');
  const team = useTeam();
  const setRole = useSetRole();
  const remove = useRemoveMember();
  const revoke = useRevokeInvite();
  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState<Member | null>(null);
  const members = team.data?.members ?? [];
  const invites = team.data?.invites ?? [];
  const withoutMfa = members.filter((m) => !m.mfa).length;

  return (
    <Page
      width="full"
      title={t('team.title')}
      description={t('team.description', { count: members.length })}
      actions={
        <Button onClick={() => setInviting(true)}>
          <MailPlus /> {t('team.inviteButton')}
        </Button>
      }
    >
      {team.isError ? (
        <ErrorState title={t('common.error')} onRetry={() => void team.refetch()} />
      ) : (
        <div className="grid items-start gap-6 xl:grid-cols-[1fr_22rem]">
          <SectionCard
            title={t('team.members')}
            description={
              withoutMfa ? t('team.mfaWarning', { count: withoutMfa }) : t('team.mfaAll')
            }
            flush
          >
            <div className="overflow-x-auto border-t">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">{t('team.col.member')}</TableHead>
                    <TableHead className="w-44">{t('team.col.role')}</TableHead>
                    <TableHead className="hidden md:table-cell">{t('team.col.mfa')}</TableHead>
                    <TableHead className="hidden lg:table-cell">{t('team.col.active')}</TableHead>
                    <TableHead className="w-14 pr-6">
                      <span className="sr-only">{t('team.remove')}</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {team.isPending
                    ? Array.from({ length: 5 }, (_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={5} className="px-6">
                            <Skeleton className="h-9" />
                          </TableCell>
                        </TableRow>
                      ))
                    : members.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell className="pl-6">
                            <div className="flex items-center gap-3">
                              <InitialsAvatar name={m.name} size="sm" />
                              <div className="min-w-0 leading-tight">
                                <p className="truncate font-medium">{m.name}</p>
                                <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {m.role === 'owner' ? (
                              <Tag tone="primary">{t('team.roles.owner')}</Tag>
                            ) : (
                              <Select
                                value={m.role}
                                onValueChange={(role) =>
                                  setRole.mutate({ id: m.id, role: role as Role })
                                }
                              >
                                <SelectTrigger
                                  size="sm"
                                  className="w-36"
                                  aria-label={t('team.col.role')}
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {ASSIGNABLE.map((r) => (
                                    <SelectItem key={r} value={r}>
                                      {t(`team.roles.${r}`)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {m.mfa ? (
                              <span className="inline-flex items-center gap-1.5 text-sm text-success">
                                <ShieldCheck className="size-4" /> {t('team.mfaOn')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                                <ShieldOff className="size-4" /> {t('team.mfaOff')}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="hidden text-muted-foreground lg:table-cell">
                            {formatRelative(m.lastActiveAt)}
                          </TableCell>
                          <TableCell className="pr-6">
                            {m.role !== 'owner' && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={t('team.removeName', { name: m.name })}
                                onClick={() => setRemoving(m)}
                              >
                                <UserMinus />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </div>
          </SectionCard>

          <div className="space-y-6">
            <SectionCard
              title={t('team.pending')}
              description={t('team.pendingHint', { count: invites.length })}
            >
              {invites.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('team.noInvites')}</p>
              ) : (
                <ul className="-my-2 divide-y">
                  {invites.map((invite) => (
                    <li key={invite.id} className="flex items-center gap-3 py-3">
                      <InitialsAvatar name={invite.email} size="sm" />
                      <div className="min-w-0 flex-1 leading-tight">
                        <p className="truncate text-sm font-medium">{invite.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {t(`team.roles.${invite.role}`)} · {formatRelative(invite.sentAt)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t('team.revokeInvite', { email: invite.email })}
                        onClick={() => revoke.mutate(invite.id)}
                      >
                        <X />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>

            <SectionCard title={t('team.rolesTitle')}>
              <dl className="space-y-4 text-sm">
                {ROLES.map((r) => (
                  <div key={r}>
                    <dt className="font-medium">{t(`team.roles.${r}`)}</dt>
                    <dd className="text-muted-foreground">{t(`team.roleHints.${r}`)}</dd>
                  </div>
                ))}
              </dl>
            </SectionCard>
          </div>
        </div>
      )}

      <InviteDialog open={inviting} onOpenChange={setInviting} />

      <AlertDialog open={!!removing} onOpenChange={(open) => !open && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('team.confirm.title', { name: removing?.name ?? '' })}
            </AlertDialogTitle>
            <AlertDialogDescription>{t('team.confirm.description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() =>
                removing && remove.mutate(removing.id, { onSuccess: () => setRemoving(null) })
              }
            >
              {t('team.confirm.submit')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Page>
  );
}
