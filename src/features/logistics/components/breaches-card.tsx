import { FileMinus, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Link } from '@/core/router/router';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { EmptyState } from '@/shared/components/display/empty-state';
import { SegmentedControl } from '@/shared/components/forms/segmented-control';
import { Button } from '@/shared/ui/button';
import { NativeSelect, NativeSelectOption } from '@/shared/ui/native-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { fmtCurrency, fmtDateTime, fmtDuration } from '../lib/format';
import { ROOT_CAUSES, type Breach, type RootCause } from '../model/slas';
import { logisticsRoutes } from '../routes';

import { CreditNoteDialog } from './credit-note-dialog';

type CreditFilter = 'open' | 'credited' | 'all';

function BreachTable({
  breaches,
  onCredit,
}: {
  breaches: Breach[];
  onCredit: (b: Breach) => void;
}) {
  const { t, i18n } = useTranslation('logistics');
  return (
    <div className="overflow-x-auto">
      <Table aria-label={t('slas.breaches.title')}>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-6">{t('slas.columns.customer')}</TableHead>
            <TableHead>{t('slas.breaches.shipment')}</TableHead>
            <TableHead>{t('slas.breaches.metric')}</TableHead>
            <TableHead className="text-right">{t('slas.breaches.delay')}</TableHead>
            <TableHead>{t('slas.breaches.rootCause')}</TableHead>
            <TableHead className="pr-6 text-right">{t('slas.breaches.credit')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {breaches.map((b) => (
            <TableRow key={b.id}>
              <TableCell className="pl-6">
                <p className="font-medium whitespace-nowrap">{b.customer}</p>
                <p className="text-xs text-muted-foreground">{fmtDateTime(b.occurredAt)}</p>
              </TableCell>
              <TableCell>
                <Link
                  to={logisticsRoutes.shipment.href({ shipmentId: b.shipmentId })}
                  className="font-mono text-xs text-primary hover:underline"
                >
                  {b.shipmentId}
                </Link>
              </TableCell>
              <TableCell className="whitespace-nowrap">{t(`slas.metric.${b.metric}`)}</TableCell>
              <TableCell className="text-right whitespace-nowrap tabular-nums">
                {fmtDuration(b.delayHours * 60)}
              </TableCell>
              <TableCell className="whitespace-nowrap">{t(`slas.cause.${b.rootCause}`)}</TableCell>
              <TableCell className="pr-6 text-right">
                {b.credit !== null ? (
                  <span className="text-sm whitespace-nowrap text-muted-foreground tabular-nums">
                    {t('slas.breaches.creditedAmount', {
                      amount: fmtCurrency(b.credit, i18n.language),
                    })}
                  </span>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onCredit(b)}
                    aria-label={t('slas.credit.issueFor', { shipment: b.shipmentId })}
                  >
                    <FileMinus /> {t('slas.credit.action')}
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/** SLA breaches with their root cause, filterable, with a credit-note action. */
export function BreachesCard({ breaches }: { breaches: Breach[] }) {
  const { t } = useTranslation('logistics');
  const [credit, setCredit] = useState<CreditFilter>('open');
  const [cause, setCause] = useState<RootCause | 'all'>('all');
  const [crediting, setCrediting] = useState<Breach | null>(null);
  const shown = breaches.filter(
    (b) =>
      (cause === 'all' || b.rootCause === cause) &&
      (credit === 'all' || (credit === 'open') === (b.credit === null)),
  );

  return (
    <SectionCard
      title={t('slas.breaches.title')}
      description={t('slas.breaches.description')}
      action={
        <div className="flex flex-wrap items-center gap-2">
          <NativeSelect
            size="sm"
            value={cause}
            onChange={(e) => setCause(e.target.value as RootCause | 'all')}
            aria-label={t('slas.breaches.rootCause')}
          >
            <NativeSelectOption value="all">{t('slas.breaches.allCauses')}</NativeSelectOption>
            {ROOT_CAUSES.map((c) => (
              <NativeSelectOption key={c} value={c}>
                {t(`slas.cause.${c}`)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <SegmentedControl<CreditFilter>
            size="sm"
            value={credit}
            onChange={setCredit}
            aria-label={t('slas.breaches.filter')}
            options={(['open', 'credited', 'all'] as const).map((value) => ({
              value,
              label: t(`slas.breaches.${value}`),
            }))}
          />
        </div>
      }
      flush
    >
      {shown.length ? (
        <BreachTable breaches={shown} onCredit={setCrediting} />
      ) : (
        <EmptyState
          variant="plain"
          icon={ShieldCheck}
          title={t('slas.breaches.emptyTitle')}
          description={t('slas.breaches.emptyDescription')}
          className="pb-8"
        />
      )}
      <CreditNoteDialog breach={crediting} onClose={() => setCrediting(null)} />
    </SectionCard>
  );
}
