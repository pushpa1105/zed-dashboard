import { useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';

import { ProductGrid } from '../components/product-grid';
import { TablesNav } from '../components/tables-nav';
import { generateProducts } from '../model/product';

/**
 * AG Grid example. AG Grid is imported only from this route's module, so its
 * (large) chunk is downloaded the first time someone opens this page.
 */
export default function GridTablePage() {
  const { t } = useTranslation('data-tables');
  const [rows] = useState(() => generateProducts(2_000));
  const [selected, setSelected] = useState(0);

  return (
    <Page title={t('title')} description={t('description')} width="full">
      <TablesNav />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">{t('grid.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('grid.description')}</p>
        </div>
        {selected > 0 && (
          <p className="text-sm text-muted-foreground tabular-nums">
            {t('grid.selected', { count: selected })}
          </p>
        )}
      </div>
      <ProductGrid rows={rows} onSelectionChange={setSelected} />
    </Page>
  );
}
