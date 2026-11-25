import { Globe, MapPin, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { Link } from '@/core/router/router';
import { Tag } from '@/shared/components/display/tag';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Skeleton } from '@/shared/ui/skeleton';

import { companiesQuery, useCompanies } from '../api/crm-api';
import { CompanyMark, WidgetError } from '../components/crm-parts';
import { money } from '../lib/format';
import { crmRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(companiesQuery());
    return null;
  };

export default function CompaniesPage() {
  const { t } = useTranslation('crm');
  const companies = useCompanies();
  const [query, setQuery] = useState('');
  const [industry, setIndustry] = useState('all');

  const industries = useMemo(
    () => Array.from(new Set(companies.data?.map((c) => c.industry) ?? [])).sort(),
    [companies.data],
  );
  const list = (companies.data ?? [])
    .filter((c) => industry === 'all' || c.industry === industry)
    .filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => b.pipeline - a.pipeline);

  return (
    <Page width="full" title={t('companies.title')} description={t('companies.description')}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('companies.search')}
            aria-label={t('companies.search')}
            className="pl-9"
          />
        </div>
        <Select value={industry} onValueChange={setIndustry}>
          <SelectTrigger className="w-52" aria-label={t('companies.industry')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('companies.allIndustries')}</SelectItem>
            {industries.map((i) => (
              <SelectItem key={i} value={i}>
                {i}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {companies.isError ? (
        <WidgetError onRetry={() => void companies.refetch()} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-3">
          {!companies.data
            ? Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)
            : list.map((c) => (
                <article
                  key={c.id}
                  className="relative flex flex-col rounded-xl border bg-card shadow-xs transition-colors focus-within:ring-2 focus-within:ring-ring hover:border-primary/40"
                >
                  <div className="flex items-start gap-3 p-6 pb-4">
                    <CompanyMark name={c.name} className="size-11 text-sm" />
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-base font-semibold">
                        <Link
                          to={crmRoutes.company.href({ companyId: c.id })}
                          className="outline-none after:absolute after:inset-0"
                        >
                          {c.name}
                        </Link>
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {c.industry} · {t('companies.employees', { count: c.employees })}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 px-6 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3.5" aria-hidden /> {c.city}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Globe className="size-3.5" aria-hidden /> {c.website}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 px-6 pt-3">
                    {c.tags.map((tag) => (
                      <Tag key={tag} size="sm" tone={tag === 'Strategic' ? 'violet' : 'neutral'}>
                        {tag}
                      </Tag>
                    ))}
                  </div>
                  <dl className="mt-auto grid grid-cols-3 divide-x border-t pt-0 text-center">
                    {[
                      {
                        key: 'pipeline',
                        label: t('companies.pipeline'),
                        value: money(c.pipeline, true),
                      },
                      { key: 'deals', label: t('companies.openDeals'), value: c.openDeals },
                      { key: 'contacts', label: t('companies.contacts'), value: c.contacts },
                    ].map((stat) => (
                      <div key={stat.key} className="px-2 py-4">
                        <dt className="text-xs text-muted-foreground">{stat.label}</dt>
                        <dd className="mt-1 text-base font-semibold tabular-nums">{stat.value}</dd>
                      </div>
                    ))}
                  </dl>
                </article>
              ))}
        </div>
      )}
    </Page>
  );
}
