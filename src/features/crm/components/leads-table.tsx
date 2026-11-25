import { ArrowRightLeft, Check, MoreHorizontal, X } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Link } from '@/core/router/router';
import { StatusBadge } from '@/shared/components/display/status-badge';
import { UserCell } from '@/shared/components/display/user-cell';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';

import { money, relativeDays } from '../lib/format';
import { LEAD_ACTIONS, type Lead, type LeadAction, type LeadStatus } from '../model/crm';
import { crmRoutes } from '../routes';

export const LEAD_ACTION_ICON = { qualify: Check, disqualify: X, convert: ArrowRightLeft };
const STATUS_TONE = {
  new: 'info',
  qualified: 'success',
  disqualified: 'neutral',
  converted: 'primary',
} as const satisfies Record<LeadStatus, string>;

/** Leads with row selection; converted leads link to their deal and can't be selected. */
export function LeadsTable({
  leads,
  selected,
  onSelectedChange,
  onAction,
}: {
  leads: Lead[];
  selected: Set<string>;
  onSelectedChange: (ids: Set<string>) => void;
  onAction: (ids: string[], action: LeadAction) => void;
}) {
  const { t, i18n } = useTranslation('crm');
  const selectable = leads.filter((l) => l.status !== 'converted');
  const allChecked = selectable.length > 0 && selectable.every((l) => selected.has(l.id));
  const someChecked = selectable.some((l) => selected.has(l.id));

  const toggle = (id: string, checked: boolean) => {
    const next = new Set(selected);
    if (checked) next.add(id);
    else next.delete(id);
    onSelectedChange(next);
  };

  return (
    <div className="overflow-x-auto rounded-xl border bg-card shadow-xs">
      <table className="w-full min-w-[56rem] text-sm" aria-label={t('leads.title')}>
        <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th className="w-12 px-4 py-3">
              <Checkbox
                aria-label={t('leads.selectAll')}
                checked={allChecked || (someChecked && 'indeterminate')}
                onCheckedChange={(checked) =>
                  onSelectedChange(new Set(checked ? selectable.map((l) => l.id) : []))
                }
              />
            </th>
            {(['lead', 'company', 'source', 'score', 'value', 'received', 'status'] as const).map(
              (col) => (
                <th key={col} className="px-3 py-3 text-left font-medium">
                  {t(`leads.columns.${col}`)}
                </th>
              ),
            )}
            <th className="w-12 px-4 py-3">
              <span className="sr-only">{t('leads.columns.actions')}</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {leads.map((lead) => {
            const converted = lead.status === 'converted';
            return (
              <tr key={lead.id} data-state={selected.has(lead.id) ? 'selected' : undefined}>
                <td className="px-4 py-3">
                  <Checkbox
                    aria-label={t('leads.select', { name: lead.name })}
                    checked={selected.has(lead.id)}
                    disabled={converted}
                    onCheckedChange={(checked) => toggle(lead.id, checked === true)}
                  />
                </td>
                <td className="px-3 py-3">
                  <UserCell name={lead.name} secondary={lead.email} />
                </td>
                <td className="px-3 py-3">
                  <p className="font-medium">{lead.company}</p>
                  <p className="text-xs text-muted-foreground">{lead.title}</p>
                </td>
                <td className="px-3 py-3">
                  <p>{lead.source}</p>
                  <p className="text-xs text-muted-foreground">{lead.interest}</p>
                </td>
                <td className="px-3 py-3">
                  <LeadScore score={lead.score} />
                </td>
                <td className="px-3 py-3 tabular-nums">{money(lead.estimatedValue, true)}</td>
                <td className="px-3 py-3 whitespace-nowrap text-muted-foreground">
                  {relativeDays(lead.createdAt, i18n.language)}
                </td>
                <td className="px-3 py-3">
                  {converted && lead.dealId ? (
                    <Link
                      to={crmRoutes.deal.href({ dealId: lead.dealId })}
                      className="hover:underline"
                    >
                      <StatusBadge
                        status={lead.status}
                        label={t('leads.viewDeal')}
                        tone={STATUS_TONE.converted}
                      />
                    </Link>
                  ) : (
                    <StatusBadge
                      status={lead.status}
                      label={t(`leads.status.${lead.status}`)}
                      tone={STATUS_TONE[lead.status]}
                    />
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {!converted && <RowActions lead={lead} onAction={onAction} />}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RowActions({
  lead,
  onAction,
}: {
  lead: Lead;
  onAction: (ids: string[], action: LeadAction) => void;
}) {
  const { t } = useTranslation('crm');
  const actions = LEAD_ACTIONS.filter(
    (action) =>
      !(action === 'qualify' && lead.status === 'qualified') &&
      !(action === 'disqualify' && lead.status === 'disqualified'),
  );
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t('leads.actionsFor', { name: lead.name })}
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((action) => {
          const Icon = LEAD_ACTION_ICON[action];
          return (
            <DropdownMenuItem key={action} onSelect={() => onAction([lead.id], action)}>
              <Icon /> {t(`leads.actions.${action}`)}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Score with a hot/warm/cold label so the colour is never the only signal. */
function LeadScore({ score }: { score: number }) {
  const { t } = useTranslation('crm');
  const band = score >= 70 ? 'hot' : score >= 40 ? 'warm' : 'cold';
  const color = { hot: 'var(--success)', warm: 'var(--warning)', cold: 'var(--muted-foreground)' }[
    band
  ];
  return (
    <div className="flex w-28 items-center gap-2">
      <span className="w-7 text-right font-semibold tabular-nums">{score}</span>
      <div className="flex-1">
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{t(`leads.score.${band}`)}</p>
      </div>
    </div>
  );
}
