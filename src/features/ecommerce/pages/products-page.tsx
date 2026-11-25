import { LayoutGrid, List, Plus, Search, Star } from 'lucide-react';
import { useMemo } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { Link, useSearchParams } from '@/core/router/router';
import { EmptyState } from '@/shared/components/display/empty-state';
import { ErrorState } from '@/shared/components/display/error-state';
import { Tag } from '@/shared/components/display/tag';
import { cn } from '@/shared/lib/cn';
import { formatRelative } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group';

import { productsQuery, useProducts } from '../api/store-api';
import { ProductThumb, StockBadge } from '../components/store-badges';
import { formatMoney } from '../lib/money';
import { stockLevel, type Category, type ProductSummary } from '../model/store';
import { ecommerceRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(productsQuery());
    return null;
  };

const SORTS = ['bestselling', 'newest', 'priceAsc', 'priceDesc', 'stockAsc'] as const;
type Sort = (typeof SORTS)[number];
const STOCK = ['all', 'in', 'low', 'out'] as const;

const sorters: Record<Sort, (a: ProductSummary, b: ProductSummary) => number> = {
  bestselling: (a, b) => b.sold - a.sold,
  newest: (a, b) => b.updatedAt - a.updatedAt,
  priceAsc: (a, b) => a.price - b.price,
  priceDesc: (a, b) => b.price - a.price,
  stockAsc: (a, b) => a.stock - b.stock,
};

function FacetButton({
  active,
  label,
  count,
  depth = 0,
  onClick,
}: {
  active: boolean;
  label: string;
  count?: number;
  depth?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'flex h-8 w-full items-center gap-2 rounded-md px-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
        active && 'bg-accent font-medium text-accent-foreground',
      )}
      style={{ paddingLeft: `${0.625 + depth * 0.875}rem` }}
    >
      <span className="truncate">{label}</span>
      {count !== undefined && <span className="ml-auto text-xs tabular-nums">{count}</span>}
    </button>
  );
}

/** Catalog browser: category tree facets, stock filter, grid ⇄ list, sorting. State in the URL. */
export default function ProductsPage() {
  const { t, i18n } = useTranslation('ecommerce');
  const [params, setParams] = useSearchParams();
  const products = useProducts();
  const view = params.get('view') === 'list' ? 'list' : 'grid';
  const category = params.get('category') ?? '';
  const stock = (STOCK as readonly string[]).includes(params.get('stock') ?? '')
    ? (params.get('stock') as (typeof STOCK)[number])
    : 'all';
  const sort = (SORTS as readonly string[]).includes(params.get('sort') ?? '')
    ? (params.get('sort') as Sort)
    : 'bestselling';
  const q = params.get('q') ?? '';
  const money = (n: number) => formatMoney(n, i18n.language, 0);

  const set = (key: string, value: string) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );

  const categories = useMemo(() => products.data?.categories ?? [], [products.data]);
  const tree = useMemo(() => {
    const roots = categories.filter((c) => !c.parentId);
    return roots.flatMap((root) => [
      { cat: root, depth: 0 },
      ...categories.filter((c) => c.parentId === root.id).map((cat) => ({ cat, depth: 1 })),
    ]);
  }, [categories]);

  const visible = useMemo(() => {
    const all = products.data?.data ?? [];
    const inCategory = (p: ProductSummary) =>
      !category ||
      p.categoryId === category ||
      categories.some((c: Category) => c.id === p.categoryId && c.parentId === category);
    const needle = q.toLowerCase();
    return all
      .filter(
        (p) =>
          inCategory(p) &&
          (stock === 'all' || stockLevel(p.stock) === stock) &&
          (!needle ||
            p.name.toLowerCase().includes(needle) ||
            p.sku.toLowerCase().includes(needle) ||
            p.vendor.toLowerCase().includes(needle)),
      )
      .sort(sorters[sort]);
  }, [products.data, categories, category, stock, q, sort]);

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? '';
  const total = products.data?.data.length ?? 0;

  return (
    <Page
      width="full"
      title={t('products.title')}
      description={t('products.description', { count: total })}
      actions={
        <Button disabled title={t('products.addHint')}>
          <Plus /> {t('products.add')}
        </Button>
      }
    >
      <div className="grid items-start gap-6 lg:grid-cols-[15rem_1fr]">
        <aside className="hidden space-y-6 lg:sticky lg:top-24 lg:block">
          <div className="space-y-1">
            <p className="px-2.5 pb-1 text-xs font-medium text-muted-foreground">
              {t('products.categories')}
            </p>
            <FacetButton
              active={!category}
              label={t('products.allCategories')}
              count={total}
              onClick={() => set('category', '')}
            />
            {products.isPending
              ? Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-8" />)
              : tree.map(({ cat, depth }) => (
                  <FacetButton
                    key={cat.id}
                    active={category === cat.id}
                    label={cat.name}
                    count={cat.productCount}
                    depth={depth}
                    onClick={() => set('category', cat.id)}
                  />
                ))}
          </div>
          <div className="space-y-1">
            <p className="px-2.5 pb-1 text-xs font-medium text-muted-foreground">
              {t('products.stock')}
            </p>
            {STOCK.map((level) => (
              <FacetButton
                key={level}
                active={stock === level}
                label={t(`products.stockFilter.${level}`)}
                count={
                  level === 'all'
                    ? undefined
                    : products.data?.data.filter((p) => stockLevel(p.stock) === level).length
                }
                onClick={() => set('stock', level === 'all' ? '' : level)}
              />
            ))}
          </div>
        </aside>

        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-56 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => set('q', e.target.value)}
                placeholder={t('products.search')}
                aria-label={t('products.search')}
                className="pl-9"
              />
            </div>
            <Select
              value={category || 'all'}
              onValueChange={(v) => set('category', v === 'all' ? '' : v)}
            >
              <SelectTrigger
                className="w-full sm:w-48 lg:hidden"
                aria-label={t('products.categories')}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('products.allCategories')}</SelectItem>
                {tree.map(({ cat, depth }) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {depth ? `— ${cat.name}` : cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v) => set('sort', v === 'bestselling' ? '' : v)}>
              <SelectTrigger className="w-44" aria-label={t('products.sortLabel')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {SORTS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {t(`products.sort.${s}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ToggleGroup
              type="single"
              variant="outline"
              value={view}
              onValueChange={(v) => v && set('view', v === 'grid' ? '' : v)}
            >
              <ToggleGroupItem value="grid" aria-label={t('products.grid')}>
                <LayoutGrid />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label={t('products.list')}>
                <List />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <p className="text-sm text-muted-foreground">
            {t('products.showing', { count: visible.length })}
            {category && ` · ${categoryName(category)}`}
          </p>

          {products.isError ? (
            <ErrorState title={t('common.error')} onRetry={() => void products.refetch()} />
          ) : products.isPending ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={i} className="h-72 rounded-xl" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <EmptyState
              icon={Search}
              title={t('products.empty.title')}
              description={t('products.empty.description')}
              actions={
                <Button variant="outline" onClick={() => setParams(new URLSearchParams())}>
                  {t('products.empty.reset')}
                </Button>
              }
            />
          ) : view === 'grid' ? (
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {visible.map((p) => (
                <li key={p.id}>
                  <Link
                    to={ecommerceRoutes.product.href({ productId: p.id })}
                    className="group flex h-full flex-col overflow-hidden rounded-xl border bg-card shadow-xs transition-shadow hover:shadow-md"
                  >
                    <div className="relative">
                      <ProductThumb hue={p.hue} size="fill" />
                      {p.status !== 'active' && (
                        <Tag
                          size="sm"
                          className="absolute top-3 left-3"
                          tone="neutral"
                          appearance="solid"
                        >
                          {t(`productStatus.${p.status}`)}
                        </Tag>
                      )}
                      {p.compareAt && (
                        <Tag
                          size="sm"
                          className="absolute top-3 right-3"
                          tone="danger"
                          appearance="solid"
                        >
                          {t('products.sale')}
                        </Tag>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-1 p-4">
                      <p className="text-xs text-muted-foreground">{p.vendor}</p>
                      <p className="line-clamp-1 font-medium group-hover:underline">{p.name}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="size-3.5 fill-warning text-warning" />
                        <span className="tabular-nums">
                          {p.rating.toFixed(1)} ({p.reviews})
                        </span>
                      </div>
                      <div className="mt-auto flex items-end justify-between gap-2 pt-3">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-semibold tabular-nums">{money(p.price)}</span>
                          {p.compareAt && (
                            <span className="text-xs text-muted-foreground tabular-nums line-through">
                              {money(p.compareAt)}
                            </span>
                          )}
                        </div>
                        <StockBadge stock={p.stock} />
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="overflow-hidden rounded-xl border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">{t('products.col.product')}</TableHead>
                    <TableHead>{t('products.col.status')}</TableHead>
                    <TableHead>{t('products.col.inventory')}</TableHead>
                    <TableHead className="hidden md:table-cell">
                      {t('products.col.category')}
                    </TableHead>
                    <TableHead className="hidden xl:table-cell">
                      {t('products.col.updated')}
                    </TableHead>
                    <TableHead className="pr-4 text-right">{t('products.col.price')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="pl-4">
                        <Link
                          to={ecommerceRoutes.product.href({ productId: p.id })}
                          className="flex items-center gap-3"
                        >
                          <ProductThumb hue={p.hue} size="sm" />
                          <span className="min-w-0">
                            <span className="block truncate font-medium hover:underline">
                              {p.name}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {p.sku} · {t('products.variants', { count: p.variantCount })}
                            </span>
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Tag size="sm" tone={p.status === 'active' ? 'success' : 'neutral'} dot>
                          {t(`productStatus.${p.status}`)}
                        </Tag>
                      </TableCell>
                      <TableCell>
                        <StockBadge stock={p.stock} />
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {categoryName(p.categoryId)}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground xl:table-cell">
                        {formatRelative(p.updatedAt)}
                      </TableCell>
                      <TableCell className="pr-4 text-right font-medium tabular-nums">
                        {money(p.price)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}
