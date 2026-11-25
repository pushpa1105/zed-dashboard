import { Camera, FileSignature, Link2, Siren, Thermometer, Zap } from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { notify } from '@/core/notify/notify';
import { useParams } from '@/core/router/router';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { DescriptionList } from '@/shared/components/display/description-list';
import { EmptyState } from '@/shared/components/display/empty-state';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';
import { Label } from '@/shared/ui/label';
import { Skeleton } from '@/shared/ui/skeleton';
import { Textarea } from '@/shared/ui/textarea';

import {
  overviewQuery,
  shipmentQuery,
  useOverview,
  useReportException,
  useShipment,
} from '../api/logistics-api';
import { BackLink } from '../components/back-link';
import { ShipmentStatusBadge } from '../components/badges';
import { NetworkMap } from '../components/network-map';
import { LoadError } from '../components/query-state';
import { TrackingTimeline } from '../components/tracking-timeline';
import { fmtCurrency, fmtDateTime, fmtDuration, fmtKg } from '../lib/format';
import { logisticsRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ params }) => {
    await Promise.all([
      queryClient.prefetchQuery(shipmentQuery(params.shipmentId!)),
      queryClient.prefetchQuery(overviewQuery()),
    ]);
    return null;
  };

function ReportExceptionDialog({ shipmentId }: { shipmentId: string }) {
  const { t } = useTranslation('logistics');
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const report = useReportException({
    onSuccess: () => {
      setOpen(false);
      setNote('');
    },
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Siren /> {t('shipment.report')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('shipment.reportTitle', { id: shipmentId })}</DialogTitle>
          <DialogDescription>{t('shipment.reportDescription')}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="exception-note">{t('shipment.reportNote')}</Label>
          <Textarea
            id="exception-note"
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('shipment.reportPlaceholder')}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t('actions.cancel')}
          </Button>
          <Button
            variant="destructive"
            disabled={report.isPending || note.trim().length < 5}
            onClick={() => report.mutate({ id: shipmentId, note })}
          >
            {t('shipment.reportSubmit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ShipmentPage() {
  const { t, i18n } = useTranslation('logistics');
  const { shipmentId = '' } = useParams();
  const query = useShipment(shipmentId);
  const overview = useOverview();
  const s = query.data;

  const back = <BackLink to={logisticsRoutes.shipments.href()} label={t('shipment.back')} />;

  if (query.isError) {
    return (
      <Page title={shipmentId} width="full">
        {back}
        <LoadError onRetry={() => void query.refetch()} />
      </Page>
    );
  }

  const hubs = overview.data?.hubs ?? [];
  const from = hubs.find((h) => h.name === s?.origin);
  const to = hubs.find((h) => h.name === s?.destination);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/track/${shipmentId}`);
      notify.success(t('shipment.linkCopied'));
    } catch {
      notify.error(t('shipment.copyFailed'));
    }
  };

  return (
    <Page
      title={shipmentId}
      description={s ? `${s.customer} · ${s.reference}` : undefined}
      width="full"
      actions={
        <>
          <Button variant="outline" onClick={() => void copyLink()}>
            <Link2 /> {t('shipment.copyLink')}
          </Button>
          <ReportExceptionDialog shipmentId={shipmentId} />
        </>
      }
    >
      {back}

      {/* Route band: where it is and where it's going. */}
      <section className="rounded-xl border bg-card p-6 shadow-xs">
        {s ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <ShipmentStatusBadge status={s.status} />
                {s.priority && (
                  <span className="inline-flex h-6 items-center gap-1 rounded-full bg-warning/15 px-2 text-xs font-medium">
                    <Zap className="size-3.5 fill-warning text-warning" /> {t('shipments.priority')}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {t(`mode.${s.mode}`)} · {s.carrier}
                </span>
              </div>
              <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">{t('shipment.from')}</p>
                  <p className="text-lg font-semibold">{s.origin}</p>
                </div>
                <div className="relative h-2 rounded-full bg-muted">
                  <div
                    className={
                      s.status === 'exception'
                        ? 'absolute inset-y-0 left-0 rounded-full bg-destructive'
                        : 'absolute inset-y-0 left-0 rounded-full bg-primary'
                    }
                    style={{ width: `${Math.round(s.progress * 100)}%` }}
                  />
                  <span
                    className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-card bg-primary shadow"
                    style={{ left: `${Math.round(s.progress * 100)}%` }}
                  />
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{t('shipment.to')}</p>
                  <p className="text-lg font-semibold">{s.destination}</p>
                </div>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-3 border-t pt-4 text-sm lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
              <div>
                <dt className="text-xs text-muted-foreground">{t('shipment.eta')}</dt>
                <dd className="font-medium tabular-nums">{fmtDateTime(s.eta)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{t('shipment.delay')}</dt>
                <dd
                  className={
                    s.delayMinutes > 0 ? 'font-medium text-destructive' : 'font-medium text-success'
                  }
                >
                  {s.delayMinutes > 0 ? fmtDuration(s.delayMinutes) : t('shipment.onTime')}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{t('shipment.shipped')}</dt>
                <dd className="tabular-nums">{fmtDateTime(s.shippedAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{t('shipment.trailer')}</dt>
                <dd className="font-mono text-xs leading-5">{s.trailer}</dd>
              </div>
            </dl>
          </div>
        ) : (
          <Skeleton className="h-24 w-full" />
        )}
      </section>

      <div className="grid gap-4 md:gap-6 xl:grid-cols-3">
        <SectionCard
          title={t('shipment.tracking')}
          description={t('shipment.trackingDescription')}
          className="xl:col-span-2"
        >
          {s ? (
            <TrackingTimeline
              checkpoints={s.checkpoints}
              exception={s.status === 'exception'}
              plannedLabel={t('shipment.planned')}
            />
          ) : (
            <div className="space-y-6">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          )}
        </SectionCard>

        <div className="flex flex-col gap-4 md:gap-6">
          <SectionCard title={t('shipment.map')} flush>
            <div className="mx-6 mb-6 aspect-[16/10] overflow-hidden rounded-lg border bg-muted/30">
              {s && from && to ? (
                <NetworkMap
                  hubs={hubs}
                  lanes={[]}
                  focus={{ from: from.id, to: to.id, progress: s.progress }}
                  ariaLabel={`${s.origin} → ${s.destination}`}
                />
              ) : (
                <Skeleton className="size-full rounded-none" />
              )}
            </div>
          </SectionCard>

          <SectionCard title={t('shipment.package')}>
            {s ? (
              <DescriptionList
                items={[
                  { key: 'contents', term: t('shipment.contents'), detail: s.contents },
                  { key: 'dimensions', term: t('shipment.dimensions'), detail: s.dimensions },
                  {
                    key: 'weight',
                    term: t('shipment.weight'),
                    detail: fmtKg(s.weightKg, i18n.language),
                  },
                  {
                    key: 'value',
                    term: t('shipment.value'),
                    detail: fmtCurrency(s.declaredValue, i18n.language),
                  },
                  ...(s.temperature
                    ? [
                        {
                          key: 'temperature',
                          term: t('shipment.temperature'),
                          detail: (
                            <span className="inline-flex items-center gap-1">
                              <Thermometer className="size-3.5 text-info" /> {s.temperature}
                            </span>
                          ),
                        },
                      ]
                    : []),
                ]}
              />
            ) : (
              <Skeleton className="h-40 w-full" />
            )}
          </SectionCard>

          <SectionCard title={t('shipment.pod')}>
            {s?.proofOfDelivery ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
                    <FileSignature className="size-5" />
                  </span>
                  <div className="text-sm">
                    <p className="font-medium">{s.proofOfDelivery.signedBy}</p>
                    <p className="text-xs text-muted-foreground">
                      {fmtDateTime(s.proofOfDelivery.at)}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{s.proofOfDelivery.note}</p>
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: s.proofOfDelivery.photos }, (_, i) => (
                    <div
                      key={i}
                      className="flex aspect-square items-center justify-center rounded-md border bg-muted/50 text-muted-foreground"
                      aria-label={t('shipment.photo', { n: i + 1 })}
                    >
                      <Camera className="size-5" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState
                variant="inline"
                icon={FileSignature}
                title={t('shipment.podPending')}
                description={t('shipment.podPendingHint')}
              />
            )}
          </SectionCard>
        </div>
      </div>
    </Page>
  );
}
