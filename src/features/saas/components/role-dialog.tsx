import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { FormField } from '@/core/forms/form-field';
import { useTranslation } from '@/core/i18n/use-translation';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

import { useCreateRole } from '../api/roles-api';
import { BLANK_ROLE, roleFormSchema, type Role, type RoleForm } from '../model/roles';

/** Creates a role, optionally copying the permissions of another one. */
export function RoleDialog({
  initial,
  roles,
  onClose,
  onCreated,
}: {
  initial: RoleForm | null;
  roles: Role[];
  onClose: () => void;
  onCreated: (role: Role) => void;
}) {
  const { t } = useTranslation('saas');
  const create = useCreateRole();
  const form = useForm<RoleForm>({
    resolver: zodResolver(roleFormSchema),
    values: initial ?? undefined,
  });

  return (
    <Dialog open={!!initial} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('roles.form.title')}</DialogTitle>
          <DialogDescription>{t('roles.form.description')}</DialogDescription>
        </DialogHeader>
        <form
          id="role-form"
          noValidate
          onSubmit={form.handleSubmit((values) => create.mutate(values, { onSuccess: onCreated }))}
        >
          <FieldGroup>
            <FormField
              control={form.control}
              name="name"
              label={t('roles.form.name')}
              required
              render={({ field, id, invalid }) => (
                <Input id={id} aria-invalid={invalid} {...field} />
              )}
            />
            <FormField
              control={form.control}
              name="description"
              label={t('roles.form.summary')}
              render={({ field, id, invalid }) => (
                <Input id={id} aria-invalid={invalid} {...field} />
              )}
            />
            <FormField
              control={form.control}
              name="from"
              label={t('roles.form.from')}
              render={({ field, id }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id={id} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={BLANK_ROLE}>{t('roles.form.blank')}</SelectItem>
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="role-form" disabled={create.isPending}>
            {t('roles.form.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
