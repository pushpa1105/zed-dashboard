import { ArrowDown, ArrowUp, Plus, X } from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { Button } from '@/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { funnelQuery, useFunnel } from '../api/analytics-api';
import { QueryError } from '../components/query-error';
import { RangeControl } from '../components/range-control';
import { rangeFromRequest, useRangeParams } from '../hooks/use-range';
import { compact, integer, percent } from '../lib/format';
import type { Funnel } from '../model/analytics';

const DEFAULT_STEPS = ['landing', 'pricing', 'signup', 'source', 'subscribe'];
const MAX_STEPS = 7;

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ request }) => {
    await queryClient.prefetchQuery(funnelQuery(rangeFromRequest(request), DEFAULT_STEPS));
    return null;
  };

function StepEditor({
  steps,
  events,
  onChange,
}: {
  steps: string[];
  events: Funnel['events'];
  onChange: (steps: string[]) => void;
}) {
  const { t } = useTranslation('analytics');
  const move = (from: number, to: number) => {
    const next = [...steps];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item!);
    onChange(next);
  };

  return (
    <SectionCard title={t('funnels.steps.title')} description={t('funnels.steps.description')}>
      <ol className="space-y-2">
        {steps.map((step, i) => (
          <li key={`${step}-${i}`} className="flex items-center gap-2">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {i + 1}
            </span>
            <Select
              value={step}
              onValueChange={(value) => onChange(steps.map((s, j) => (j === i ? value : s)))}
            >
              <SelectTrigger
                className="min-w-0 flex-1"
                aria-label={t('funnels.steps.step', { n: i + 1 })}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {events.map((event) => (
                  <SelectItem key={event.key} value={event.key}>
                    {event.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex shrink-0">
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={i === 0}
                onClick={() => move(i, i - 1)}
                aria-label={t('funnels.steps.up')}
              >
                <ArrowUp />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={i === steps.length - 1}
                onClick={() => move(i, i + 1)}
                aria-label={t('funnels.steps.down')}
              >
                <ArrowDown />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={steps.length <= 2}
                onClick={() => onChange(steps.filter((_, j) => j !== i))}
                aria-label={t('funnels.steps.remove')}
              >
                <X />
              </Button>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={steps.length >= MAX_STEPS}
          onClick={() => {
            const unused = events.find((e) => !steps.includes(e.key)) ?? events[0]!;
            onChange([...steps, unused.key]);
          }}
        >
          <Plus /> {t('funnels.steps.add')}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onChange(DEFAULT_STEPS)}>
          {t('funnels.steps.reset')}
        </Button>
      </div>
    </SectionCard>
  );
}

function FunnelBars({ steps }: { steps: Funnel['steps'] }) {
  const { t } = useTranslation('analytics');
  const top = steps[0]?.users || 1;
  return (
    <div
      className="grid h-80 items-end gap-2 sm:gap-3"
      style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
    >
      {steps.map((step, i) => {
        const share = step.users / top;
        const prev = steps[i - 1]?.users;
        return (
          <div key={`${step.key}-${i}`} className="flex h-full min-w-0 flex-col justify-end gap-2">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold tabular-nums">{compact(step.users)}</p>
              <p className="text-xs text-muted-foreground tabular-nums">
                {prev
                  ? t('funnels.ofPrevious', { value: percent((step.users / prev) * 100) })
                  : t('funnels.entry')}
              </p>
            </div>
            <div className="relative flex-1">
              <div
                className="absolute inset-x-0 bottom-0 rounded-t-md bg-muted"
                style={{ height: '100%' }}
              />
              <div
                className="absolute inset-x-0 bottom-0 rounded-t-md bg-primary transition-[height] duration-500"
                style={{ height: `${Math.max(share * 100, 1.5)}%`, opacity: 1 - i * 0.08 }}
              />
            </div>
            <p className="line-clamp-2 min-h-8 text-xs leading-4">{step.label}</p>
          </div>
        );
      })}
    </div>
  );
}

/** Conversion funnel builder: pick 2–7 events and see where people drop off. */
export default function FunnelsPage() {
  const { t } = useTranslation('analytics');
  const { range } = useRangeParams();
  const [steps, setSteps] = useState(DEFAULT_STEPS);
  const query = useFunnel(range, steps);
  const data = query.data;
  const first = data?.steps[0]?.users ?? 0;
  const last = data?.steps.at(-1)?.users ?? 0;
  const worst = data?.steps
    .map((step, i) => ({ step, rate: i ? step.users / data.steps[i - 1]!.users : 1 }))
    .slice(1)
    .sort((a, b) => a.rate - b.rate)[0];

  return (
    <Page
      width="full"
      title={t('funnels.title')}
      description={t('funnels.description')}
      actions={<RangeControl />}
    >
      {query.isError && !data ? (
        <QueryError onRetry={() => void query.refetch()} />
      ) : !data ? (
        <div className="grid gap-6 xl:grid-cols-[24rem_1fr]">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      ) : (
        <div className="grid items-start gap-6 xl:grid-cols-[24rem_1fr]">
          <StepEditor steps={steps} events={data.events} onChange={setSteps} />
          <div className="space-y-6">
            <SectionCard
              title={t('funnels.chart.title')}
              description={t('funnels.chart.description')}
              action={
                <div className="text-right">
                  <p className="text-2xl font-semibold tabular-nums">
                    {percent(first ? (last / first) * 100 : 0, 2)}
                  </p>
                  <p className="text-xs text-muted-foreground">{t('funnels.overall')}</p>
                </div>
              }
            >
              <FunnelBars steps={data.steps} />
              {worst && (
                <p className="mt-4 rounded-lg bg-warning/12 px-3 py-2 text-sm">
                  {t('funnels.biggestDrop', {
                    step: worst.step.label,
                    value: percent((1 - worst.rate) * 100, 0),
                  })}
                </p>
              )}
            </SectionCard>
            <SectionCard title={t('funnels.table.title')} flush>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">{t('funnels.table.step')}</TableHead>
                    <TableHead className="text-right">{t('funnels.table.users')}</TableHead>
                    <TableHead className="text-right">{t('funnels.table.dropOff')}</TableHead>
                    <TableHead className="pr-6 text-right">{t('funnels.table.time')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.steps.map((step, i) => {
                    const prev = data.steps[i - 1]?.users;
                    return (
                      <TableRow key={`${step.key}-${i}`}>
                        <TableCell className="pl-6">
                          <span className="mr-2 text-muted-foreground tabular-nums">{i + 1}.</span>
                          {step.label}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {integer(step.users)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {prev ? `−${integer(prev - step.users)}` : '—'}
                        </TableCell>
                        <TableCell className="pr-6 text-right text-muted-foreground tabular-nums">
                          {i ? t('funnels.table.minutes', { value: step.medianTimeMin }) : '—'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </SectionCard>
          </div>
        </div>
      )}
    </Page>
  );
}
