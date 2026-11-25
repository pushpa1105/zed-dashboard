import { useTranslation } from '@/core/i18n/use-translation';
import { cn } from '@/shared/lib/cn';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { fmtPct } from '../lib/format';
import { slaHealth, type SlaCustomer } from '../model/slas';

import { SlaHealthBadge } from './badges';
import { TargetBar } from './target-bar';

/** Customers against their SLA targets; picking one shows its trend. */
export function SlaCustomerTable({
  customers,
  selectedId,
  onSelect,
}: {
  customers: SlaCustomer[];
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  const { t, i18n } = useTranslation('logistics');
  const pct = (value: number) => fmtPct(value, i18n.language);
  return (
    <div className="overflow-x-auto">
      <Table aria-label={t('slas.customers')}>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-6">{t('slas.columns.customer')}</TableHead>
            <TableHead className="text-right">{t('slas.columns.shipments')}</TableHead>
            <TableHead className="w-48">{t('slas.columns.onTime')}</TableHead>
            <TableHead className="w-48">{t('slas.columns.transit')}</TableHead>
            <TableHead className="text-right">{t('slas.columns.breaches')}</TableHead>
            <TableHead className="pr-6">{t('slas.columns.health')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((c) => (
            <TableRow
              key={c.id}
              data-state={c.id === selectedId ? 'selected' : undefined}
              className="cursor-pointer"
              onClick={() => onSelect(c.id)}
            >
              <TableCell className="pl-6">
                <button
                  type="button"
                  aria-pressed={c.id === selectedId}
                  className={cn('text-left font-medium', c.id === selectedId && 'text-primary')}
                >
                  {c.name}
                </button>
                <p className="text-xs text-muted-foreground">{t(`slas.tier.${c.tier}`)}</p>
              </TableCell>
              <TableCell className="text-right tabular-nums">{c.shipments}</TableCell>
              <TableCell>
                <TargetBar
                  value={c.onTimePct}
                  target={c.targetOnTimePct}
                  label={t('slas.versus', {
                    actual: pct(c.onTimePct),
                    target: pct(c.targetOnTimePct),
                  })}
                />
              </TableCell>
              <TableCell>
                <TargetBar
                  value={c.transitHours}
                  target={c.targetTransitHours}
                  max={c.targetTransitHours * 1.5}
                  lowerIsBetter
                  label={t('slas.versus', {
                    actual: `${c.transitHours} h`,
                    target: `${c.targetTransitHours} h`,
                  })}
                />
              </TableCell>
              <TableCell className="text-right tabular-nums">{c.breaches}</TableCell>
              <TableCell className="pr-6">
                <SlaHealthBadge health={slaHealth(c)} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
