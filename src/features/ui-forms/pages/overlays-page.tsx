import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';

import { DialogDemos } from '../components/dialog-demos';
import { MenuDemos } from '../components/menu-demos';
import { PanelDemos } from '../components/panel-demos';
import { ShowcaseGrid } from '../components/showcase';
import { UiFormsTabs } from '../components/ui-forms-tabs';

export default function OverlaysPage() {
  const { t } = useTranslation('ui-forms');

  return (
    <Page title={t('overlays.title')} description={t('overlays.description')} width="full">
      <UiFormsTabs />
      <ShowcaseGrid>
        <DialogDemos />
        <PanelDemos />
        <MenuDemos />
      </ShowcaseGrid>
    </Page>
  );
}
