import { SearchX } from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { EmptyState } from '@/shared/components/display/empty-state';
import { StatusBadge } from '@/shared/components/display/status-badge';
import { SearchInput } from '@/shared/components/forms/search-input';
import { SegmentedControl } from '@/shared/components/forms/segmented-control';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';

import { money } from '../lib/format';
import { BENEFIT_COLOR, type BenefitPlan, type Enrollment } from '../model/workforce';

import { DepartmentLabel, PersonLink } from './hr-parts';

const STATUS_FILTERS = ['all', 'enrolled', 'pending', 'waived'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];
const STATUS_TONE = { enrolled: 'success', pending: 'warning', waived: 'neutral' } as const;

export function EnrollmentTable({
  plans,
  enrollments,
}: {
  plans: BenefitPlan[];
  enrollments: Enrollment[];
}) {
  const { t } = useTranslation('hr');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const planById = new Map(plans.map((p) => [p.id, p]));

  const needle = query.trim().toLowerCase();
  const rows = enrollments.filter(
    (e) =>
      (status === 'all' || e.status === status) &&
      (!needle || `${e.name} ${e.department}`.toLowerCase().includes(needle)),
  );

  return (
    <SectionCard
      flush
      title={t('benefits.enrollments')}
      description={t('benefits.enrollmentsHint')}
    >
      <div className="flex flex-col gap-3 px-6 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder={t('benefits.search')}
          aria-label={t('benefits.search')}
          containerClassName="sm:max-w-xs"
        />
        <div className="scrollbar-none overflow-x-auto">
          <SegmentedControl
            size="sm"
            value={status}
            onChange={setStatus}
            options={STATUS_FILTERS.map((value) => ({
              value,
              label: t(`benefits.status.${value}`),
            }))}
          />
        </div>
      </div>
      {rows.length ? (
        <Table className="min-w-[44rem] border-t">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-6">{t('benefits.columns.employee')}</TableHead>
              <TableHead>{t('benefits.columns.department')}</TableHead>
              <TableHead>{t('benefits.columns.plans')}</TableHead>
              <TableHead className="text-right">{t('benefits.columns.cost')}</TableHead>
              <TableHead className="pr-6">{t('benefits.columns.status')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((e) => {
              const enrolled = e.planIds.flatMap((id) => planById.get(id) ?? []);
              return (
                <TableRow key={e.personId}>
                  <TableCell className="pl-6">
                    <PersonLink personId={e.personId} name={e.name} />
                  </TableCell>
                  <TableCell>
                    <DepartmentLabel department={e.department} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {enrolled.map((plan) => (
                        <Tooltip key={plan.id}>
                          <TooltipTrigger asChild>
                            <span
                              tabIndex={0}
                              aria-label={plan.name}
                              className="size-3 rounded-full"
                              style={{ background: BENEFIT_COLOR[plan.category] }}
                            />
                          </TooltipTrigger>
                          <TooltipContent>{plan.name}</TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {money(
                      enrolled.reduce((s, p) => s + p.employerCost, 0),
                      0,
                    )}
                  </TableCell>
                  <TableCell className="pr-6">
                    <StatusBadge
                      status={e.status}
                      tone={STATUS_TONE[e.status]}
                      label={t(`benefits.status.${e.status}`)}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <EmptyState
          variant="plain"
          icon={SearchX}
          title={t('benefits.noMatches')}
          className="border-t py-12"
        />
      )}
    </SectionCard>
  );
}
