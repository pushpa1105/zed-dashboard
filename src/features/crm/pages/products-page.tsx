import { Package, PackageCheck, Percent, Plus, TrendingDown, TrendingUp } from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { BarChart } from '@/shared/components/charts/bar-chart';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatCard } from '@/shared/components/dashboard/stat-card';
import { EmptyState } from '@/shared/components/display/empty-state';
import { SearchInput } from '@/shared/components/forms/search-input';
import { SegmentedControl } from '@/shared/components/forms/segmented-control';
import { Button } from '@/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Skeleton } from '@/shared/ui/skeleton';

import { productsQuery, useProducts } from '../api/quotes-api';
import { WidgetError } from '../components/crm-parts';
import { ProductDialog } from '../components/product-dialog';
import { LOW_MARGIN, ProductsTable } from '../components/products-table';
import { marginOf, PRODUCT_CATEGORIES, type Product } from '../model/quotes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(productsQuery());
    return null;
  };

const VISIBILITY = ['all', 'active', 'inactive'] as const;
const average = (values: number[]) =>
  values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0;

function ProductStats({ products }: { products?: Product[] }) {
  const { t } = useTranslation('crm');
  const active = (products ?? []).filter((p) => p.active);
  const byMargin = [...active].sort((a, b) => marginOf(a) - marginOf(b));
  const best = byMargin.at(-1);
  const stats = [
    {
      key: 'active',
      icon: PackageCheck,
      value: active.length,
      hint: t('products.stats.ofTotal', { count: products?.length ?? 0 }),
    },
    { key: 'avgMargin', icon: Percent, value: `${Math.round(average(active.map(marginOf)))}%` },
    {
      key: 'lowMargin',
      icon: TrendingDown,
      value: byMargin.filter((p) => marginOf(p) < LOW_MARGIN).length,
      hint: t('products.stats.below', { pct: LOW_MARGIN }),
    },
    {
      key: 'bestMargin',
      icon: TrendingUp,
      value: best ? `${Math.round(marginOf(best))}%` : '—',
      hint: best?.name,
    },
  ] as const;
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-4">
      {stats.map(({ key, ...stat }, i) => (
        <StatCard
          key={key}
          {...stat}
          label={t(`products.stats.${key}`)}
          color={`var(--chart-${i + 1})`}
          loading={!products}
        />
      ))}
    </div>
  );
}

export default function ProductsPage() {
  const { t } = useTranslation('crm');
  const products = useProducts();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [visibility, setVisibility] = useState<(typeof VISIBILITY)[number]>('all');
  // Kept apart so the dialog keeps its title while it animates closed.
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product>();
  const openDialog = (product?: Product) => {
    setEditing(product);
    setDialogOpen(true);
  };

  const all = products.data ?? [];
  const needle = query.trim().toLowerCase();
  const list = all
    .filter((p) => category === 'all' || p.category === category)
    .filter((p) => visibility === 'all' || p.active === (visibility === 'active'))
    .filter((p) => `${p.name} ${p.sku}`.toLowerCase().includes(needle));
  const marginByCategory = PRODUCT_CATEGORIES.map((c) => ({
    category: t(`products.category.${c}`),
    margin: Math.round(average(all.filter((p) => p.category === c).map(marginOf))),
  }));

  return (
    <Page
      width="full"
      title={t('products.title')}
      description={t('products.description')}
      actions={
        <Button onClick={() => openDialog()}>
          <Plus /> {t('products.new')}
        </Button>
      }
    >
      <ProductStats products={products.data} />

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder={t('products.search')}
          aria-label={t('products.search')}
          containerClassName="w-full sm:w-72"
        />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-44" aria-label={t('products.columns.category')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('products.allCategories')}</SelectItem>
            {PRODUCT_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {t(`products.category.${c}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <SegmentedControl
          value={visibility}
          onChange={setVisibility}
          aria-label={t('products.columns.active')}
          options={VISIBILITY.map((v) => ({ value: v, label: t(`products.visibility.${v}`) }))}
        />
      </div>

      {products.isError ? (
        <WidgetError onRetry={() => void products.refetch()} />
      ) : (
        <div className="grid items-start gap-4 md:gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <SectionCard flush className="overflow-hidden">
            {!products.data ? (
              <Skeleton className="m-6 h-80" />
            ) : list.length ? (
              <ProductsTable products={list} onEdit={openDialog} />
            ) : (
              <EmptyState
                variant="plain"
                icon={Package}
                title={t('products.empty')}
                description={t('products.emptyHint')}
              />
            )}
          </SectionCard>
          <SectionCard
            title={t('products.marginChart')}
            description={t('products.marginChartHint')}
          >
            {products.data ? (
              <BarChart
                horizontal
                className="h-56"
                data={marginByCategory}
                xKey="category"
                valueFormatter={(v) => `${v}%`}
                series={[{ key: 'margin', label: t('products.columns.margin') }]}
              />
            ) : (
              <Skeleton className="h-56" />
            )}
          </SectionCard>
        </div>
      )}

      <ProductDialog open={dialogOpen} product={editing} onOpenChange={setDialogOpen} />
    </Page>
  );
}
