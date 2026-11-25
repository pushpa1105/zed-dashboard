import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useEffect } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';

import type { PageModule } from '@/core/feature/define-feature';
import { FormField } from '@/core/forms/form-field';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { Link, useParams } from '@/core/router/router';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { ErrorState } from '@/shared/components/display/error-state';
import { CurrencyInput } from '@/shared/components/forms/currency-input';
import { FileDropzone } from '@/shared/components/forms/file-dropzone';
import { NumberInput } from '@/shared/components/forms/number-input';
import { TagInput } from '@/shared/components/forms/tag-input';
import { TextareaWithCounter } from '@/shared/components/forms/textarea-with-counter';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { FieldGroup } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { productQuery, useProduct, useSaveProduct } from '../api/store-api';
import { ProductThumb } from '../components/store-badges';
import { formatMoney } from '../lib/money';
import {
  PRODUCT_STATUSES,
  productFormSchema,
  type ProductDetail,
  type ProductForm,
} from '../model/store';
import { ecommerceRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ params }) => {
    await queryClient.prefetchQuery(productQuery(params.productId!));
    return null;
  };

const toForm = (p: ProductDetail): ProductForm => ({
  name: p.name,
  description: p.description,
  status: p.status,
  vendor: p.vendor,
  categoryId: p.categoryId,
  tags: p.tags,
  price: p.price,
  compareAt: p.compareAt,
  cost: p.cost,
  variants: p.variants,
  handle: p.handle,
  seoTitle: p.seoTitle,
  seoDescription: p.seoDescription,
});

function Editor({ product }: { product: ProductDetail }) {
  const { t, i18n } = useTranslation('ecommerce');
  const save = useSaveProduct();
  const form = useForm<ProductForm>({
    resolver: zodResolver(productFormSchema),
    defaultValues: toForm(product),
  });
  const variants = useFieldArray({ control: form.control, name: 'variants', keyName: 'key' });
  const [price, cost, handle, seoTitle, seoDescription, name, status] = useWatch({
    control: form.control,
    name: ['price', 'cost', 'handle', 'seoTitle', 'seoDescription', 'name', 'status'],
  });
  const { isDirty, dirtyFields } = form.formState;
  const margin = price > 0 ? ((price - cost) / price) * 100 : 0;
  const money = (n: number) => formatMoney(n, i18n.language);

  useEffect(() => form.reset(toForm(product)), [product, form]);

  const submit = form.handleSubmit((values) =>
    save.mutate({ id: product.id, values }, { onSuccess: (saved) => form.reset(toForm(saved)) }),
  );

  return (
    <form onSubmit={submit} noValidate className="pb-24">
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <SectionCard title={t('editor.general')}>
            <FieldGroup>
              <FormField
                control={form.control}
                name="name"
                label={t('editor.name')}
                required
                render={({ field, id, invalid }) => (
                  <Input id={id} aria-invalid={invalid} {...field} />
                )}
              />
              <FormField
                control={form.control}
                name="description"
                label={t('editor.descriptionLabel')}
                render={({ field, id }) => (
                  <TextareaWithCounter id={id} maxLength={2000} rows={5} {...field} />
                )}
              />
            </FieldGroup>
          </SectionCard>

          <SectionCard title={t('editor.media')} description={t('editor.mediaHint')}>
            <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
              <ProductThumb hue={product.hue} className="aspect-square size-auto w-full" />
              <FileDropzone
                accept={{ 'image/*': [] }}
                maxSize={5 * 1024 * 1024}
                maxFiles={8}
                title={t('editor.dropTitle')}
                hint={t('editor.dropHint')}
              />
            </div>
          </SectionCard>

          <SectionCard title={t('editor.pricing')}>
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="price"
                label={t('editor.price')}
                required
                render={({ field, id, invalid }) => (
                  <CurrencyInput
                    id={id}
                    value={field.value}
                    onChange={(v) => field.onChange(v ?? 0)}
                    invalid={invalid}
                  />
                )}
              />
              <FormField
                control={form.control}
                name="compareAt"
                label={t('editor.compareAt')}
                render={({ field, id }) => (
                  <CurrencyInput
                    id={id}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="—"
                  />
                )}
              />
              <FormField
                control={form.control}
                name="cost"
                label={t('editor.cost')}
                render={({ field, id }) => (
                  <CurrencyInput
                    id={id}
                    value={field.value}
                    onChange={(v) => field.onChange(v ?? 0)}
                  />
                )}
              />
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-4 rounded-lg bg-muted/50 px-4 py-3 text-sm sm:max-w-sm">
              <div>
                <dt className="text-xs text-muted-foreground">{t('editor.margin')}</dt>
                <dd className={cn('font-semibold tabular-nums', margin < 30 && 'text-destructive')}>
                  {margin.toFixed(1)}%
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{t('editor.profit')}</dt>
                <dd className="font-semibold tabular-nums">{money(price - cost)}</dd>
              </div>
            </dl>
          </SectionCard>

          <SectionCard
            title={t('editor.variants')}
            description={t('editor.variantsHint')}
            flush
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  variants.append({
                    id: `var-new-${Date.now()}`,
                    title: '',
                    sku: `${product.sku}-NEW`,
                    price,
                    stock: 0,
                  })
                }
              >
                <Plus /> {t('editor.addVariant')}
              </Button>
            }
          >
            <div className="overflow-x-auto border-t">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">{t('editor.variant')}</TableHead>
                    <TableHead>{t('editor.sku')}</TableHead>
                    <TableHead className="w-36">{t('editor.price')}</TableHead>
                    <TableHead className="w-32">{t('editor.stock')}</TableHead>
                    <TableHead className="w-12 pr-6">
                      <span className="sr-only">{t('editor.remove')}</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {variants.fields.map((variant, index) => (
                    <TableRow key={variant.key}>
                      <TableCell className="pl-6">
                        <Input
                          aria-label={t('editor.variant')}
                          className="h-8 min-w-24"
                          {...form.register(`variants.${index}.title`)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          aria-label={t('editor.sku')}
                          className="h-8 min-w-36 font-mono text-xs"
                          {...form.register(`variants.${index}.sku`)}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`variants.${index}.price`}
                          render={({ field }) => (
                            <CurrencyInput
                              aria-label={t('editor.price')}
                              value={field.value}
                              onChange={(v) => field.onChange(v ?? 0)}
                              className="h-8"
                            />
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`variants.${index}.stock`}
                          render={({ field }) => (
                            <NumberInput
                              aria-label={t('editor.stock')}
                              value={field.value}
                              onChange={(v) => field.onChange(v ?? 0)}
                              min={0}
                              steppers={false}
                              className="h-8"
                            />
                          )}
                        />
                      </TableCell>
                      <TableCell className="pr-6">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={t('editor.remove')}
                          disabled={variants.fields.length === 1}
                          onClick={() => variants.remove(index)}
                        >
                          <Trash2 />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </SectionCard>

          <SectionCard title={t('editor.seo')} description={t('editor.seoHint')}>
            <div className="mb-5 rounded-lg border bg-background p-4">
              <p className="text-xs text-muted-foreground">
                fieldwork.supply › products › {handle}
              </p>
              <p className="mt-1 truncate text-base text-[color:var(--chart-4)]">
                {seoTitle || name}
              </p>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{seoDescription}</p>
            </div>
            <FieldGroup>
              <FormField
                control={form.control}
                name="handle"
                label={t('editor.handle')}
                description={t('editor.handleHint')}
                render={({ field, id, invalid }) => (
                  <div className="flex">
                    <span className="flex h-9 items-center rounded-l-lg border border-r-0 bg-muted px-3 text-sm text-muted-foreground">
                      /products/
                    </span>
                    <Input id={id} aria-invalid={invalid} className="rounded-l-none" {...field} />
                  </div>
                )}
              />
              <FormField
                control={form.control}
                name="seoTitle"
                label={t('editor.seoTitle')}
                render={({ field, id }) => (
                  <TextareaWithCounter id={id} maxLength={70} rows={1} {...field} />
                )}
              />
              <FormField
                control={form.control}
                name="seoDescription"
                label={t('editor.seoDescription')}
                render={({ field, id }) => (
                  <TextareaWithCounter id={id} maxLength={160} rows={2} {...field} />
                )}
              />
            </FieldGroup>
          </SectionCard>
        </div>

        <div className="space-y-6 lg:sticky lg:top-24">
          <SectionCard title={t('editor.status')}>
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full" aria-label={t('editor.status')}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {t(`productStatus.${s}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <p className="mt-3 text-xs text-muted-foreground">{t(`editor.statusHint.${status}`)}</p>
          </SectionCard>

          <SectionCard title={t('editor.organization')}>
            <FieldGroup>
              <FormField
                control={form.control}
                name="categoryId"
                label={t('editor.category')}
                render={({ field, id }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id={id} className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {product.categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.parentId ? `— ${c.name}` : c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FormField
                control={form.control}
                name="vendor"
                label={t('editor.vendor')}
                render={({ field, id }) => <Input id={id} {...field} />}
              />
              <FormField
                control={form.control}
                name="tags"
                label={t('editor.tags')}
                render={({ field, id }) => (
                  <TagInput
                    id={id}
                    value={field.value}
                    onChange={field.onChange}
                    lowercase
                    max={10}
                  />
                )}
              />
            </FieldGroup>
          </SectionCard>

          <SectionCard title={t('editor.performance')}>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">{t('editor.sold')}</dt>
                <dd className="text-lg font-semibold tabular-nums">
                  {product.sold.toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{t('editor.rating')}</dt>
                <dd className="text-lg font-semibold tabular-nums">
                  {product.rating.toFixed(1)}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    ({product.reviews})
                  </span>
                </dd>
              </div>
            </dl>
          </SectionCard>
        </div>
      </div>

      <div
        className={cn(
          'fixed inset-x-0 bottom-4 z-30 mx-auto flex w-[min(42rem,calc(100%-2rem))] items-center gap-3 rounded-xl border bg-popover/95 px-4 py-3 shadow-lg backdrop-blur transition-all',
          isDirty ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0',
        )}
        role="status"
      >
        <span className="size-2 rounded-full bg-warning" />
        <p className="text-sm font-medium">
          {t('editor.unsaved', { count: Object.keys(dirtyFields).length })}
        </p>
        <div className="ml-auto flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => form.reset()}>
            {t('editor.discard')}
          </Button>
          <Button type="submit" size="sm" disabled={save.isPending}>
            {t('editor.save')}
          </Button>
        </div>
      </div>
    </form>
  );
}

/** Product editor: content, media, pricing with live margin, variants, SEO, organization. */
export default function ProductEditorPage() {
  const { t } = useTranslation('ecommerce');
  const { productId = '' } = useParams();
  const product = useProduct(productId);

  return (
    <Page
      width="full"
      title={product.data?.name ?? t('editor.loading')}
      description={product.data ? `${product.data.sku} · ${product.data.vendor}` : undefined}
      actions={
        <Button variant="ghost" asChild>
          <Link to={ecommerceRoutes.products.href()}>
            <ArrowLeft /> {t('editor.back')}
          </Link>
        </Button>
      }
    >
      {product.isError ? (
        <ErrorState title={t('editor.notFound')} onRetry={() => void product.refetch()} />
      ) : !product.data ? (
        <div className="grid gap-6 lg:grid-cols-3" aria-busy="true">
          <Skeleton className="h-[36rem] rounded-xl lg:col-span-2" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      ) : (
        <Editor product={product.data} />
      )}
    </Page>
  );
}
