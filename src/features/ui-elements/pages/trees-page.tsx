import { ArrowRight, Search } from 'lucide-react';
import { useState } from 'react';

import { routes } from '@/core/config/routes';
import { useTranslation } from '@/core/i18n/use-translation';
import { Link } from '@/core/router/router';
import { Tag } from '@/shared/components/display/tag';
import { FileTree } from '@/shared/components/tree/file-tree';
import { OrgChart } from '@/shared/components/tree/org-chart';
import { Tree } from '@/shared/components/tree/tree';
import { TreeTable } from '@/shared/components/tree/tree-table';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

import { ElementsPage } from '../components/elements-page';
import { Demo, ShowcaseGrid } from '../components/showcase';
import { budgetRows, departments, lazyRegions, orgRoot, projectFiles } from '../data/tree-samples';

const money = (n: number) =>
  n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export default function TreesPage() {
  const { t } = useTranslation('ui-elements');
  const [selected, setSelected] = useState<string | null>('web');
  const [checked, setChecked] = useState<Set<string>>(() => new Set(['web', 'mobile', 'emea']));
  const [query, setQuery] = useState('eng');
  const [fileSelected, setFileSelected] = useState<string | null>('orders/index.ts');

  return (
    <ElementsPage page="trees">
      <ShowcaseGrid cols={3}>
        <Demo id="treeLines">
          <Tree
            aria-label={t('sections.treeLines.title')}
            items={departments}
            variant="lines"
            selectedId={selected}
            onSelect={(item) => setSelected(item.id)}
            defaultExpanded={['product', 'apps']}
          />
          <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">
            {t('treesUi.selected')}:{' '}
            <span className="font-medium text-foreground">{selected ?? t('treesUi.none')}</span>
          </p>
        </Demo>
        <Demo id="treeCheckable">
          <Tree
            aria-label={t('sections.treeCheckable.title')}
            items={departments}
            variant="lines"
            checkable
            checked={checked}
            onCheckedChange={setChecked}
            defaultExpanded={['product', 'apps', 'gtm', 'sales']}
          />
          <p className="mt-3 border-t pt-3 text-xs text-muted-foreground tabular-nums">
            {t('treesUi.checked', { count: checked.size })}
          </p>
        </Demo>
        <Demo id="treeSearch">
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('treesUi.search')}
              className="pl-9"
              aria-label={t('treesUi.search')}
            />
          </div>
          <Tree aria-label={t('sections.treeSearch.title')} items={departments} query={query} />
        </Demo>
      </ShowcaseGrid>

      <ShowcaseGrid cols={3}>
        <Demo id="treeLazy">
          <Tree aria-label={t('sections.treeLazy.title')} items={lazyRegions} variant="lines" />
        </Demo>
        <Demo id="treeReorder">
          <Tree
            aria-label={t('sections.treeReorder.title')}
            items={departments}
            reorderable
            defaultExpanded={['gtm']}
          />
          <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">
            {t('treesUi.orderNote')}
          </p>
        </Demo>
        <Demo id="fileTree">
          <FileTree
            aria-label={t('sections.fileTree.title')}
            items={projectFiles}
            selectedId={fileSelected}
            onSelect={(item) => setFileSelected(item.id)}
            defaultExpanded={['src', 'src/features', 'src/features/orders']}
          />
        </Demo>
      </ShowcaseGrid>

      <Demo id="treeTable">
        <TreeTable
          rows={budgetRows}
          defaultExpanded={['opex', 'people']}
          toolbar
          labels={{ expandAll: t('treeTable.expandAll'), collapseAll: t('treeTable.collapseAll') }}
          columns={[
            { key: 'name', header: t('treeTable.account'), render: (row) => row.name },
            {
              key: 'budget',
              header: t('treeTable.budget'),
              align: 'right',
              render: (row) => money(row.budget),
            },
            {
              key: 'actual',
              header: t('treeTable.actual'),
              align: 'right',
              render: (row) => money(row.actual),
            },
            {
              key: 'variance',
              header: t('treeTable.variance'),
              align: 'right',
              render: (row) => {
                const v = ((row.actual - row.budget) / row.budget) * 100;
                return (
                  <span className={cn('font-medium', v > 0 ? 'text-destructive' : 'text-success')}>
                    {v > 0 ? '+' : ''}
                    {v.toFixed(1)}%
                  </span>
                );
              },
            },
          ]}
        />
      </Demo>

      <Demo id="orgChart">
        <OrgChart
          root={{
            ...orgRoot,
            tag: (
              <Tag tone="primary" size="sm">
                HQ · Lisbon
              </Tag>
            ),
          }}
        />
      </Demo>

      <Demo id="treeInputs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {['TreeSelect', 'Cascader', 'TransferList', 'CheckboxGroup'].map((name) => (
              <Tag key={name} appearance="outline" size="lg">
                {name}
              </Tag>
            ))}
          </div>
          <Button asChild variant="outline">
            <Link to={routes.uiSelects.href()}>
              {t('treesUi.openForms')} <ArrowRight />
            </Link>
          </Button>
        </div>
      </Demo>
    </ElementsPage>
  );
}
