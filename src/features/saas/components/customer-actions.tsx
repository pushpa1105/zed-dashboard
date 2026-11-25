import { useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { SegmentedControl } from '@/shared/components/forms/segmented-control';
import { formatDate } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/shared/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

import { useChangeCustomerPlan, useExtendTrial } from '../api/admin-api';
import { CUSTOMER_PLANS, type CustomerDetail, type CustomerPlan } from '../model/admin';

const TRIAL_DAYS = ['7', '14', '30'] as const;

/** Support-side account actions. Each one is a mutation against the API. */
export function CustomerActions({ customer }: { customer: CustomerDetail }) {
  const { t } = useTranslation('saas');
  const changePlan = useChangeCustomerPlan();
  const extendTrial = useExtendTrial();
  const [plan, setPlan] = useState<CustomerPlan>(customer.plan);
  const [days, setDays] = useState<(typeof TRIAL_DAYS)[number]>('14');

  return (
    <SectionCard title={t('customer.actions.title')} description={t('customer.actions.hint')}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="customer-plan">{t('customer.actions.plan')}</FieldLabel>
          <div className="flex gap-2">
            <Select value={plan} onValueChange={(v) => setPlan(v as CustomerPlan)}>
              <SelectTrigger id="customer-plan" className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CUSTOMER_PLANS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {t(`customers.plans.${p}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              disabled={plan === customer.plan || changePlan.isPending}
              onClick={() => changePlan.mutate({ id: customer.id, plan })}
            >
              {t('customer.actions.apply')}
            </Button>
          </div>
        </Field>
        <Field>
          <FieldLabel>{t('customer.actions.trial')}</FieldLabel>
          <FieldDescription>
            {customer.trialEndsAt
              ? t('customer.actions.trialEnds', {
                  date: formatDate(customer.trialEndsAt, 'MMM D, YYYY'),
                })
              : t('customer.actions.noTrial')}
          </FieldDescription>
          <div className="flex gap-2">
            <SegmentedControl
              aria-label={t('customer.actions.trial')}
              value={days}
              onChange={setDays}
              options={TRIAL_DAYS.map((d) => ({
                value: d,
                label: t('customer.actions.days', { count: +d }),
              }))}
              className="flex-1"
              block
            />
            <Button
              variant="outline"
              disabled={extendTrial.isPending}
              onClick={() => extendTrial.mutate({ id: customer.id, days: +days })}
            >
              {t('customer.actions.extend')}
            </Button>
          </div>
        </Field>
      </FieldGroup>
    </SectionCard>
  );
}
