import type { ReactNode } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { RadarChart } from '@/shared/components/charts/radar-chart';
import { StatStrip } from '@/shared/components/dashboard/stat-strip';
import { KeyValueGrid } from '@/shared/components/display/key-value-grid';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/sheet';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { useCarrier } from '../api/partners-api';
import { fmtDate, fmtNumber, fmtPct, fmtRate } from '../lib/format';
import { carrierScore, type CarrierDetail, type Scorecard } from '../model/carriers';

import { CarrierStatusBadge, ExpiryBadge, GradeBadge, ModeLabel } from './badges';
import { CarrierStatusAction } from './carrier-status-action';
import { LoadError } from './query-state';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="font-medium">{title}</h3>
      {children}
    </section>
  );
}

function CarrierDetails({ carrier }: { carrier: CarrierDetail }) {
  const { t, i18n } = useTranslation('logistics');
  const pct = (value: number) => fmtPct(value, i18n.language);
  const { score, grade } = carrierScore(carrier.scorecard);
  return (
    <>
      <StatStrip
        className="rounded-lg border"
        items={[
          { key: 'onTime', label: t('carriers.columns.onTime'), value: pct(carrier.onTimePct) },
          { key: 'damage', label: t('carriers.columns.damage'), value: pct(carrier.damageRatePct) },
          { key: 'cost', label: t('carriers.columns.costIndex'), value: carrier.costIndex },
          {
            key: 'shipments',
            label: t('carriers.kpi.shipments'),
            value: fmtNumber(carrier.shipments, i18n.language),
          },
        ]}
      />
      <Section title={t('carriers.sheet.scorecard')}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {t('carriers.sheet.overall')} <GradeBadge grade={grade} score={score} />
        </div>
        <RadarChart
          data={Object.entries(carrier.scorecard).map(([area, value]) => ({
            area: t(`carriers.score.${area as keyof Scorecard}`),
            value,
          }))}
          axisKey="area"
          series={[{ key: 'value', label: t('carriers.sheet.score') }]}
          className="mx-auto h-64"
        />
      </Section>
      <Section title={t('carriers.sheet.contract')}>
        <KeyValueGrid
          columns={2}
          items={[
            {
              key: 'contact',
              label: t('carriers.sheet.contact'),
              value: carrier.contact,
              hint: (
                <a href={`mailto:${carrier.email}`} className="text-primary hover:underline">
                  {carrier.email}
                </a>
              ),
            },
            {
              key: 'terms',
              label: t('carriers.sheet.paymentTerms'),
              value: t('carriers.sheet.days', { count: carrier.paymentTermsDays }),
            },
            {
              key: 'start',
              label: t('carriers.sheet.start'),
              value: fmtDate(carrier.contractStart),
            },
            {
              key: 'end',
              label: t('carriers.sheet.end'),
              value: fmtDate(carrier.contractEnd),
              hint: <ExpiryBadge expiresAt={carrier.contractEnd} />,
            },
          ]}
        />
      </Section>
      <Section title={t('carriers.sheet.lanes')}>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('carriers.sheet.lane')}</TableHead>
                <TableHead className="text-right">{t('carriers.sheet.rate')}</TableHead>
                <TableHead className="text-right">{t('carriers.columns.onTime')}</TableHead>
                <TableHead className="text-right">{t('carriers.sheet.shipments')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {carrier.lanes.map((lane) => (
                <TableRow key={lane.id}>
                  <TableCell>
                    <p className="whitespace-nowrap">
                      {lane.origin} → {lane.destination}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {fmtNumber(lane.distanceKm, i18n.language)} km
                    </p>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {fmtRate(lane.ratePerKm, i18n.language)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{pct(lane.onTimePct)}</TableCell>
                  <TableCell className="text-right tabular-nums">{lane.shipments}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Section>
    </>
  );
}

/** Side panel with a carrier's scorecard, contract and lanes. */
export function CarrierSheet({
  carrierId,
  onClose,
}: {
  carrierId: string | null;
  onClose: () => void;
}) {
  const { t } = useTranslation('logistics');
  const query = useCarrier(carrierId);
  const carrier = query.data;

  return (
    <Sheet open={carrierId !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{carrier?.name ?? t('carriers.sheet.loading')}</SheetTitle>
          {carrier && (
            <SheetDescription asChild>
              <div className="flex flex-wrap items-center gap-3">
                <ModeLabel mode={carrier.mode} />
                <span>{carrier.country}</span>
                <CarrierStatusBadge status={carrier.status} />
              </div>
            </SheetDescription>
          )}
        </SheetHeader>
        <div className="space-y-6 px-4 pb-6">
          {query.isError ? (
            <LoadError onRetry={() => void query.refetch()} />
          ) : !carrier ? (
            <>
              <Skeleton className="h-20 rounded-lg" />
              <Skeleton className="h-64 rounded-lg" />
              <Skeleton className="h-48 rounded-lg" />
            </>
          ) : (
            <>
              <CarrierDetails carrier={carrier} />
              <div className="flex justify-end">
                <CarrierStatusAction carrier={carrier} />
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
