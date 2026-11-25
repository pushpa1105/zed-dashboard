import { MessageSquareQuote } from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { EmptyState } from '@/shared/components/display/empty-state';
import { StatusBadge } from '@/shared/components/display/status-badge';
import { Tag } from '@/shared/components/display/tag';
import { SegmentedControl } from '@/shared/components/forms/segmented-control';

import { shortDate } from '../lib/format';
import { SENTIMENT_TONE, SENTIMENTS, type SurveyComment } from '../model/engagement';

import { DepartmentLabel } from './hr-parts';

const FILTERS = ['all', ...SENTIMENTS] as const;

export function SurveyComments({ comments }: { comments: SurveyComment[] }) {
  const { t } = useTranslation('hr');
  const [sentiment, setSentiment] = useState<(typeof FILTERS)[number]>('all');
  const shown = comments.filter((c) => sentiment === 'all' || c.sentiment === sentiment);

  return (
    <SectionCard
      title={t('engagement.comments')}
      description={t('engagement.commentsHint')}
      action={
        <SegmentedControl
          size="sm"
          value={sentiment}
          onChange={setSentiment}
          options={FILTERS.map((value) => ({ value, label: t(`engagement.sentiment.${value}`) }))}
        />
      }
    >
      {shown.length ? (
        <ul className="grid gap-3 md:grid-cols-2">
          {shown.map((c) => (
            <li key={c.id} className="flex flex-col gap-3 rounded-lg border p-4">
              <p className="text-sm leading-relaxed">“{c.text}”</p>
              <div className="mt-auto flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <StatusBadge
                  status={c.sentiment}
                  variant="dot"
                  tone={SENTIMENT_TONE[c.sentiment]}
                  label={t(`engagement.sentiment.${c.sentiment}`)}
                />
                <Tag size="sm">{t(`engagement.topics.${c.topic}`)}</Tag>
                <DepartmentLabel department={c.department} />
                <span className="ml-auto tabular-nums">{shortDate(c.date)}</span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState variant="plain" icon={MessageSquareQuote} title={t('engagement.noComments')} />
      )}
    </SectionCard>
  );
}
