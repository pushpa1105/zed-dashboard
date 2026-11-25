import { useTranslation } from '@/core/i18n/use-translation';
import { Sparkline } from '@/shared/components/charts/sparkline';
import { cn } from '@/shared/lib/cn';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { fmtPct } from '../lib/format';
import { carrierScore, type Carrier } from '../model/carriers';
import { ON_TIME_TARGET } from '../model/performance';

import { CarrierStatusBadge, GradeBadge, ModeLabel } from './badges';
import { CarrierStatusAction } from './carrier-status-action';
import { TargetBar } from './target-bar';

export function CarrierTable({
  carriers,
  onOpen,
}: {
  carriers: Carrier[];
  onOpen: (id: string) => void;
}) {
  const { t, i18n } = useTranslation('logistics');
  const pct = (value: number) => fmtPct(value, i18n.language);
  return (
    <div className="overflow-x-auto">
      <Table aria-label={t('carriers.table')}>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-6">{t('carriers.columns.carrier')}</TableHead>
            <TableHead>{t('carriers.columns.mode')}</TableHead>
            <TableHead className="w-44">{t('carriers.columns.onTime')}</TableHead>
            <TableHead>{t('carriers.columns.trend')}</TableHead>
            <TableHead className="text-right">{t('carriers.columns.damage')}</TableHead>
            <TableHead className="text-right">{t('carriers.columns.costIndex')}</TableHead>
            <TableHead>{t('carriers.columns.scorecard')}</TableHead>
            <TableHead>{t('carriers.columns.status')}</TableHead>
            <TableHead className="pr-6 text-right">
              <span className="sr-only">{t('carriers.columns.actions')}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {carriers.map((c) => (
            <TableRow key={c.id} className={cn(c.status === 'suspended' && 'opacity-70')}>
              <TableCell className="pl-6">
                <button
                  type="button"
                  onClick={() => onOpen(c.id)}
                  className="block text-left font-medium hover:underline"
                >
                  {c.name}
                </button>
                <p className="text-xs text-muted-foreground">
                  {t('carriers.shipmentsIn', { count: c.shipments, country: c.country })}
                </p>
              </TableCell>
              <TableCell>
                <ModeLabel mode={c.mode} />
              </TableCell>
              <TableCell>
                <TargetBar value={c.onTimePct} target={ON_TIME_TARGET} label={pct(c.onTimePct)} />
              </TableCell>
              <TableCell>
                <Sparkline
                  data={c.onTimeTrend}
                  variant="line"
                  className="h-8 w-24"
                  label={t('carriers.trendLabel', { name: c.name })}
                />
              </TableCell>
              <TableCell
                className={cn(
                  'text-right tabular-nums',
                  c.damageRatePct > 1 && 'font-medium text-destructive',
                )}
              >
                {pct(c.damageRatePct)}
              </TableCell>
              <TableCell className="text-right tabular-nums">{c.costIndex}</TableCell>
              <TableCell>
                <GradeBadge {...carrierScore(c.scorecard)} />
              </TableCell>
              <TableCell>
                <CarrierStatusBadge status={c.status} />
              </TableCell>
              <TableCell className="pr-6 text-right">
                <CarrierStatusAction carrier={c} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
