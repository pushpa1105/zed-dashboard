import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, Plus, ShieldAlert, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import type { PageModule } from '@/core/feature/define-feature';
import { FormField } from '@/core/forms/form-field';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { Callout } from '@/shared/components/display/callout';
import { CopyButton } from '@/shared/components/display/copy-button';
import { EmptyState } from '@/shared/components/display/empty-state';
import { ErrorState } from '@/shared/components/display/error-state';
import { Tag } from '@/shared/components/display/tag';
import { CheckboxGroup } from '@/shared/components/forms/checkbox-group';
import { SegmentedControl } from '@/shared/components/forms/segmented-control';
import { cn } from '@/shared/lib/cn';
import { formatDate, formatRelative } from '@/shared/lib/format';
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
import { FieldGroup } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { keysQuery, useApiKeys, useCreateKey, useRevokeKey } from '../api/platform-api';
import { KEY_SCOPES, keyFormSchema, type ApiKey, type KeyForm } from '../model/platform';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(keysQuery());
    return null;
  };

function CreateKeyDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { t } = useTranslation('saas');
  const create = useCreateKey();
  const [secret, setSecret] = useState<string | null>(null);
  const form = useForm<KeyForm>({
    resolver: zodResolver(keyFormSchema),
    defaultValues: { name: '', env: 'test', scopes: ['read'] },
  });

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      setSecret(null);
      form.reset();
      create.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-lg">
        {secret ? (
          <>
            <DialogHeader>
              <DialogTitle>{t('keys.created.title')}</DialogTitle>
              <DialogDescription>{t('keys.created.description')}</DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
              <code className="min-w-0 flex-1 truncate font-mono text-sm">{secret}</code>
              <CopyButton value={secret} label={t('keys.copy')} showLabel />
            </div>
            <Callout kind="warning" title={t('keys.created.warningTitle')}>
              {t('keys.created.warning')}
            </Callout>
            <DialogFooter>
              <Button onClick={() => close(false)}>{t('keys.created.done')}</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t('keys.create.title')}</DialogTitle>
              <DialogDescription>{t('keys.create.description')}</DialogDescription>
            </DialogHeader>
            <form
              id="key-form"
              noValidate
              onSubmit={form.handleSubmit((values) =>
                create.mutate(values, { onSuccess: (key) => setSecret(key.secret) }),
              )}
            >
              <FieldGroup>
                <FormField
                  control={form.control}
                  name="name"
                  label={t('keys.create.name')}
                  required
                  render={({ field, id, invalid }) => (
                    <Input
                      id={id}
                      aria-invalid={invalid}
                      placeholder={t('keys.create.namePlaceholder')}
                      {...field}
                    />
                  )}
                />
                <FormField
                  control={form.control}
                  name="env"
                  label={t('keys.create.env')}
                  render={({ field }) => (
                    <SegmentedControl
                      value={field.value}
                      onChange={field.onChange}
                      options={[
                        { value: 'test', label: t('keys.env.test') },
                        { value: 'live', label: t('keys.env.live') },
                      ]}
                    />
                  )}
                />
                <FormField
                  control={form.control}
                  name="scopes"
                  label={t('keys.create.scopes')}
                  render={({ field }) => (
                    <CheckboxGroup
                      value={field.value}
                      onChange={field.onChange}
                      options={KEY_SCOPES.map((scope) => ({
                        value: scope,
                        label: t(`keys.scopes.${scope}`),
                        description: t(`keys.scopeHints.${scope}`),
                      }))}
                    />
                  )}
                />
              </FieldGroup>
            </form>
            <DialogFooter>
              <Button variant="outline" onClick={() => close(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" form="key-form" disabled={create.isPending}>
                {t('keys.create.submit')}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** API keys: masked list, scopes, last use, create (secret shown once) and revoke. */
export default function KeysPage() {
  const { t } = useTranslation('saas');
  const keys = useApiKeys();
  const revoke = useRevokeKey();
  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState<ApiKey | null>(null);
  const active = keys.data?.filter((k) => k.status === 'active') ?? [];
  const revoked = keys.data?.filter((k) => k.status === 'revoked') ?? [];

  return (
    <Page
      width="full"
      title={t('keys.title')}
      description={t('keys.description')}
      actions={
        <Button onClick={() => setCreating(true)}>
          <Plus /> {t('keys.new')}
        </Button>
      }
    >
      <Callout kind="info" title={t('keys.tipTitle')}>
        {t('keys.tip')}
      </Callout>

      {keys.isError ? (
        <ErrorState title={t('common.error')} onRetry={() => void keys.refetch()} />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">{t('keys.col.name')}</TableHead>
                <TableHead>{t('keys.col.key')}</TableHead>
                <TableHead className="hidden lg:table-cell">{t('keys.col.scopes')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('keys.col.lastUsed')}</TableHead>
                <TableHead className="hidden xl:table-cell">{t('keys.col.created')}</TableHead>
                <TableHead className="w-14 pr-6">
                  <span className="sr-only">{t('keys.col.actions')}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.isPending
                ? Array.from({ length: 4 }, (_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6} className="px-6">
                        <Skeleton className="h-9" />
                      </TableCell>
                    </TableRow>
                  ))
                : [...active, ...revoked].map((key) => {
                    const isRevoked = key.status === 'revoked';
                    return (
                      <TableRow key={key.id} className={cn(isRevoked && 'opacity-55')}>
                        <TableCell className="pl-6">
                          <div className="flex items-center gap-3">
                            <span className="flex size-8 items-center justify-center rounded-md border bg-muted/40">
                              <KeyRound className="size-4 text-muted-foreground" />
                            </span>
                            <div className="min-w-0 leading-tight">
                              <p className="truncate font-medium">{key.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {t('keys.by', { name: key.createdBy })}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                              {key.prefix}••••••••
                            </code>
                            <Tag size="sm" tone={key.env === 'live' ? 'success' : 'orange'}>
                              {t(`keys.env.${key.env}`)}
                            </Tag>
                            {isRevoked && (
                              <Tag size="sm" tone="neutral" appearance="outline">
                                {t('keys.revoked')}
                              </Tag>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {key.scopes.map((scope) => (
                              <Tag
                                key={scope}
                                size="sm"
                                tone={scope === 'admin' ? 'danger' : 'neutral'}
                                appearance="outline"
                              >
                                {scope}
                              </Tag>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground md:table-cell">
                          {key.lastUsedAt ? formatRelative(key.lastUsedAt) : t('keys.never')}
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground xl:table-cell">
                          {formatDate(key.createdAt, 'MMM D, YYYY')}
                        </TableCell>
                        <TableCell className="pr-6">
                          {!isRevoked && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={t('keys.revoke', { name: key.name })}
                              onClick={() => setRevoking(key)}
                            >
                              <Trash2 />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
            </TableBody>
          </Table>
          {!keys.isPending && !keys.data?.length && (
            <EmptyState variant="plain" icon={KeyRound} title={t('keys.empty')} className="py-12" />
          )}
        </div>
      )}

      <CreateKeyDialog open={creating} onOpenChange={setCreating} />

      <AlertDialog open={!!revoking} onOpenChange={(open) => !open && setRevoking(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="size-5 text-destructive" />
              {t('keys.confirm.title', { name: revoking?.name ?? '' })}
            </AlertDialogTitle>
            <AlertDialogDescription>{t('keys.confirm.description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() =>
                revoking && revoke.mutate(revoking.id, { onSuccess: () => setRevoking(null) })
              }
            >
              {t('keys.confirm.submit')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Page>
  );
}
