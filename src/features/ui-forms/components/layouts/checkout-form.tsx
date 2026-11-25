import { zodResolver } from '@hookform/resolvers/zod';
import { CreditCard, Lock, Package, Rocket, Truck } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { FormField } from '@/core/forms/form-field';
import { useTranslation } from '@/core/i18n/use-translation';
import { notify } from '@/core/notify/notify';
import { useDemoSubmit } from '@/features/ui-forms/api/ui-forms-api';
import { RadioCards } from '@/shared/components/forms/choice-cards';
import { MaskedInput } from '@/shared/components/forms/masked-input';
import { cardBrand, luhnValid, MASKS, unmask } from '@/shared/components/forms/masks';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Separator } from '@/shared/ui/separator';
import { Spinner } from '@/shared/ui/spinner';

const ITEMS = [
  { name: 'Aero Running Shoe', variant: 'Size 42 · Slate', qty: 1, price: 129 },
  { name: 'Merino Crew Sock (3-pack)', variant: 'Charcoal', qty: 2, price: 24 },
];
const SHIPPING = { standard: 0, express: 12, overnight: 29 } as const;
const COUNTRIES = ['United States', 'United Kingdom', 'Germany', 'Nepal', 'Japan', 'Australia'];

const schema = z.object({
  email: z.string().trim().email('validation.email'),
  name: z.string().trim().min(2, 'validation.required'),
  address: z.string().trim().min(4, 'validation.required'),
  city: z.string().trim().min(2, 'validation.required'),
  postcode: z.string().trim().min(3, 'validation.required'),
  country: z.string().min(1, 'validation.required'),
  shipping: z.enum(['standard', 'express', 'overnight']),
  card: z.string().refine((v) => luhnValid(unmask(v)), 'ui-forms:checkout.cardInvalid'),
  expiry: z.string().refine((v) => {
    const [mm, yy] = v.split('/').map(Number);
    if (!mm || yy === undefined || mm > 12) return false;
    const now = new Date();
    const year = 2000 + yy;
    return year > now.getFullYear() || (year === now.getFullYear() && mm >= now.getMonth() + 1);
  }, 'ui-forms:checkout.expiryInvalid'),
  cvc: z.string().regex(/^\d{3,4}$/, 'ui-forms:checkout.cvcInvalid'),
  billingSame: z.boolean(),
});
type Checkout = z.infer<typeof schema>;

const money = (n: number) =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n);

/** Checkout: contact, address, shipping choice, formatted card fields and a live summary. */
export function CheckoutForm() {
  const { t } = useTranslation('ui-forms');
  const form = useForm<Checkout>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      name: '',
      address: '',
      city: '',
      postcode: '',
      country: 'United States',
      shipping: 'standard',
      card: '',
      expiry: '',
      cvc: '',
      billingSame: true,
    },
  });
  const [shipping, card] = useWatch({ control: form.control, name: ['shipping', 'card'] });
  const submit = useDemoSubmit({
    onSuccess: () => {
      notify.success(t('checkout.paid'), { description: t('checkout.paidDescription') });
      form.reset();
    },
  });

  const subtotal = ITEMS.reduce((sum, item) => sum + item.qty * item.price, 0);
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  const total = subtotal + SHIPPING[shipping] + tax;
  const brand = cardBrand(unmask(card));

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(({ card: _c, cvc: _v, ...rest }) => submit.mutate(rest))}
      className="grid gap-8 lg:grid-cols-[1fr_20rem]"
    >
      <div className="space-y-8">
        <fieldset className="space-y-4">
          <legend className="mb-3 text-sm font-semibold">{t('checkout.contact')}</legend>
          <FormField
            control={form.control}
            name="email"
            label={t('checkout.email')}
            render={({ field, id, invalid }) => (
              <Input id={id} type="email" autoComplete="email" aria-invalid={invalid} {...field} />
            )}
          />
        </fieldset>

        <fieldset className="grid gap-4 sm:grid-cols-6">
          <legend className="mb-3 text-sm font-semibold">{t('checkout.shippingAddress')}</legend>
          <FormField
            control={form.control}
            name="name"
            label={t('checkout.fullName')}
            className="sm:col-span-6"
            render={({ field, id, invalid }) => (
              <Input id={id} autoComplete="name" aria-invalid={invalid} {...field} />
            )}
          />
          <FormField
            control={form.control}
            name="address"
            label={t('checkout.address')}
            className="sm:col-span-6"
            render={({ field, id, invalid }) => (
              <Input id={id} autoComplete="street-address" aria-invalid={invalid} {...field} />
            )}
          />
          <FormField
            control={form.control}
            name="city"
            label={t('checkout.city')}
            className="sm:col-span-3"
            render={({ field, id, invalid }) => (
              <Input id={id} autoComplete="address-level2" aria-invalid={invalid} {...field} />
            )}
          />
          <FormField
            control={form.control}
            name="postcode"
            label={t('checkout.postcode')}
            className="sm:col-span-1"
            render={({ field, id, invalid }) => (
              <Input id={id} autoComplete="postal-code" aria-invalid={invalid} {...field} />
            )}
          />
          <FormField
            control={form.control}
            name="country"
            label={t('checkout.country')}
            className="sm:col-span-2"
            render={({ field, id }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id={id} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </fieldset>

        <fieldset>
          <legend className="mb-3 text-sm font-semibold">{t('checkout.delivery')}</legend>
          <FormField
            control={form.control}
            name="shipping"
            render={({ field }) => (
              <RadioCards
                value={field.value}
                onChange={field.onChange}
                columns={3}
                options={[
                  {
                    value: 'standard',
                    title: t('checkout.standard'),
                    description: t('checkout.standardEta'),
                    icon: <Package />,
                    meta: t('checkout.free'),
                  },
                  {
                    value: 'express',
                    title: t('checkout.express'),
                    description: t('checkout.expressEta'),
                    icon: <Truck />,
                    meta: money(SHIPPING.express),
                  },
                  {
                    value: 'overnight',
                    title: t('checkout.overnight'),
                    description: t('checkout.overnightEta'),
                    icon: <Rocket />,
                    meta: money(SHIPPING.overnight),
                  },
                ]}
              />
            )}
          />
        </fieldset>

        <fieldset className="grid gap-4 sm:grid-cols-4">
          <legend className="mb-3 flex items-center gap-2 text-sm font-semibold">
            {t('checkout.payment')}
            <span className="inline-flex items-center gap-1 text-xs font-normal text-muted-foreground">
              <Lock className="size-3" /> {t('checkout.secure')}
            </span>
          </legend>
          <FormField
            control={form.control}
            name="card"
            label={t('checkout.cardNumber')}
            className="sm:col-span-4"
            render={({ field, id, invalid }) => (
              <MaskedInput
                id={id}
                mask={MASKS.card}
                autoComplete="cc-number"
                invalid={invalid}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                leading={<CreditCard className="size-4" />}
                trailing={
                  brand && (
                    <span className="rounded border px-1.5 text-[0.625rem] font-semibold tracking-wider uppercase">
                      {brand}
                    </span>
                  )
                }
              />
            )}
          />
          <FormField
            control={form.control}
            name="expiry"
            label={t('checkout.expiry')}
            className="sm:col-span-2"
            render={({ field, id, invalid }) => (
              <MaskedInput
                id={id}
                mask={MASKS.expiry}
                placeholder="MM/YY"
                autoComplete="cc-exp"
                invalid={invalid}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
          <FormField
            control={form.control}
            name="cvc"
            label={t('checkout.cvc')}
            className="sm:col-span-2"
            render={({ field, id, invalid }) => (
              <MaskedInput
                id={id}
                mask={MASKS.cvc}
                placeholder="123"
                autoComplete="cc-csc"
                invalid={invalid}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
          <FormField
            control={form.control}
            name="billingSame"
            className="sm:col-span-4"
            render={({ field, id }) => (
              <div className="flex items-center gap-2">
                <Checkbox
                  id={id}
                  checked={field.value}
                  onCheckedChange={(c) => field.onChange(c === true)}
                />
                <Label htmlFor={id} className="font-normal">
                  {t('checkout.billingSame')}
                </Label>
              </div>
            )}
          />
        </fieldset>
        <p className="text-xs text-muted-foreground">{t('checkout.testCard')}</p>
      </div>

      <aside className="h-fit space-y-4 rounded-xl border bg-muted/30 p-5 lg:sticky lg:top-24">
        <h3 className="text-sm font-semibold">{t('checkout.summary')}</h3>
        <ul className="space-y-3">
          {ITEMS.map((item) => (
            <li key={item.name} className="flex gap-3 text-sm">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-lg border bg-background text-muted-foreground">
                <Package className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{item.name}</span>
                <span className="text-xs text-muted-foreground">
                  {item.variant} · ×{item.qty}
                </span>
              </span>
              <span className="tabular-nums">{money(item.qty * item.price)}</span>
            </li>
          ))}
        </ul>
        <Separator />
        <dl className="space-y-2 text-sm">
          {[
            [t('checkout.subtotal'), money(subtotal)],
            [
              t('checkout.shippingCost'),
              SHIPPING[shipping] ? money(SHIPPING[shipping]) : t('checkout.free'),
            ],
            [t('checkout.tax'), money(tax)],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="tabular-nums">{v}</dd>
            </div>
          ))}
          <Separator />
          <div className="flex justify-between text-base font-semibold">
            <dt>{t('checkout.total')}</dt>
            <dd className="tabular-nums">{money(total)}</dd>
          </div>
        </dl>
        <Button type="submit" size="lg" className="w-full" disabled={submit.isPending}>
          {submit.isPending ? <Spinner /> : <Lock />}
          {t('checkout.pay', { amount: money(total) })}
        </Button>
      </aside>
    </form>
  );
}
