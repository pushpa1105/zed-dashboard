import {
  ArrowDownLeft,
  ArrowUpRight,
  Mail,
  MessageSquare,
  Phone,
  StickyNote,
  Users,
} from 'lucide-react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { Link, useParams } from '@/core/router/router';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { DescriptionList } from '@/shared/components/display/description-list';
import { EmptyState } from '@/shared/components/display/empty-state';
import { FileItem } from '@/shared/components/display/file-item';
import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { StatusBadge } from '@/shared/components/display/status-badge';
import { Tag } from '@/shared/components/display/tag';
import { Timeline } from '@/shared/components/display/timeline';
import {
  VariantTabs,
  VariantTabsContent,
  VariantTabsList,
  VariantTabsTrigger,
} from '@/shared/components/navigation/variant-tabs';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

import { contactQuery, useContact } from '../api/crm-api';
import { CompanyMark, StageBadge, WidgetError } from '../components/crm-parts';
import { dateTime, money, relativeDays, shortDate } from '../lib/format';
import { crmRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ params }) => {
    await queryClient.prefetchQuery(contactQuery(params.contactId!));
    return null;
  };

const KIND_ICON = { email: Mail, meeting: Users, call: Phone, note: StickyNote } as const;
const STATUS_TONE = { customer: 'success', prospect: 'info', churned: 'neutral' } as const;

export default function ContactPage() {
  const { t, i18n } = useTranslation('crm');
  const { contactId = '' } = useParams();
  const contact = useContact(contactId);
  const data = contact.data;
  const person = data?.person;

  if (contact.isError) {
    return (
      <Page width="full" title={t('common.notFound')}>
        <WidgetError onRetry={() => void contact.refetch()} />
      </Page>
    );
  }

  return (
    <Page
      width="full"
      title={person?.name ?? '…'}
      description={person ? `${person.title} · ${person.company}` : undefined}
    >
      <div className="grid items-start gap-4 md:gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <aside className="rounded-xl border bg-card shadow-xs lg:sticky lg:top-24">
          {person && data ? (
            <>
              <div className="flex flex-col items-center gap-3 border-b p-6 text-center">
                <InitialsAvatar name={person.name} size="xl" />
                <div>
                  <p className="text-base font-semibold">{person.name}</p>
                  <p className="text-sm text-muted-foreground">{person.title}</p>
                </div>
                <StatusBadge
                  status={person.status}
                  label={t(`people.status.${person.status}`)}
                  tone={STATUS_TONE[person.status]}
                />
                <div className="mt-1 grid w-full grid-cols-2 gap-2">
                  <Button variant="outline" asChild>
                    <a href={`mailto:${person.email}`}>
                      <Mail /> {t('contact.sendEmail')}
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href={`tel:${person.phone}`}>
                      <Phone /> {t('contact.call')}
                    </a>
                  </Button>
                </div>
              </div>
              <div className="space-y-5 p-6">
                <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                  {t('contact.about')}
                </p>
                <DescriptionList
                  layout="vertical"
                  items={[
                    {
                      key: 'email',
                      term: t('contact.email'),
                      detail: <span className="break-all">{person.email}</span>,
                    },
                    { key: 'phone', term: t('contact.phone'), detail: person.phone },
                    {
                      key: 'company',
                      term: t('contact.company'),
                      detail: (
                        <span className="flex items-center gap-2">
                          <CompanyMark
                            name={data.company.name}
                            className="size-6 rounded-md text-[0.6rem]"
                          />
                          <Link
                            to={crmRoutes.company.href({ companyId: data.company.id })}
                            className="hover:underline"
                          >
                            {data.company.name}
                          </Link>
                        </span>
                      ),
                    },
                    { key: 'owner', term: t('contact.owner'), detail: person.owner },
                    {
                      key: 'last',
                      term: t('contact.lastContacted'),
                      detail: relativeDays(person.lastContactedAt, i18n.language),
                    },
                  ]}
                />
                <div className="flex flex-wrap gap-1.5">
                  {person.tags.map((tag) => (
                    <Tag key={tag} size="sm">
                      {tag}
                    </Tag>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <Skeleton className="m-6 h-96" />
          )}
        </aside>

        <SectionCard>
          <VariantTabs defaultValue="activity">
            <VariantTabsList>
              <VariantTabsTrigger value="activity">{t('contact.tabs.activity')}</VariantTabsTrigger>
              <VariantTabsTrigger value="emails" count={data?.emails.length}>
                {t('contact.tabs.emails')}
              </VariantTabsTrigger>
              <VariantTabsTrigger value="deals" count={data?.deals.length}>
                {t('contact.tabs.deals')}
              </VariantTabsTrigger>
              <VariantTabsTrigger value="files" count={data?.files.length}>
                {t('contact.tabs.files')}
              </VariantTabsTrigger>
            </VariantTabsList>

            <VariantTabsContent value="activity" className="pt-2">
              {data ? (
                <Timeline
                  items={data.activity.map((a) => ({
                    key: a.id,
                    title: a.title,
                    time: dateTime(a.at),
                    icon: KIND_ICON[a.kind as keyof typeof KIND_ICON] ?? MessageSquare,
                  }))}
                />
              ) : (
                <Skeleton className="h-48" />
              )}
            </VariantTabsContent>

            <VariantTabsContent value="emails">
              <ul className="divide-y rounded-lg border">
                {data?.emails.map((mail) => {
                  const inbound = mail.direction === 'in';
                  const Icon = inbound ? ArrowDownLeft : ArrowUpRight;
                  return (
                    <li key={mail.id} className="flex gap-3 p-4">
                      <span
                        className={cn(
                          'flex size-8 shrink-0 items-center justify-center rounded-full',
                          inbound ? 'bg-info/10 text-info' : 'bg-muted text-muted-foreground',
                        )}
                        title={inbound ? t('contact.inbound') : t('contact.outbound')}
                      >
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="truncate text-sm font-medium">{mail.subject}</p>
                          <time className="shrink-0 text-xs text-muted-foreground">
                            {shortDate(mail.at)}
                          </time>
                        </div>
                        <p className="line-clamp-2 text-sm text-muted-foreground">{mail.snippet}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </VariantTabsContent>

            <VariantTabsContent value="deals">
              {data?.deals.length ? (
                <ul className="divide-y rounded-lg border">
                  {data.deals.map((deal) => (
                    <li key={deal.id}>
                      <Link
                        to={crmRoutes.deal.href({ dealId: deal.id })}
                        className="flex items-center gap-4 p-4 hover:bg-muted/50"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{deal.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {deal.owner} · {shortDate(deal.closeDate)}
                          </p>
                        </div>
                        <StageBadge stage={deal.stage} />
                        <span className="w-24 text-right text-sm font-medium tabular-nums">
                          {money(deal.value)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState variant="plain" title={t('contact.noDeals')} />
              )}
            </VariantTabsContent>

            <VariantTabsContent value="files" className="space-y-2">
              {data?.files.map((file) => (
                <FileItem key={file.id} name={file.name} size={file.size} />
              ))}
            </VariantTabsContent>
          </VariantTabs>
        </SectionCard>
      </div>
    </Page>
  );
}
