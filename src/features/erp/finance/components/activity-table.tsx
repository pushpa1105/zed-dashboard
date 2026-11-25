import { useTranslation } from '@/core/i18n/use-translation';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { cn } from '@/shared/lib/cn';
import { formatDate, getInitials } from '@/shared/lib/format';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { money } from '../lib/format';
import type { FinanceTransaction } from '../model/overview';

import { GLASS } from './glass';

const STATUS_STYLE: Record<FinanceTransaction['status'], string> = {
  completed: 'bg-success/10 text-success',
  pending: 'bg-warning/15 text-foreground/80',
  urgent: 'bg-destructive/10 text-destructive',
  failed: 'bg-muted text-muted-foreground',
};

const DOT_STYLE: Record<FinanceTransaction['status'], string> = {
  completed: 'bg-success',
  pending: 'bg-warning',
  urgent: 'bg-destructive',
  failed: 'bg-muted-foreground',
};

export function ActivityTable({ rows }: { rows: FinanceTransaction[] }) {
  const { t } = useTranslation('erp', { keyPrefix: 'finance' });

  return (
    <SectionCard
      flush
      className={GLASS}
      title={t('table.title')}
      description={t('table.description')}
      action={
        <Button variant="ghost" size="sm">
          {t('table.viewAll')}
        </Button>
      }
    >
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-5">{t('table.name')}</TableHead>
            <TableHead>{t('table.subject')}</TableHead>
            <TableHead className="hidden md:table-cell">{t('table.invited')}</TableHead>
            <TableHead>{t('table.status')}</TableHead>
            <TableHead className="text-right">{t('table.amount')}</TableHead>
            <TableHead className="hidden pr-5 text-right lg:table-cell">
              {t('table.date')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const [first, last] = row.name.split(' ');
            return (
              <TableRow key={row.id}>
                <TableCell className="pl-5">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="size-7">
                      <AvatarFallback className="bg-primary/10 text-[0.65rem] font-medium text-primary">
                        {getInitials(first, last)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium whitespace-nowrap">{row.name}</span>
                  </div>
                </TableCell>
                <TableCell className="max-w-64">
                  <p className="truncate">{row.subject}</p>
                  <p className="text-xs text-muted-foreground">{row.category}</p>
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  {t('table.invitedCount', { count: row.invited })}
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
                      STATUS_STYLE[row.status],
                    )}
                  >
                    <span className={cn('size-1.5 rounded-full', DOT_STYLE[row.status])} />
                    {t(`status.${row.status}`)}
                  </span>
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {money(row.amount)}
                </TableCell>
                <TableCell className="hidden pr-5 text-right text-muted-foreground tabular-nums lg:table-cell">
                  {formatDate(row.date, 'MMM D, h:mm A')}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </SectionCard>
  );
}
