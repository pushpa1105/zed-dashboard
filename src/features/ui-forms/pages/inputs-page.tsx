import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';

import {
  ChipsDemo,
  FloatingLabelsDemo,
  MasksDemo,
  RichTextDemo,
  SignatureDemo,
  SizesDemo,
  SlidersDemo,
  TogglesDemo,
  TreeSelectDemo,
  UploadsDemo,
  ValidationDemo,
} from '../components/inputs/input-demos';
import { Demo, ShowcaseGrid } from '../components/showcase';
import { UiFormsTabs } from '../components/ui-forms-tabs';

export default function InputsPage() {
  const { t } = useTranslation('ui-forms');
  const demo = (key: string) => ({
    id: `input-${key}`,
    title: t(`inputs.demos.${key}.title` as 'inputs.demos.sizes.title'),
    description: t(`inputs.demos.${key}.description` as 'inputs.demos.sizes.description'),
  });

  return (
    <Page title={t('inputs.title')} description={t('inputs.description')} width="full">
      <UiFormsTabs />
      <ShowcaseGrid>
        <Demo {...demo('sizes')} wide>
          <SizesDemo />
        </Demo>
        <Demo {...demo('floating')}>
          <FloatingLabelsDemo />
        </Demo>
        <Demo {...demo('validation')}>
          <ValidationDemo />
        </Demo>
        <Demo {...demo('masks')} wide>
          <MasksDemo />
        </Demo>
        <Demo {...demo('rich')}>
          <RichTextDemo />
        </Demo>
        <Demo {...demo('signature')}>
          <SignatureDemo />
        </Demo>
        <Demo {...demo('tree')} wide>
          <TreeSelectDemo />
        </Demo>
        <Demo {...demo('chips')}>
          <ChipsDemo />
        </Demo>
        <Demo {...demo('sliders')}>
          <SlidersDemo />
        </Demo>
        <Demo {...demo('toggles')} wide>
          <TogglesDemo />
        </Demo>
        <Demo {...demo('uploads')} wide>
          <UploadsDemo />
        </Demo>
      </ShowcaseGrid>
    </Page>
  );
}
