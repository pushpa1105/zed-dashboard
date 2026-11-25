import { FileSearch } from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { useEnumParam } from '@/core/router/search-params';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { EmptyState } from '@/shared/components/display/empty-state';
import { Tag } from '@/shared/components/display/tag';
import { SearchInput } from '@/shared/components/forms/search-input';
import { SegmentedControl } from '@/shared/components/forms/segmented-control';
import { cn } from '@/shared/lib/cn';
import { Progress } from '@/shared/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { daysUntil, longDate, percent } from '../lib/format';
import { DOCUMENT_KINDS, pendingOf, type HrDocument } from '../model/documents';

import { DocumentRemindButton } from './document-sheet';

const KINDS = ['all', ...DOCUMENT_KINDS] as const;
const STATUSES = ['all', 'pending', 'complete'] as const;

export function DocumentsTable({
  documents,
  onOpen,
}: {
  documents: HrDocument[];
  onOpen: (id: string) => void;
}) {
  const { t } = useTranslation('hr');
  const [kind, setKind] = useEnumParam('kind', KINDS, 'all');
  const [status, setStatus] = useEnumParam('status', STATUSES, 'all');
  const [query, setQuery] = useState('');

  const needle = query.trim().toLowerCase();
  const rows = documents.filter(
    (d) =>
      (kind === 'all' || d.kind === kind) &&
      (status === 'all' || (status === 'pending') === pendingOf(d).length > 0) &&
      d.title.toLowerCase().includes(needle),
  );

  return (
    <SectionCard flush title={t('documents.library')} description={t('documents.libraryHint')}>
      <div className="flex flex-col gap-3 px-6 pb-4 lg:flex-row lg:items-center">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder={t('documents.search')}
          aria-label={t('documents.search')}
          containerClassName="lg:max-w-xs"
        />
        <div className="scrollbar-none flex gap-2 overflow-x-auto lg:ml-auto">
          <SegmentedControl
            size="sm"
            value={kind}
            onChange={setKind}
            options={KINDS.map((value) => ({ value, label: t(`documents.kinds.${value}`) }))}
          />
          <SegmentedControl
            size="sm"
            value={status}
            onChange={setStatus}
            options={STATUSES.map((value) => ({ value, label: t(`documents.status.${value}`) }))}
          />
        </div>
      </div>
      {rows.length ? (
        <Table className="min-w-[50rem] border-t">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-6">{t('documents.columns.document')}</TableHead>
              <TableHead>{t('documents.columns.version')}</TableHead>
              <TableHead>{t('documents.columns.due')}</TableHead>
              <TableHead className="w-48">{t('documents.columns.signed')}</TableHead>
              <TableHead className="pr-6 text-right">
                <span className="sr-only">{t('documents.columns.actions')}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((doc) => {
              const total = doc.acknowledgements.length;
              const signed = total - pendingOf(doc).length;
              const late = signed < total && daysUntil(doc.dueDate) < 0;
              return (
                <TableRow key={doc.id}>
                  <TableCell className="pl-6">
                    <button
                      type="button"
                      onClick={() => onOpen(doc.id)}
                      className="text-left font-medium hover:underline"
                    >
                      {doc.title}
                    </button>
                    <div className="mt-1 flex gap-1.5">
                      <Tag size="sm" tone={doc.kind === 'policy' ? 'primary' : 'aqua'}>
                        {t(`documents.kinds.${doc.kind}`)}
                      </Tag>
                      <Tag size="sm">{t(`documents.categories.${doc.category}`)}</Tag>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">
                    v{doc.version}
                    <span className="block text-xs">{longDate(doc.updatedAt)}</span>
                  </TableCell>
                  <TableCell
                    className={cn(
                      'tabular-nums',
                      late ? 'text-destructive' : 'text-muted-foreground',
                    )}
                  >
                    {longDate(doc.dueDate)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={percent(signed, total)} className="h-1.5" aria-hidden />
                      <span className="text-xs whitespace-nowrap tabular-nums">
                        {signed}/{total}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <DocumentRemindButton doc={doc} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <EmptyState
          variant="plain"
          icon={FileSearch}
          title={t('documents.noMatches')}
          className="border-t py-12"
        />
      )}
    </SectionCard>
  );
}
