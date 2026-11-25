import {
  Briefcase,
  CircleDollarSign,
  Handshake,
  MonitorPlay,
  Phone,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { Link, useParams } from '@/core/router/router';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatCard } from '@/shared/components/dashboard/stat-card';
import { DescriptionList } from '@/shared/components/display/description-list';
import { EmptyState } from '@/shared/components/display/empty-state';
import { Tag } from '@/shared/components/display/tag';
import { Timeline } from '@/shared/components/display/timeline';
import { UserCell } from '@/shared/components/display/user-cell';
import { Skeleton } from '@/shared/ui/skeleton';

import { companyQuery, useCompany } from '../api/crm-api';
import { CompanyMark, StageBadge, WidgetError } from '../components/crm-parts';
import { dateTime, money, shortDate } from '../lib/format';
import type { CompanyDetail } from '../model/crm';
import { crmRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ params }) => {
    await queryClient.prefetchQuery(companyQuery(params.companyId!));
    return null;
  };

const ACTIVITY_ICON: Record<string, LucideIcon> = {
  deal: Briefcase,
  won: Trophy,
  call: Phone,
  meeting: Users,
  demo: MonitorPlay,
};

export default function CompanyPage() {
  const { t } = useTranslation('crm');
  const { companyId = '' } = useParams();
  const query = useCompany(companyId);
  const data = query.data;

  if (query.isError) {
    return (
      <Page width="full" title={t('common.notFound')}>
        <WidgetError onRetry={() => void query.refetch()} />
      </Page>
    );
  }

  const openDeals = data?.deals.filter((d) => d.stage !== 'won' && d.stage !== 'lost') ?? [];
  const stats = [
    {
      key: 'pipeline',
      icon: Briefcase,
      label: t('companies.pipeline'),
      value: money(
        openDeals.reduce((s, d) => s + d.value, 0),
        true,
      ),
    },
    {
      key: 'won',
      icon: Trophy,
      label: t('company.wonRevenue'),
      value: money(data?.wonRevenue ?? 0, true),
    },
    { key: 'deals', icon: Handshake, label: t('companies.openDeals'), value: openDeals.length },
    {
      key: 'contacts',
      icon: Users,
      label: t('companies.contacts'),
      value: data?.contacts.length ?? 0,
    },
  ];

  return (
    <Page
      width="full"
      title={data?.company.name ?? '…'}
      description={data ? `${data.company.industry} · ${data.company.city}` : undefined}
    >
      <div className="grid gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-4">
        {stats.map(({ key, ...stat }, i) => (
          <StatCard key={key} {...stat} color={`var(--chart-${i + 1})`} loading={!data} />
        ))}
      </div>

      <div className="grid items-start gap-4 md:gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <aside className="rounded-xl border bg-card shadow-xs lg:sticky lg:top-24">
          {data ? <Firmographics company={data.company} /> : <Skeleton className="m-6 h-80" />}
        </aside>

        <div className="grid gap-4 md:gap-6 xl:grid-cols-2">
          <SectionCard
            title={t('company.openDeals')}
            description={t('company.openDealsHint')}
            flush
          >
            {!data ? (
              <Skeleton className="m-6 h-40" />
            ) : openDeals.length ? (
              <ul className="divide-y border-t">
                {openDeals.map((deal) => (
                  <li key={deal.id}>
                    <Link
                      to={crmRoutes.deal.href({ dealId: deal.id })}
                      className="flex items-center gap-3 px-6 py-3 hover:bg-muted/50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{deal.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {deal.owner} · {shortDate(deal.closeDate)}
                        </p>
                      </div>
                      <StageBadge stage={deal.stage} className="hidden sm:inline-flex" />
                      <span className="text-sm font-medium tabular-nums">
                        {money(deal.value, true)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                variant="plain"
                icon={CircleDollarSign}
                title={t('company.noOpenDeals')}
              />
            )}
          </SectionCard>

          <SectionCard
            title={t('companies.contacts')}
            description={t('company.contactsHint')}
            flush
          >
            {!data ? (
              <Skeleton className="m-6 h-40" />
            ) : data.contacts.length ? (
              <ul className="divide-y border-t">
                {data.contacts.map((person) => (
                  <li key={person.id}>
                    <Link
                      to={crmRoutes.contact.href({ contactId: person.id })}
                      className="flex items-center gap-3 px-6 py-3 hover:bg-muted/50"
                    >
                      <UserCell name={person.name} secondary={person.title} className="flex-1" />
                      <span className="hidden text-xs text-muted-foreground sm:inline">
                        {t(`people.status.${person.status}`)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState variant="plain" icon={Users} title={t('company.noContacts')} />
            )}
          </SectionCard>

          <SectionCard
            title={t('deal.activity')}
            description={t('company.activityHint')}
            className="xl:col-span-2"
          >
            {!data ? (
              <Skeleton className="h-48" />
            ) : data.activity.length ? (
              <Timeline
                items={data.activity.map((a) => ({
                  key: a.id,
                  title: a.title,
                  description: a.actor,
                  time: dateTime(a.at),
                  icon: ACTIVITY_ICON[a.kind] ?? Briefcase,
                  tone: a.kind === 'won' ? 'success' : 'primary',
                }))}
              />
            ) : (
              <EmptyState variant="plain" title={t('company.noActivity')} />
            )}
          </SectionCard>
        </div>
      </div>
    </Page>
  );
}

function Firmographics({ company }: { company: CompanyDetail['company'] }) {
  const { t } = useTranslation('crm');
  return (
    <>
      <div className="flex items-center gap-3 border-b p-6">
        <CompanyMark name={company.name} className="size-12 text-sm" />
        <div className="min-w-0">
          <p className="truncate text-base font-semibold">{company.name}</p>
          <a
            href={`https://${company.website}`}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-muted-foreground hover:underline"
          >
            {company.website}
          </a>
        </div>
      </div>
      <div className="space-y-5 p-6">
        <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
          {t('company.firmographics')}
        </p>
        <DescriptionList
          layout="vertical"
          items={[
            { key: 'industry', term: t('companies.industry'), detail: company.industry },
            {
              key: 'employees',
              term: t('company.headcount'),
              detail: company.employees.toLocaleString(),
            },
            { key: 'revenue', term: t('companies.revenue'), detail: money(company.revenue, true) },
            { key: 'city', term: t('company.location'), detail: company.city },
            { key: 'owner', term: t('common.owner'), detail: company.owner },
          ]}
        />
        <div className="flex flex-wrap gap-1.5">
          {company.tags.map((tag) => (
            <Tag key={tag} size="sm" tone={tag === 'Strategic' ? 'violet' : 'neutral'}>
              {tag}
            </Tag>
          ))}
        </div>
      </div>
    </>
  );
}
