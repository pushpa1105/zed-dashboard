import { Bell, Percent, Store, Truck } from 'lucide-react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { useSearchParams } from '@/core/router/router';
import { ErrorState } from '@/shared/components/display/error-state';
import {
  VariantTabs,
  VariantTabsContent,
  VariantTabsList,
  VariantTabsTrigger,
} from '@/shared/components/navigation/variant-tabs';
import { Skeleton } from '@/shared/ui/skeleton';

import { settingsQuery, useStoreSettings } from '../api/settings-api';
import { GeneralSettings } from '../components/settings/general-settings';
import { NotificationSettings } from '../components/settings/notification-settings';
import { ShippingSettings } from '../components/settings/shipping-settings';
import { TaxSettings } from '../components/settings/tax-settings';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(settingsQuery());
    return null;
  };

const TABS = [
  { id: 'general', icon: Store },
  { id: 'shipping', icon: Truck },
  { id: 'taxes', icon: Percent },
  { id: 'notifications', icon: Bell },
] as const;

/** Store configuration in four tabs; each tab is its own form saved independently. */
export default function SettingsPage() {
  const { t } = useTranslation('ecommerce');
  const [params, setParams] = useSearchParams();
  const settings = useStoreSettings();
  const tab = TABS.some((x) => x.id === params.get('tab')) ? params.get('tab')! : 'general';
  const data = settings.data;

  return (
    <Page title={t('settings.title')} description={t('settings.description')}>
      <VariantTabs
        variant="vertical"
        value={tab}
        onValueChange={(value) => setParams({ tab: value }, { replace: true })}
      >
        <VariantTabsList aria-label={t('settings.title')}>
          {TABS.map(({ id, icon: Icon }) => (
            <VariantTabsTrigger key={id} value={id}>
              <Icon /> {t(`settings.tabs.${id}`)}
            </VariantTabsTrigger>
          ))}
        </VariantTabsList>
        {settings.isError ? (
          <ErrorState title={t('common.error')} onRetry={() => void settings.refetch()} />
        ) : !data ? (
          <Skeleton className="h-96 flex-1 rounded-xl" />
        ) : (
          <>
            <VariantTabsContent value="general">
              <GeneralSettings initial={data.general} />
            </VariantTabsContent>
            <VariantTabsContent value="shipping">
              <ShippingSettings initial={data.shipping} />
            </VariantTabsContent>
            <VariantTabsContent value="taxes">
              <TaxSettings initial={data.taxes} />
            </VariantTabsContent>
            <VariantTabsContent value="notifications">
              <NotificationSettings initial={data.notifications} />
            </VariantTabsContent>
          </>
        )}
      </VariantTabs>
    </Page>
  );
}
