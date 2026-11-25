import { Eye, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { notify } from '@/core/notify/notify';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { getInitials } from '@/shared/lib/format';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { Skeleton } from '@/shared/ui/skeleton';
import { Slider } from '@/shared/ui/slider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';

import {
  useDeleteOperation,
  useOperations,
  useRestoreOperation,
  useUpdateOperation,
} from '../api/projects-api';
import { shortDate } from '../lib/format';
import type { Operation } from '../model/projects';

import { WidgetError } from './widget-error';

/** Progress color by band: the % label carries the value, color only reinforces it. */
const progressColor = (value: number) =>
  value >= 70 ? 'var(--chart-4)' : value >= 40 ? 'var(--chart-1)' : 'var(--chart-3)';

function ProgressCell({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-1.5 w-28 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full"
          style={{ width: `${value}%`, background: progressColor(value) }}
        />
      </div>
      <span className="w-9 text-xs text-muted-foreground tabular-nums">{value}%</span>
    </div>
  );
}

function IconAction({
  label,
  className,
  ...props
}: React.ComponentProps<typeof Button> & { label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          className={className}
          {...props}
        />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function ViewAction({ op }: { op: Operation }) {
  const { t } = useTranslation('erp', { keyPrefix: 'projects' });
  const rows = [
    [t('operations.columns.id'), op.code],
    [t('operations.columns.owner'), op.owner],
    [t('operations.columns.due'), shortDate(op.dueDate)],
    [t('operations.columns.value'), String(op.value)],
  ];
  return (
    <Dialog>
      <DialogTrigger asChild>
        <IconAction label={t('operations.actions.view')}>
          <Eye />
        </IconAction>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{op.name}</DialogTitle>
          <DialogDescription>{t('operations.details')}</DialogDescription>
        </DialogHeader>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="font-medium">{value}</dd>
            </div>
          ))}
          <div className="col-span-2">
            <dt className="mb-1.5 text-xs text-muted-foreground">{t('operations.progress')}</dt>
            <dd>
              <ProgressCell value={op.progress} />
            </dd>
          </div>
        </dl>
      </DialogContent>
    </Dialog>
  );
}

function EditAction({ op }: { op: Operation }) {
  const { t } = useTranslation('erp', { keyPrefix: 'projects' });
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(op.progress);
  const update = useUpdateOperation({ onSuccess: () => setOpen(false) });

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setValue(op.progress);
      }}
    >
      <PopoverTrigger asChild>
        <IconAction label={t('operations.actions.edit')}>
          <Pencil />
        </IconAction>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{t('operations.progress')}</span>
          <span className="text-muted-foreground tabular-nums">{value}%</span>
        </div>
        <Slider
          value={[value]}
          min={0}
          max={100}
          step={5}
          onValueChange={([v]) => setValue(v ?? 0)}
          aria-label={t('operations.progress')}
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            {t('operations.cancel')}
          </Button>
          <Button
            size="sm"
            disabled={update.isPending || value === op.progress}
            onClick={() => update.mutate({ id: op.id, progress: value })}
          >
            {t('operations.save')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function DeleteAction({ op }: { op: Operation }) {
  const { t } = useTranslation('erp', { keyPrefix: 'projects' });
  const remove = useDeleteOperation();
  const restore = useRestoreOperation();

  return (
    <ConfirmDialog
      trigger={
        <IconAction label={t('operations.actions.delete')} className="hover:text-destructive">
          <Trash2 />
        </IconAction>
      }
      title={t('operations.confirmTitle')}
      description={t('operations.confirmDescription', { name: op.name })}
      confirmLabel={t('operations.actions.delete')}
      cancelLabel={t('operations.cancel')}
      destructive
      pending={remove.isPending}
      onConfirm={() =>
        remove.mutateAsync(op.id).then(() => {
          notify.undoable(t('operations.toast.deleted'), () => restore.mutate(op.id), {
            description: op.name,
            undoLabel: t('operations.toast.undo'),
          });
        })
      }
    />
  );
}

export function OperationsCard() {
  const { t } = useTranslation('erp', { keyPrefix: 'projects' });
  const operations = useOperations();

  return (
    <SectionCard
      title={t('operations.title')}
      description={t('operations.description')}
      className="lg:col-span-8"
      flush
    >
      {operations.isError ? (
        <WidgetError onRetry={() => void operations.refetch()} />
      ) : !operations.data ? (
        <div className="space-y-2 px-5 pb-5">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-11 w-full" />
          ))}
        </div>
      ) : operations.data.length === 0 ? (
        <p className="px-5 pb-8 text-center text-sm text-muted-foreground">
          {t('operations.empty')}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="pl-5">{t('operations.columns.id')}</TableHead>
              <TableHead>{t('operations.columns.name')}</TableHead>
              <TableHead className="hidden md:table-cell">
                {t('operations.columns.status')}
              </TableHead>
              <TableHead className="hidden sm:table-cell">
                {t('operations.columns.value')}
              </TableHead>
              <TableHead className="pr-5 text-right">
                <span className="sr-only">{t('operations.columns.actions')}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {operations.data.map((op) => (
              <TableRow key={op.id}>
                <TableCell className="pl-5 font-mono text-xs text-muted-foreground">
                  {op.code}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Avatar className="size-7">
                      <AvatarFallback className="text-[0.65rem]">
                        {getInitials(...op.owner.split(' '))}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="max-w-72 truncate font-medium">{op.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {op.owner} · {shortDate(op.dueDate)}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <ProgressCell value={op.progress} />
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <span className="inline-flex min-w-9 justify-center rounded-md border bg-background px-1.5 py-0.5 text-xs font-medium text-primary tabular-nums">
                    {op.value}
                  </span>
                </TableCell>
                <TableCell className="pr-5">
                  <div className="flex justify-end gap-0.5">
                    <ViewAction op={op} />
                    <EditAction op={op} />
                    <DeleteAction op={op} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </SectionCard>
  );
}
