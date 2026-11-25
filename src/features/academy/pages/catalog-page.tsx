import { BookOpen, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { useSearchParams } from '@/core/router/router';
import { EmptyState } from '@/shared/components/display/empty-state';
import { SearchInput } from '@/shared/components/forms/search-input';
import { SegmentedControl } from '@/shared/components/forms/segmented-control';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Separator } from '@/shared/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/shared/ui/sheet';
import { Skeleton } from '@/shared/ui/skeleton';
import { Switch } from '@/shared/ui/switch';

import { catalogQuery, useCatalog } from '../api/academy-api';
import { CourseCard } from '../components/course-card';
import { QueryError } from '../components/query-error';
import {
  CATEGORIES,
  LEVELS,
  PRICES,
  SORTS,
  type Catalog,
  type CatalogFilters,
  type Category,
  type CourseSort,
  type Level,
  type PriceFilter,
} from '../model/academy';

const list = <T extends string>(raw: string | null, allowed: readonly T[]) =>
  (raw ?? '').split(',').filter((v): v is T => allowed.includes(v as T));
const one = <T extends string>(raw: string | null, allowed: readonly T[], fallback: T) =>
  allowed.includes(raw as T) ? (raw as T) : fallback;

/** Filters live in the URL (`?category=` from the menu works too). */
function parseFilters(params: URLSearchParams): CatalogFilters {
  return {
    q: params.get('q') ?? '',
    levels: list(params.get('levels'), LEVELS),
    categories: list(params.get('categories') ?? params.get('category'), CATEGORIES),
    price: one(params.get('price'), PRICES, 'any'),
    sort: one(params.get('sort'), SORTS, 'popular'),
  };
}

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ request }) => {
    await queryClient.prefetchQuery(catalogQuery(parseFilters(new URL(request.url).searchParams)));
    return null;
  };

type Facets = Catalog['facets'] | undefined;

function FilterPanel({
  filters,
  facets,
  enrolledOnly,
  update,
}: {
  filters: CatalogFilters;
  facets: Facets;
  enrolledOnly: boolean;
  update: (patch: Record<string, string | null>) => void;
}) {
  const { t } = useTranslation('academy');
  const toggle = <T extends string>(key: 'levels' | 'categories', current: T[], value: T) => {
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    update({ [key]: next.join(',') || null, category: null });
  };

  return (
    <div className="space-y-6">
      <label className="flex items-center justify-between gap-3 text-sm font-medium">
        {t('catalog.myLearning')}
        <Switch
          checked={enrolledOnly}
          onCheckedChange={(checked) => update({ enrolled: checked ? '1' : null })}
        />
      </label>
      <Separator />
      <fieldset className="space-y-3">
        <legend className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {t('catalog.level')}
        </legend>
        {LEVELS.map((level) => (
          <Label key={level} className="flex items-center gap-2.5 font-normal">
            <Checkbox
              checked={filters.levels.includes(level)}
              onCheckedChange={() => toggle<Level>('levels', filters.levels, level)}
            />
            <span className="flex-1">{t(`levels.${level}`)}</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {facets?.levels.find((f) => f.value === level)?.count ?? 0}
            </span>
          </Label>
        ))}
      </fieldset>
      <fieldset className="space-y-3">
        <legend className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {t('catalog.topic')}
        </legend>
        {CATEGORIES.map((category) => (
          <Label key={category} className="flex items-center gap-2.5 font-normal">
            <Checkbox
              checked={filters.categories.includes(category)}
              onCheckedChange={() => toggle<Category>('categories', filters.categories, category)}
            />
            <span className="flex-1">{t(`categories.${category}`)}</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {facets?.categories.find((f) => f.value === category)?.count ?? 0}
            </span>
          </Label>
        ))}
      </fieldset>
      <fieldset className="space-y-3">
        <legend className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {t('catalog.price')}
        </legend>
        <SegmentedControl
          block
          size="sm"
          value={filters.price}
          onChange={(value: PriceFilter) => update({ price: value === 'any' ? null : value })}
          options={PRICES.map((value) => ({ value, label: t(`catalog.prices.${value}`) }))}
        />
      </fieldset>
    </div>
  );
}

/** Course catalog with faceted filters, search and sort. */
export default function CatalogPage() {
  const { t } = useTranslation('academy');
  const [params, setParams] = useSearchParams();
  const filters = parseFilters(params);
  const enrolledOnly = params.get('enrolled') === '1';
  const [search, setSearch] = useState(filters.q);
  const debounced = useDebounce(search, 300);
  const catalog = useCatalog({ ...filters, q: debounced });
  const data = catalog.data;
  const courses = (data?.courses ?? []).filter((c) => !enrolledOnly || c.enrolled);

  const update = (patch: Record<string, string | null>) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(patch)) {
          if (value === null) next.delete(key);
          else next.set(key, value);
        }
        return next;
      },
      { replace: true },
    );

  const panel = (
    <FilterPanel
      filters={filters}
      facets={data?.facets}
      enrolledOnly={enrolledOnly}
      update={update}
    />
  );
  const active =
    filters.levels.length + filters.categories.length + (filters.price !== 'any' ? 1 : 0);

  return (
    <Page width="full" title={t('catalog.title')} description={t('catalog.description')}>
      <div className="grid items-start gap-8 lg:grid-cols-[15rem_1fr]">
        <aside className="sticky top-24 hidden rounded-xl border bg-card p-5 shadow-xs lg:block">
          {panel}
        </aside>
        <div className="min-w-0 space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={t('catalog.search')}
              containerClassName="w-full sm:w-auto sm:min-w-0 sm:max-w-sm sm:flex-1"
            />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden">
                  <SlidersHorizontal /> {t('catalog.filters')}
                  {active > 0 && (
                    <span className="text-xs text-primary tabular-nums">{active}</span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle>{t('catalog.filters')}</SheetTitle>
                </SheetHeader>
                <div className="px-4">{panel}</div>
              </SheetContent>
            </Sheet>
            <div className="ml-auto flex items-center gap-3">
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {t('catalog.results', { count: courses.length })}
              </span>
              <Select value={filters.sort} onValueChange={(value) => update({ sort: value })}>
                <SelectTrigger className="w-44" aria-label={t('catalog.sort')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  {SORTS.map((sort) => (
                    <SelectItem key={sort} value={sort}>
                      {t(`catalog.sorts.${sort as CourseSort}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {catalog.isError && !data ? (
            <QueryError onRetry={() => void catalog.refetch()} />
          ) : !data ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-80 rounded-xl" />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title={t('catalog.empty.title')}
              description={t('catalog.empty.description')}
              actions={
                <Button variant="outline" onClick={() => setParams({}, { replace: true })}>
                  {t('catalog.empty.reset')}
                </Button>
              }
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}
