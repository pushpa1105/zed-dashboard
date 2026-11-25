import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, SlidersHorizontal, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import type { PageModule } from '@/core/feature/define-feature';
import { FormField } from '@/core/forms/form-field';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { notify } from '@/core/notify/notify';
import { Link, useParams } from '@/core/router/router';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatStrip } from '@/shared/components/dashboard/stat-strip';
import { Tag } from '@/shared/components/display/tag';
import { NumberInput } from '@/shared/components/forms/number-input';
import { SwitchRow } from '@/shared/components/forms/switch-row';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Skeleton } from '@/shared/ui/skeleton';

import { itemQuery, useItem, useUpdateItem } from '../api/inventory-api';
import { AdjustStockDialog } from '../components/adjust-stock-dialog';
import { ErrorPanel } from '../components/error-panel';
import { MovementType } from '../components/movement-type';
import { StockStatusBadge } from '../components/stock-status-badge';
import { dateTime, qty, signed, usd, usdCents } from '../lib/format';
import type { ItemDetail } from '../model/inventory';
import { inventoryRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ params }) => {
    await queryClient.prefetchQuery(itemQuery(params.sku!));
    return null;
  };

const settingsSchema = z.object({
  reorderPoint: z.number({ message: 'validation.required' }).int().min(0),
  reorderQty: z.number({ message: 'validation.required' }).int().min(1),
  supplierId: z.string().min(1, 'validation.required'),
  autoReorder: z.boolean(),
});
type Settings = z.infer<typeof settingsSchema>;

function ReorderSettingsForm({ item }: { item: ItemDetail }) {
  const { t } = useTranslation('inventory', { keyPrefix: 'item.reorder' });
  const update = useUpdateItem();
  const form = useForm<Settings>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      reorderPoint: item.reorderPoint,
      reorderQty: item.reorderQty,
      supplierId: item.supplierId,
      autoReorder: item.autoReorder,
    },
  });
  useEffect(() => {
    form.reset({
      reorderPoint: item.reorderPoint,
      reorderQty: item.reorderQty,
      supplierId: item.supplierId,
      autoReorder: item.autoReorder,
    });
  }, [item, form]);

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={form.handleSubmit((values) => update.mutate({ sku: item.sku, ...values }))}
    >
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="reorderPoint"
          label={t('point')}
          render={({ field, id, invalid }) => (
            <NumberInput
              id={id}
              value={field.value}
              onChange={(v) => field.onChange(v ?? 0)}
              min={0}
              invalid={invalid}
            />
          )}
        />
        <FormField
          control={form.control}
          name="reorderQty"
          label={t('quantity')}
          render={({ field, id, invalid }) => (
            <NumberInput
              id={id}
              value={field.value}
              onChange={(v) => field.onChange(v ?? 0)}
              min={1}
              invalid={invalid}
            />
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="supplierId"
        label={t('supplier')}
        render={({ field, id }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger id={id} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {item.suppliers.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      <FormField
        control={form.control}
        name="autoReorder"
        render={({ field }) => (
          <SwitchRow
            label={t('auto')}
            description={t('autoHint')}
            checked={field.value}
            onCheckedChange={field.onChange}
          />
        )}
      />
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          disabled={!form.formState.isDirty}
          onClick={() => form.reset()}
        >
          {t('discard')}
        </Button>
        <Button type="submit" disabled={!form.formState.isDirty || update.isPending}>
          {t('save')}
        </Button>
      </div>
    </form>
  );
}

/** One SKU: stock per location, movement ledger, suppliers and reorder rules. */
export default function ItemPage() {
  const { t } = useTranslation('inventory', { keyPrefix: 'item' });
  const { sku = '' } = useParams();
  const item = useItem(sku);
  const [adjusting, setAdjusting] = useState(false);
  const data = item.data;

  if (item.isError) {
    return (
      <Page title={sku} width="full">
        <ErrorPanel onRetry={() => void item.refetch()} />
      </Page>
    );
  }

  const maxLevel = Math.max(1, ...(data?.levels.map((l) => l.onHand) ?? [1]));

  return (
    <Page
      title={data?.name ?? sku}
      description={data ? `${data.sku} · ${data.supplier}` : undefined}
      width="full"
      actions={
        <>
          <Button variant="ghost" asChild>
            <Link to={inventoryRoutes.items.href()}>
              <ArrowLeft /> {t('back')}
            </Link>
          </Button>
          <Button variant="outline" onClick={() => setAdjusting(true)} disabled={!data}>
            <SlidersHorizontal /> {t('adjust')}
          </Button>
        </>
      }
    >
      {data && (
        <div className="-mt-2 flex flex-wrap items-center gap-2">
          <Tag size="sm">{data.category}</Tag>
          <StockStatusBadge status={data.status} />
          {data.lifecycle === 'discontinued' && (
            <Tag tone="neutral" size="sm">
              {t('discontinued')}
            </Tag>
          )}
        </div>
      )}
      <SectionCard>
        {data ? (
          <StatStrip
            items={[
              { key: 'onHand', label: t('kpis.onHand'), value: qty(data.onHand) },
              {
                key: 'available',
                label: t('kpis.available'),
                value: qty(data.available),
                hint: t('kpis.reserved', { count: data.reserved }),
              },
              {
                key: 'point',
                label: t('kpis.reorderPoint'),
                value: qty(data.reorderPoint),
                hint: t('kpis.reorderQty', { qty: qty(data.reorderQty) }),
              },
              {
                key: 'value',
                label: t('kpis.value'),
                value: usd(data.onHand * data.unitCost),
                hint: t('kpis.unitCost', { cost: usdCents(data.unitCost) }),
              },
            ]}
          />
        ) : (
          <Skeleton className="h-20 w-full" />
        )}
      </SectionCard>

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_24rem]">
        <div className="min-w-0 space-y-6">
          <SectionCard title={t('locations.title')} description={t('locations.description')}>
            {data ? (
              <ul className="space-y-4">
                {data.levels.map((level) => (
                  <li
                    key={`${level.warehouse}-${level.bin}`}
                    className="grid items-center gap-3 sm:grid-cols-[14rem_1fr_7rem]"
                  >
                    <div>
                      <p className="text-sm font-medium">{level.warehouseName}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {level.warehouse} · {level.bin}
                      </p>
                    </div>
                    <div className="flex h-2.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${((level.onHand - level.reserved) / maxLevel) * 100}%` }}
                      />
                      <div
                        className="h-full bg-primary/35"
                        style={{ width: `${(level.reserved / maxLevel) * 100}%` }}
                      />
                    </div>
                    <p className="text-right text-sm tabular-nums">
                      <span className="font-medium">{qty(level.onHand)}</span>
                      <span className="text-xs text-muted-foreground">
                        {' '}
                        · {t('locations.reserved', { count: level.reserved })}
                      </span>
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <Skeleton className="h-32 w-full" />
            )}
          </SectionCard>

          <SectionCard flush title={t('ledger.title')} description={t('ledger.description')}>
            <div className="overflow-x-auto border-t">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="bg-muted/30 text-xs text-muted-foreground">
                    <th className="h-11 px-6 text-left font-medium">{t('ledger.type')}</th>
                    <th className="px-3 text-left font-medium">{t('ledger.when')}</th>
                    <th className="px-3 text-left font-medium">{t('ledger.warehouse')}</th>
                    <th className="px-3 text-left font-medium">{t('ledger.reference')}</th>
                    <th className="px-3 text-left font-medium">{t('ledger.user')}</th>
                    <th className="px-6 text-right font-medium">{t('ledger.quantity')}</th>
                  </tr>
                </thead>
                <tbody>
                  {!data &&
                    Array.from({ length: 6 }, (_, i) => (
                      <tr key={i}>
                        <td colSpan={6} className="px-6 py-2">
                          <Skeleton className="h-8 w-full" />
                        </td>
                      </tr>
                    ))}
                  {data?.movements.map((m) => (
                    <tr key={m.id} className="border-t">
                      <td className="px-6 py-2.5">
                        <MovementType type={m.type} quantity={m.quantity} />
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                        {dateTime(m.at)}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-xs">{m.warehouse}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{m.reference}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{m.user}</td>
                      <td
                        className={cn(
                          'px-6 py-2.5 text-right font-medium tabular-nums',
                          m.quantity >= 0 ? 'text-success' : 'text-foreground',
                        )}
                      >
                        {signed(m.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6 xl:sticky xl:top-24">
          <SectionCard title={t('suppliers.title')}>
            {data ? (
              <ul className="-my-1 divide-y">
                {data.suppliers.map((s) => (
                  <li key={s.id} className="flex items-start justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 text-sm font-medium">
                        {s.preferred && (
                          <Star
                            className="size-3.5 fill-warning text-warning"
                            aria-label={t('suppliers.preferred')}
                          />
                        )}
                        <span className="truncate">{s.name}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('suppliers.meta', { days: s.leadTimeDays, rate: s.onTimeRate })}
                      </p>
                    </div>
                    <p className="text-sm font-medium tabular-nums">{usdCents(s.unitCost)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <Skeleton className="h-24 w-full" />
            )}
          </SectionCard>
          <SectionCard title={t('reorder.title')} description={t('reorder.description')}>
            {data ? <ReorderSettingsForm item={data} /> : <Skeleton className="h-60 w-full" />}
          </SectionCard>
        </div>
      </div>

      <AdjustStockDialog
        open={adjusting}
        onOpenChange={setAdjusting}
        skus={[sku]}
        defaultWarehouse={data?.levels[0]?.warehouse ?? 'RNO'}
        onDone={() => notify.success(t('adjusted', { sku }))}
      />
    </Page>
  );
}
