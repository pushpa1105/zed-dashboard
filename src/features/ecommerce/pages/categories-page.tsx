import { ArrowDown, ArrowUp, CornerDownRight, Eye, EyeOff, FolderTree } from 'lucide-react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { Link } from '@/core/router/router';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { ErrorState } from '@/shared/components/display/error-state';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { Switch } from '@/shared/ui/switch';

import { categoriesQuery, useCategories, useUpdateCategory } from '../api/store-api';
import type { Category } from '../model/store';
import { ecommerceRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(categoriesQuery());
    return null;
  };

function CategoryRow({
  category,
  siblings,
  child,
  maxCount,
}: {
  category: Category;
  siblings: Category[];
  child?: boolean;
  maxCount: number;
}) {
  const { t } = useTranslation('ecommerce');
  const update = useUpdateCategory();
  const index = siblings.indexOf(category);

  return (
    <li
      className={cn(
        'grid grid-cols-[1fr_auto] items-center gap-4 px-6 py-3 sm:grid-cols-[1fr_12rem_auto_auto]',
        !category.visible && 'opacity-60',
      )}
    >
      <div className={cn('flex min-w-0 items-center gap-3', child && 'pl-7')}>
        {child ? (
          <CornerDownRight className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <FolderTree className="size-4" />
          </span>
        )}
        <div className="min-w-0">
          <Link
            to={ecommerceRoutes.products.href({ category: category.id })}
            className={cn('truncate text-sm hover:underline', !child && 'font-medium')}
          >
            {category.name}
          </Link>
          <p className="text-xs text-muted-foreground">
            {t('categories.products', { count: category.productCount })}
          </p>
        </div>
      </div>
      <div className="hidden h-1.5 overflow-hidden rounded-full bg-muted sm:block">
        <div
          className="h-full rounded-full bg-primary/70"
          style={{ width: `${(category.productCount / maxCount) * 100}%` }}
        />
      </div>
      <div className="hidden items-center gap-2 sm:flex">
        {category.visible ? (
          <Eye className="size-4 text-muted-foreground" />
        ) : (
          <EyeOff className="size-4 text-muted-foreground" />
        )}
        <Switch
          checked={category.visible}
          aria-label={t('categories.visible', { name: category.name })}
          onCheckedChange={(visible) => update.mutate({ id: category.id, visible })}
        />
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t('categories.moveUp', { name: category.name })}
          disabled={index === 0 || update.isPending}
          onClick={() => update.mutate({ id: category.id, direction: 'up' })}
        >
          <ArrowUp />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t('categories.moveDown', { name: category.name })}
          disabled={index === siblings.length - 1 || update.isPending}
          onClick={() => update.mutate({ id: category.id, direction: 'down' })}
        >
          <ArrowDown />
        </Button>
      </div>
    </li>
  );
}

/** Category tree: order collections with move buttons, hide them from the storefront. */
export default function CategoriesPage() {
  const { t } = useTranslation('ecommerce');
  const categories = useCategories();
  const all = categories.data ?? [];
  const roots = all.filter((c) => !c.parentId);
  const maxCount = Math.max(1, ...all.map((c) => c.productCount));
  const hidden = all.filter((c) => !c.visible).length;

  return (
    <Page width="wide" title={t('categories.title')} description={t('categories.description')}>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: t('categories.stats.collections'), value: roots.length },
          { label: t('categories.stats.subcategories'), value: all.length - roots.length },
          { label: t('categories.stats.hidden'), value: hidden },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-card px-5 py-4">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{stat.value}</p>
          </div>
        ))}
      </div>

      <SectionCard title={t('categories.tree')} description={t('categories.treeHint')} flush>
        {categories.isError ? (
          <div className="p-6">
            <ErrorState title={t('common.error')} onRetry={() => void categories.refetch()} />
          </div>
        ) : categories.isPending ? (
          <div className="space-y-2 p-6">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : (
          <ul className="divide-y border-t">
            {roots.map((root) => {
              const children = all.filter((c) => c.parentId === root.id);
              return (
                <li key={root.id}>
                  <ul className="divide-y divide-dashed">
                    <CategoryRow category={root} siblings={roots} maxCount={maxCount} />
                    {children.map((child) => (
                      <CategoryRow
                        key={child.id}
                        category={child}
                        siblings={children}
                        child
                        maxCount={maxCount}
                      />
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>
    </Page>
  );
}
