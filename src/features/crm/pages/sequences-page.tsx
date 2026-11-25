import {
  ChevronRight,
  ListChecks,
  Mail,
  MailOpen,
  Mails,
  MessageSquareReply,
  Pencil,
  Phone,
  Plus,
  Users,
} from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { StatCard } from '@/shared/components/dashboard/stat-card';
import { EmptyState } from '@/shared/components/display/empty-state';
import { StatusBadge } from '@/shared/components/display/status-badge';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

import { sequencesQuery, useSequences } from '../api/crm-api';
import { WidgetError } from '../components/crm-parts';
import { SequenceSheet } from '../components/sequence-sheet';
import { shortDate } from '../lib/format';
import type { Sequence } from '../model/crm';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(sequencesQuery());
    return null;
  };

const STEP_ICON = { email: Mail, call: Phone, task: ListChecks };
const STATUS_TONE = { active: 'success', paused: 'warning', draft: 'neutral' } as const;

const average = (list: Sequence[], key: 'openRate' | 'replyRate') => {
  const live = list.filter((s) => s.enrolled > 0);
  return live.length ? Math.round(live.reduce((sum, s) => sum + s[key], 0) / live.length) : 0;
};

export default function SequencesPage() {
  const { t } = useTranslation('crm');
  const sequences = useSequences();
  const [editing, setEditing] = useState<Sequence | 'new' | null>(null);
  const data = sequences.data;

  const stats = !data
    ? []
    : [
        {
          key: 'active',
          icon: Mails,
          label: t('sequences.stats.active'),
          value: data.filter((s) => s.status === 'active').length,
        },
        {
          key: 'enrolled',
          icon: Users,
          label: t('sequences.stats.enrolled'),
          value: data.reduce((sum, s) => sum + s.enrolled, 0).toLocaleString(),
        },
        {
          key: 'open',
          icon: MailOpen,
          label: t('sequences.stats.openRate'),
          value: `${average(data, 'openRate')}%`,
        },
        {
          key: 'reply',
          icon: MessageSquareReply,
          label: t('sequences.stats.replyRate'),
          value: `${average(data, 'replyRate')}%`,
        },
      ];

  return (
    <Page
      width="full"
      title={t('sequences.title')}
      description={t('sequences.description')}
      actions={
        <Button onClick={() => setEditing('new')}>
          <Plus /> {t('sequences.new')}
        </Button>
      }
    >
      {sequences.isError ? (
        <WidgetError onRetry={() => void sequences.refetch()} />
      ) : !data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-4">
            {stats.map(({ key, ...stat }, i) => (
              <StatCard key={key} {...stat} color={`var(--chart-${i + 1})`} />
            ))}
          </div>
          {data.length ? (
            <ul className="grid gap-4 md:gap-6 xl:grid-cols-2">
              {data.map((sequence) => (
                <SequenceCard
                  key={sequence.id}
                  sequence={sequence}
                  onEdit={() => setEditing(sequence)}
                />
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Mails}
              title={t('sequences.empty')}
              description={t('sequences.emptyHint')}
            />
          )}
        </>
      )}

      <SequenceSheet
        open={editing !== null}
        sequence={editing === 'new' || editing === null ? undefined : editing}
        onOpenChange={(open) => !open && setEditing(null)}
      />
    </Page>
  );
}

function SequenceCard({ sequence, onEdit }: { sequence: Sequence; onEdit: () => void }) {
  const { t } = useTranslation('crm');
  const metrics = [
    { key: 'enrolled', label: t('sequences.enrolled'), value: sequence.enrolled },
    { key: 'active', label: t('sequences.inProgress'), value: sequence.active },
    { key: 'open', label: t('sequences.openRate'), value: `${sequence.openRate}%` },
    { key: 'reply', label: t('sequences.replyRate'), value: `${sequence.replyRate}%` },
  ];
  const days = sequence.steps.reduce<number[]>(
    (acc, step) => [...acc, (acc.at(-1) ?? 0) + step.delayDays],
    [],
  );
  return (
    <li className="flex flex-col rounded-xl border bg-card shadow-xs">
      <div className="flex items-start gap-3 p-6 pb-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-base font-semibold">{sequence.name}</h2>
            <StatusBadge
              status={sequence.status}
              label={t(`sequences.status.${sequence.status}`)}
              tone={STATUS_TONE[sequence.status]}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {t('sequences.meta', {
              owner: sequence.owner,
              count: sequence.steps.length,
              date: shortDate(sequence.updatedAt),
            })}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          aria-label={t('sequences.editNamed', { name: sequence.name })}
        >
          <Pencil /> {t('sequences.editShort')}
        </Button>
      </div>

      <ol
        aria-label={t('sequences.form.steps')}
        className="scrollbar-none flex items-center gap-1.5 overflow-x-auto px-6 pb-4"
      >
        {sequence.steps.map((step, i) => {
          const Icon = STEP_ICON[step.kind];
          return (
            <li key={i} className="flex shrink-0 items-center gap-1.5">
              {i > 0 && <ChevronRight className="size-3.5 text-muted-foreground" aria-hidden />}
              <span
                className="inline-flex items-center gap-1.5 rounded-md border bg-muted/40 px-2 py-1 text-xs"
                title={step.subject}
              >
                <Icon className="size-3.5 text-primary" aria-hidden />
                <span className="sr-only">{t(`sequences.kind.${step.kind}`)}</span>
                {t('sequences.day', { n: days[i] })}
              </span>
            </li>
          );
        })}
      </ol>

      <dl className="mt-auto grid grid-cols-2 divide-x border-t text-center sm:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.key} className="px-2 py-4">
            <dt className="text-xs text-muted-foreground">{m.label}</dt>
            <dd className="mt-1 text-base font-semibold tabular-nums">{m.value}</dd>
          </div>
        ))}
      </dl>
    </li>
  );
}
