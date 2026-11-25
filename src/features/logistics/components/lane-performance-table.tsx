import { useTranslation } from '@/core/i18n/use-translation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { fmtCurrency, fmtNumber, fmtPct, fmtRate } from '../lib/format';
import { ON_TIME_TARGET, type LanePerformance } from '../model/performance';

import { ModeLabel } from './badges';
import { TargetBar } from './target-bar';

export function LanePerformanceTable({ lanes }: { lanes: LanePerformance[] }) {
  const { t, i18n } = useTranslation('logistics');
  const lang = i18n.language;
  return (
    <div className="overflow-x-auto">
      <Table aria-label={t('performance.lanes.title')}>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-6">{t('performance.lanes.lane')}</TableHead>
            <TableHead>{t('performance.lanes.mode')}</TableHead>
            <TableHead className="text-right">{t('performance.lanes.shipments')}</TableHead>
            <TableHead className="w-44">{t('performance.lanes.onTime')}</TableHead>
            <TableHead className="text-right">{t('performance.lanes.transit')}</TableHead>
            <TableHead className="text-right">{t('performance.lanes.cost')}</TableHead>
            <TableHead className="pr-6 text-right">{t('performance.lanes.utilisation')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lanes.map((lane) => (
            <TableRow key={lane.id}>
              <TableCell className="pl-6">
                <p className="font-medium whitespace-nowrap">
                  {lane.origin} → {lane.destination}
                </p>
                <p className="text-xs text-muted-foreground">
                  {fmtNumber(lane.distanceKm, lang)} km
                </p>
              </TableCell>
              <TableCell>
                <ModeLabel mode={lane.mode} />
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {fmtNumber(lane.shipments, lang)}
              </TableCell>
              <TableCell>
                <TargetBar
                  value={lane.onTimePct}
                  target={ON_TIME_TARGET}
                  label={fmtPct(lane.onTimePct, lang)}
                />
              </TableCell>
              <TableCell className="text-right tabular-nums">{lane.transitHours} h</TableCell>
              <TableCell className="text-right tabular-nums">
                <p>{fmtCurrency(lane.costPerShipment, lang)}</p>
                <p className="text-xs text-muted-foreground">
                  {t('performance.lanes.perKm', {
                    rate: fmtRate(lane.costPerShipment / lane.distanceKm, lang),
                  })}
                </p>
              </TableCell>
              <TableCell className="pr-6 text-right tabular-nums">
                {fmtPct(lane.utilisationPct, lang)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
