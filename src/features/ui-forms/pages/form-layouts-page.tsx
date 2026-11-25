import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';

import {
  CardSectionsAccountForm,
  DrawerAccountForm,
  GridAccountForm,
  HorizontalAccountForm,
  InlineAccountForm,
  ModalAccountForm,
  SettingsAccountForm,
  StackedAccountForm,
} from '../components/layouts/account-layouts';
import { CheckoutForm } from '../components/layouts/checkout-form';
import { LongForm } from '../components/layouts/long-form';
import { SurveyForm } from '../components/layouts/survey-form';
import { Demo, ShowcaseGrid } from '../components/showcase';
import { UiFormsTabs } from '../components/ui-forms-tabs';

const DEMOS = [
  'stacked',
  'grid',
  'horizontal',
  'inline',
  'cards',
  'settings',
  'modal',
  'drawer',
  'checkout',
  'survey',
  'long',
] as const;

export default function FormLayoutsPage() {
  const { t } = useTranslation('ui-forms');
  const demo = (key: (typeof DEMOS)[number]) => ({
    id: `layout-${key}`,
    title: t(`layouts.demos.${key}.title`),
    description: t(`layouts.demos.${key}.description`),
  });

  return (
    <Page title={t('layouts.title')} description={t('layouts.description')} width="full">
      <UiFormsTabs />
      <nav aria-label={t('layouts.jump')} className="flex flex-wrap gap-2">
        {DEMOS.map((key) => (
          <a
            key={key}
            href={`#layout-${key}`}
            className="inline-flex h-8 items-center rounded-full border bg-card px-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            {t(`layouts.demos.${key}.title`)}
          </a>
        ))}
      </nav>
      <ShowcaseGrid className="gap-6">
        <Demo {...demo('stacked')}>
          <StackedAccountForm />
        </Demo>
        <Demo {...demo('grid')}>
          <GridAccountForm />
        </Demo>
        <Demo {...demo('horizontal')} wide>
          <HorizontalAccountForm />
        </Demo>
        <Demo {...demo('inline')} wide>
          <InlineAccountForm />
        </Demo>
        <Demo {...demo('cards')} wide>
          <CardSectionsAccountForm />
        </Demo>
        <Demo {...demo('settings')} wide>
          <SettingsAccountForm />
        </Demo>
        <Demo {...demo('modal')}>
          <ModalAccountForm />
        </Demo>
        <Demo {...demo('drawer')}>
          <DrawerAccountForm />
        </Demo>
        <Demo {...demo('checkout')} wide>
          <CheckoutForm />
        </Demo>
        <Demo {...demo('survey')} wide>
          <SurveyForm />
        </Demo>
        <Demo {...demo('long')} wide>
          <LongForm />
        </Demo>
      </ShowcaseGrid>
    </Page>
  );
}
