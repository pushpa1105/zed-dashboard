import { ArrowLeft, Flag, Mail, PhoneCall, Plus, StickyNote, TrendingUp } from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { Link, useParams } from '@/core/router/router';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { DescriptionList } from '@/shared/components/display/description-list';
import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { Stepper } from '@/shared/components/display/stepper';
import { Timeline, type TimelineItem } from '@/shared/components/display/timeline';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { Textarea } from '@/shared/ui/textarea';

import { dealQuery, useAddNote, useDeal } from '../api/crm-api';
import { StageBadge, WidgetError } from '../components/crm-parts';
import { dateTime, money, relativeDays, shortDate } from '../lib/format';
import { OPEN_STAGES, type DealDetail } from '../model/crm';
import { crmRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ params }) => {
    await queryClient.prefetchQuery(dealQuery(params.dealId!));
    return null;
  };

const ACTIVITY_ICON = {
  created: Plus,
  call: PhoneCall,
  email: Mail,
  stage: TrendingUp,
} as const;

function NotesCard({ dealId, notes }: { dealId: string; notes: DealDetail['notes'] }) {
  const { t } = useTranslation('crm');
  const [body, setBody] = useState('');
  const addNote = useAddNote(dealId);
  const save = () => {
    if (!body.trim()) return;
    addNote.mutate(body.trim(), { onSuccess: () => setBody('') });
  };

  return (
    <SectionCard title={t('deal.notes')}>
      <div className="space-y-3">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) save();
          }}
          placeholder={t('deal.notePlaceholder')}
          className="min-h-24"
          aria-label={t('deal.notes')}
        />
        <div className="flex justify-end">
          <Button onClick={save} disabled={!body.trim() || addNote.isPending}>
            <StickyNote /> {t('deal.addNote')}
          </Button>
        </div>
      </div>
      <ul className="mt-6 space-y-4">
        {notes.map((note) => (
          <li key={note.id} className="flex gap-3">
            <InitialsAvatar name={note.author} size="sm" />
            <div className="min-w-0 flex-1 rounded-lg bg-muted/60 px-4 py-3">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-medium">{note.author}</p>
                <time className="text-xs text-muted-foreground">{dateTime(note.at)}</time>
              </div>
              <p className="mt-1 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                {note.body}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

export default function DealPage() {
  const { t, i18n } = useTranslation('crm');
  const { dealId = '' } = useParams();
  const detail = useDeal(dealId);
  const data = detail.data;

  if (detail.isError) {
    return (
      <Page width="full" title={t('common.notFound')}>
        <WidgetError onRetry={() => void detail.refetch()} />
      </Page>
    );
  }

  const deal = data?.deal;
  const stages = [...OPEN_STAGES, 'won'] as const;
  const current = deal
    ? deal.stage === 'lost'
      ? 0
      : stages.indexOf(deal.stage as (typeof stages)[number])
    : 0;
  const productTotal = data?.products.reduce((s, p) => s + p.price * p.quantity, 0) ?? 0;

  const activity: TimelineItem[] =
    data?.activity.map((a) => ({
      key: a.id,
      title: a.title,
      description: a.actor,
      time: dateTime(a.at),
      icon: ACTIVITY_ICON[a.kind as keyof typeof ACTIVITY_ICON] ?? Flag,
      tone: a.kind === 'stage' ? 'primary' : 'neutral',
    })) ?? [];

  return (
    <Page
      width="full"
      title={deal?.name ?? '…'}
      description={
        deal
          ? `${deal.company} · ${t('deal.closesIn', { when: relativeDays(deal.closeDate, i18n.language) })}`
          : undefined
      }
      actions={
        <Button variant="outline" asChild>
          <Link to={crmRoutes.pipeline.href()}>
            <ArrowLeft /> {t('nav.pipeline')}
          </Link>
        </Button>
      }
    >
      <SectionCard>
        {deal ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
              <div>
                <p className="text-xs text-muted-foreground">{t('common.value')}</p>
                <p className="text-2xl font-semibold tracking-tight tabular-nums">
                  {money(deal.value)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('common.stage')}</p>
                <StageBadge stage={deal.stage} className="mt-1.5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('common.probability')}</p>
                <p className="mt-1 text-sm font-medium tabular-nums">{deal.probability}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('common.owner')}</p>
                <p className="mt-1 flex items-center gap-2 text-sm font-medium">
                  <InitialsAvatar name={deal.owner} size="xs" /> {deal.owner}
                </p>
              </div>
            </div>
            <div className="border-t pt-6">
              <p className="mb-4 text-sm font-medium">{t('deal.progress')}</p>
              <Stepper
                current={current}
                steps={stages.map((s) => ({ key: s, title: t(`stages.${s}`) }))}
              />
            </div>
          </div>
        ) : (
          <Skeleton className="h-40 w-full" />
        )}
      </SectionCard>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-12">
        <div className="space-y-4 md:space-y-6 lg:col-span-8">
          <SectionCard title={t('deal.activity')} description={t('deal.activityDescription')}>
            {data ? <Timeline items={activity} /> : <Skeleton className="h-48 w-full" />}
          </SectionCard>
          {data && <NotesCard dealId={dealId} notes={data.notes} />}
        </div>
        <div className="space-y-4 md:space-y-6 lg:col-span-4">
          <SectionCard title={t('deal.details')}>
            {deal ? (
              <DescriptionList
                items={[
                  { key: 'company', term: t('common.company'), detail: deal.company },
                  { key: 'source', term: t('common.source'), detail: deal.source },
                  { key: 'close', term: t('common.closeDate'), detail: shortDate(deal.closeDate) },
                  { key: 'created', term: t('deal.createdAt'), detail: shortDate(deal.createdAt) },
                ]}
              />
            ) : (
              <Skeleton className="h-32 w-full" />
            )}
          </SectionCard>
          <SectionCard title={t('deal.contacts')} flush>
            <ul className="divide-y border-t">
              {data?.contacts.map((person, i) => (
                <li key={person.id}>
                  <Link
                    to={crmRoutes.contact.href({ contactId: person.id })}
                    className="flex items-center gap-3 px-6 py-3 hover:bg-muted/50"
                  >
                    <InitialsAvatar name={person.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{person.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{person.title}</p>
                    </div>
                    {i === 0 && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {t('deal.primary')}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </SectionCard>
          <SectionCard title={t('deal.products')} flush>
            <table className="w-full text-sm">
              <tbody className="divide-y border-t">
                {data?.products.map((p) => (
                  <tr key={p.name}>
                    <td className="px-6 py-3">{p.name}</td>
                    <td className="py-3 text-muted-foreground tabular-nums">
                      {t('deal.quantity')} {p.quantity}
                    </td>
                    <td className="px-6 py-3 text-right font-medium tabular-nums">
                      {money(p.price * p.quantity)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-muted/40">
                  <td className="px-6 py-3 font-medium" colSpan={2}>
                    {t('deal.total')}
                  </td>
                  <td className="px-6 py-3 text-right font-semibold tabular-nums">
                    {money(productTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </SectionCard>
        </div>
      </div>
    </Page>
  );
}
