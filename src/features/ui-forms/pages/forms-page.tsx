import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { SectionCard } from '@/shared/components/dashboard/section-card';

import { CompanyForm } from '../components/company-form';
import { FieldStates } from '../components/field-states';
import { InputGallery } from '../components/input-gallery';
import { OnboardingWizard } from '../components/onboarding-wizard';
import { UiFormsTabs } from '../components/ui-forms-tabs';

function Heading({ title, text }: { title: string; text: string }) {
  return (
    <div className="space-y-1 pt-4">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

export default function FormsPage() {
  const { t } = useTranslation('ui-forms');

  return (
    <Page title={t('forms.title')} description={t('forms.description')} width="full">
      <UiFormsTabs />

      <SectionCard title={t('company.title')} description={t('company.description')}>
        <div className="pt-4">
          <CompanyForm />
        </div>
      </SectionCard>

      <SectionCard title={t('wizard.title')} description={t('wizard.description')}>
        <div className="pt-4">
          <OnboardingWizard />
        </div>
      </SectionCard>

      <Heading title={t('gallery.title')} text={t('gallery.description')} />
      <InputGallery />

      <Heading title={t('states.title')} text={t('states.description')} />
      <FieldStates />
    </Page>
  );
}
