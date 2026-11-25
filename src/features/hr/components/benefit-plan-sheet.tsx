import { Check } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Link } from '@/core/router/router';
import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/sheet';

import { longDate, money } from '../lib/format';
import { BENEFIT_COLOR, type BenefitPlan, type Enrollment } from '../model/workforce';
import { hrRoutes } from '../routes';

import { DotLabel, FactGrid } from './hr-parts';

type BenefitPlanSheetProps = {
  plan: BenefitPlan | undefined;
  enrollments: Enrollment[];
  onOpenChange: (open: boolean) => void;
};

export function BenefitPlanSheet({ plan, enrollments, onOpenChange }: BenefitPlanSheetProps) {
  const { t } = useTranslation('hr');
  const members = plan ? enrollments.filter((e) => e.planIds.includes(plan.id)) : [];

  return (
    <Sheet open={!!plan} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {plan && (
          <>
            <SheetHeader>
              <DotLabel
                color={BENEFIT_COLOR[plan.category]}
                className="text-xs text-muted-foreground"
              >
                {t(`benefits.categories.${plan.category}`)}
              </DotLabel>
              <SheetTitle>{plan.name}</SheetTitle>
              <SheetDescription>{plan.description}</SheetDescription>
            </SheetHeader>
            <div className="space-y-6 px-4 pb-6">
              <FactGrid
                items={[
                  { label: t('benefits.fields.provider'), value: plan.provider },
                  { label: t('benefits.fields.renewal'), value: longDate(plan.renewal) },
                  { label: t('benefits.fields.employerCost'), value: money(plan.employerCost, 0) },
                  { label: t('benefits.fields.employeeCost'), value: money(plan.employeeCost, 0) },
                ]}
              />
              <section className="space-y-2">
                <h3 className="text-sm font-semibold">{t('benefits.coverage')}</h3>
                <ul className="space-y-1.5">
                  {plan.coverage.map((line) => (
                    <li key={line} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                      {line}
                    </li>
                  ))}
                </ul>
              </section>
              <section className="space-y-2">
                <h3 className="text-sm font-semibold">
                  {t('benefits.members', { count: members.length })}
                </h3>
                <ul className="divide-y rounded-lg border">
                  {members.map((m) => (
                    <li key={m.personId}>
                      <Link
                        to={hrRoutes.person.href({ personId: m.personId })}
                        className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted/50"
                      >
                        <InitialsAvatar name={m.name} size="xs" />
                        <span className="min-w-0 flex-1 truncate">{m.name}</span>
                        <span className="text-xs text-muted-foreground">{m.department}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
